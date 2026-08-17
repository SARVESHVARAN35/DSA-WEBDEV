import { Router } from 'express';
import { supabaseAdmin } from '../config/supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';
import { gradeAnswer, recalculateAttemptScore } from '../utils/scoring.js';
import { evaluateBadgesForAttempt } from '../utils/badges.js';
import { isQuestionReleased } from '../utils/questionSchedule.js';

const router = Router();

async function loadQuizOr404(quizId, res) {
  const { data: quiz, error } = await supabaseAdmin.from('quizzes').select('*').eq('id', quizId).single();
  if (error || !quiz) {
    res.status(404).json({ error: 'Quiz not found.' });
    return null;
  }
  return quiz;
}

function attachAttemptDeadline(attempt, quiz) {
  if (!attempt || !quiz) return attempt;
  const quizEnd = new Date(quiz.end_time).getTime();
  const byDuration = new Date(attempt.started_at).getTime() + Number(quiz.duration_minutes || 0) * 60000;
  return {
    ...attempt,
    expires_at: new Date(Math.min(quizEnd, byDuration)).toISOString(),
  };
}

function getNextQuestionAvailableAt(questions, now = new Date()) {
  const upcoming = (questions || [])
    .map((question) => question.available_at)
    .filter((value) => value && new Date(value) > now)
    .sort((a, b) => new Date(a) - new Date(b));
  return upcoming[0] || null;
}

function hasReleasedQuestionAfter(questions, submittedAt, now = new Date()) {
  if (!submittedAt) return false;
  const submittedTime = new Date(submittedAt).getTime();
  return (questions || []).some((question) => {
    if (!question.available_at) return false;
    const availableTime = new Date(question.available_at).getTime();
    return availableTime > submittedTime && availableTime <= now.getTime();
  });
}

// ---------------------------------------------------------------------
// POST /api/attempts/quizzes/:quizId/start
// Starts (or resumes) the caller's attempt. Enforced entirely server-side
// against the quiz's prescribed time window — a user cannot start early,
// late, or attempt a quiz twice.
// ---------------------------------------------------------------------
router.post('/quizzes/:quizId/start', requireAuth, async (req, res) => {
  const quiz = await loadQuizOr404(req.params.quizId, res);
  if (!quiz) return;

  if (!quiz.is_published) return res.status(403).json({ error: 'This quiz is not open yet.' });

  const now = new Date();
  if (now < new Date(quiz.start_time)) return res.status(403).json({ error: 'This quiz has not started yet.' });
  if (now > new Date(quiz.end_time)) return res.status(403).json({ error: 'This quiz has already ended.' });

  const isPractice = req.user.profile.role === 'admin';
  let quizQuestions = [];

  if (!isPractice) {
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('questions')
      .select('id, available_at')
      .eq('quiz_id', quiz.id);

    if (questionsError) return res.status(500).json({ error: questionsError.message });
    quizQuestions = questions || [];

    const releasedQuestions = quizQuestions.filter((question) => isQuestionReleased(question, now));
    if (releasedQuestions.length === 0) {
      return res.status(403).json({
        error: 'Come again when the next scheduled question is available.',
        next_question_available_at: getNextQuestionAvailableAt(quizQuestions, now) || quiz.start_time,
      });
    }
  }

  if (isPractice) {
    const { data: attempt, error } = await supabaseAdmin
      .from('attempts')
      .insert({ quiz_id: quiz.id, user_id: req.user.profile.id, max_score: quiz.total_points, is_practice: true })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ attempt: attachAttemptDeadline(attempt, quiz) });
  }

  const { data: existing } = await supabaseAdmin
    .from('attempts')
    .select('*')
    .eq('quiz_id', quiz.id)
    .eq('user_id', req.user.profile.id)
    .eq('is_practice', false)
    .maybeSingle();

  if (existing) {
    if (existing.status === 'submitted') {
      if (hasReleasedQuestionAfter(quizQuestions, existing.submitted_at, now)) {
        const { data: reopened, error } = await supabaseAdmin
          .from('attempts')
          .update({ status: 'in_progress', submitted_at: null })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) return res.status(500).json({ error: error.message });
        return res.json({ attempt: attachAttemptDeadline(reopened, quiz) });
      }

      return res.status(409).json({ error: 'You have already submitted this quiz.', attempt: existing });
    }
    return res.json({ attempt: attachAttemptDeadline(existing, quiz) }); // resume in-progress attempt
  }

  const { data: attempt, error } = await supabaseAdmin
    .from('attempts')
    .insert({ quiz_id: quiz.id, user_id: req.user.profile.id, max_score: quiz.total_points, is_practice: false })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ attempt: attachAttemptDeadline(attempt, quiz) });
});

async function loadOwnAttemptOr403(req, res) {
  const { data: attempt, error } = await supabaseAdmin.from('attempts').select('*').eq('id', req.params.id).single();
  if (error || !attempt) {
    res.status(404).json({ error: 'Attempt not found.' });
    return null;
  }
  if (attempt.user_id !== req.user.profile.id) {
    res.status(403).json({ error: 'This is not your attempt.' });
    return null;
  }
  return attempt;
}

router.get('/:id/review', requireAuth, async (req, res) => {
  const attempt = await loadOwnAttemptOr403(req, res);
  if (!attempt) return;

  if (attempt.status !== 'submitted') {
    return res.status(409).json({ error: 'Submit this attempt before reviewing it.' });
  }

  const [
    { data: questions, error: questionsError },
    { data: answers, error: answersError },
  ] = await Promise.all([
    supabaseAdmin
      .from('questions')
      .select('id, question_text, option_a, option_b, option_c, option_d, correct_option, marks, question_duration_seconds, position')
      .eq('quiz_id', attempt.quiz_id)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true }),
    supabaseAdmin
      .from('attempt_answers')
      .select('*')
      .eq('attempt_id', attempt.id),
  ]);

  if (questionsError) return res.status(500).json({ error: questionsError.message });
  if (answersError) return res.status(500).json({ error: answersError.message });

  const answersByQuestion = new Map((answers || []).map((row) => [row.question_id, row]));
  const review = (questions || []).map((question) => {
    const answer = answersByQuestion.get(question.id);
    return {
      id: question.id,
      answer_id: answer?.id || null,
      question_id: question.id,
      question_text: question.question_text,
      selected_option: answer?.selected_option || null,
      correct_option: question.correct_option,
      is_correct: Boolean(answer?.is_correct),
      is_attempted: Boolean(answer),
      marks_awarded: answer?.marks_awarded || 0,
      question_marks: question.marks || 0,
      question_duration_seconds: question.question_duration_seconds || 30,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      answered_at: answer?.answered_at || null,
    };
  });

  const attemptedCount = review.filter((item) => item.is_attempted).length;
  const notAttemptedCount = review.length - attemptedCount;

  res.json({
    attempt,
    review,
    score: attempt.score,
    max_score: attempt.max_score,
    attempted_count: attemptedCount,
    not_attempted_count: notAttemptedCount,
  });
});

// ---------------------------------------------------------------------
// POST /api/attempts/:id/answer  { question_id, selected_option }
// Every answer is validated against the question row stored in the
// database — the client never decides correctness or marks.
// ---------------------------------------------------------------------
router.post('/:id/answer', requireAuth, async (req, res) => {
  const attempt = await loadOwnAttemptOr403(req, res);
  if (!attempt) return;
  if (attempt.status !== 'in_progress') return res.status(409).json({ error: 'This attempt is already submitted.' });

  const quiz = await loadQuizOr404(attempt.quiz_id, res);
  if (!quiz) return;

  const now = new Date();
  const hardDeadline = new Date(Math.min(
    new Date(quiz.end_time).getTime(),
    new Date(attempt.started_at).getTime() + quiz.duration_minutes * 60000
  ));
  if (now > hardDeadline) return res.status(403).json({ error: 'Time is up for this quiz.' });

  const { question_id, selected_option } = req.body;
  if (!question_id || !['a', 'b', 'c', 'd'].includes(selected_option)) {
    return res.status(400).json({ error: 'question_id and a valid selected_option (a-d) are required.' });
  }

  let graded;
  try {
    graded = await gradeAnswer({ questionId: question_id, selectedOption: selected_option });
  } catch (e) {
    return res.status(404).json({ error: e.message });
  }

  if (graded.question.quiz_id !== attempt.quiz_id) {
    return res.status(400).json({ error: 'Question does not belong to this quiz.' });
  }

  if (!isQuestionReleased(graded.question)) {
    return res.status(403).json({ error: 'This question is not available yet.' });
  }

  const { data: saved, error } = await supabaseAdmin
    .from('attempt_answers')
    .upsert(
      {
        attempt_id: attempt.id,
        question_id,
        selected_option,
        is_correct: graded.isCorrect,
        marks_awarded: graded.marksAwarded,
      },
      { onConflict: 'attempt_id,question_id' }
    )
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Never reveal correctness while the attempt (or the quiz's results) aren't
  // meant to be visible — the frontend only shows an "answer saved" state.
  res.json({ saved: true, answer_id: saved.id });
});

// ---------------------------------------------------------------------
// POST /api/attempts/:id/submit — finalizes the attempt and scores it.
// ---------------------------------------------------------------------
router.post('/:id/submit', requireAuth, async (req, res) => {
  const attempt = await loadOwnAttemptOr403(req, res);
  if (!attempt) return;
  if (attempt.status === 'submitted') return res.status(409).json({ error: 'Already submitted.' });

  const { data: questions, error: questionsError } = await supabaseAdmin
    .from('questions')
    .select('id, available_at')
    .eq('quiz_id', attempt.quiz_id);

  if (questionsError) return res.status(500).json({ error: questionsError.message });

  const nextQuestionAt = getNextQuestionAvailableAt(questions, new Date());
  if (nextQuestionAt) {
    return res.json({
      partial: true,
      next_question_available_at: nextQuestionAt,
      message: 'Your answers are saved. Come again when the next scheduled question is available.',
    });
  }

  const { data: updated, error } = await supabaseAdmin
    .from('attempts')
    .update({ status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('id', attempt.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  const finalAttempt = await recalculateAttemptScore(attempt.id);
  const newBadges = await evaluateBadgesForAttempt({ attemptId: attempt.id });

  res.json({ attempt: finalAttempt, newBadges });
});

// ---------------------------------------------------------------------
// GET /api/attempts/mine — the caller's quiz history / achievements.
// Scores are withheld until the admin has published that quiz's results.
// ---------------------------------------------------------------------
router.get('/mine', requireAuth, async (req, res) => {
  const { data: attempts, error } = await supabaseAdmin
    .from('attempts')
    .select('*, quizzes(id, title, category, results_published, results_publish_at, total_points)')
    .eq('user_id', req.user.profile.id)
    .eq('is_practice', false)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const now = new Date();
  const shaped = attempts.map((a) => {
    const resultsVisible =
      a.quizzes.results_published ||
      (a.quizzes.results_publish_at && new Date(a.quizzes.results_publish_at) <= now);
    return {
      id: a.id,
      quiz_id: a.quiz_id,
      quiz_title: a.quizzes.title,
      category: a.quizzes.category,
      status: a.status,
      submitted_at: a.submitted_at,
      max_score: a.max_score,
      results_visible: resultsVisible,
      score: resultsVisible ? a.score : null,
    };
  });

  res.json({ attempts: shaped });
});

export default router;
