import { Router } from 'express';
import { supabaseAdmin } from '../config/supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = Router();

async function refreshQuizTotalPoints(quizId) {
  const { data: questions } = await supabaseAdmin.from('questions').select('marks').eq('quiz_id', quizId);
  const total = (questions || []).reduce((sum, q) => sum + q.marks, 0);
  await supabaseAdmin.from('quizzes').update({ total_points: total }).eq('id', quizId);
}

// POST /api/quizzes/:quizId/questions — add a question (admin sets marks/points)
router.post('/quizzes/:quizId/questions', requireAuth, requireAdmin, async (req, res) => {
  const { question_text, option_a, option_b, option_c, option_d, correct_option, marks, position, available_at, question_duration_seconds } = req.body;

  if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_option) {
    return res.status(400).json({ error: 'question_text, all four options and correct_option are required.' });
  }
  if (!['a', 'b', 'c', 'd'].includes(correct_option)) {
    return res.status(400).json({ error: 'correct_option must be one of a, b, c, d.' });
  }

  const { data, error } = await supabaseAdmin
    .from('questions')
    .insert({
      quiz_id: req.params.quizId,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_option,
      marks: marks && marks > 0 ? marks : 1,
      position: position ?? 0,
      available_at: available_at || null,
      question_duration_seconds: question_duration_seconds && Number(question_duration_seconds) > 0 ? Number(question_duration_seconds) : 30,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await refreshQuizTotalPoints(req.params.quizId);
  res.status(201).json({ question: data });
});

// PUT /api/questions/:id — edit a question (admin)
router.put('/questions/:id', requireAuth, requireAdmin, async (req, res) => {
  const allowed = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option', 'marks', 'position', 'available_at', 'question_duration_seconds'];
  const updates = {};
  for (const key of allowed) if (key in req.body) {
    updates[key] = key === 'question_duration_seconds'
      ? (Number(req.body[key]) > 0 ? Number(req.body[key]) : 30)
      : req.body[key];
  }

  const { data, error } = await supabaseAdmin
    .from('questions')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  if ('marks' in updates) await refreshQuizTotalPoints(data.quiz_id);
  res.json({ question: data });
});

// DELETE /api/questions/:id — (admin)
router.delete('/questions/:id', requireAuth, requireAdmin, async (req, res) => {
  const { data: question } = await supabaseAdmin.from('questions').select('quiz_id').eq('id', req.params.id).single();
  const { error } = await supabaseAdmin.from('questions').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });

  if (question) await refreshQuizTotalPoints(question.quiz_id);
  res.status(204).send();
});

export default router;
