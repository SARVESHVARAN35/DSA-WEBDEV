import { supabaseAdmin } from '../config/supabaseClient.js';

/**
 * Grades one submitted answer strictly from the database's stored
 * correct_option/marks — the client never supplies correctness or marks.
 */
export async function gradeAnswer({ questionId, selectedOption }) {
  const { data: question, error } = await supabaseAdmin
    .from('questions')
    .select('id, correct_option, marks, quiz_id')
    .eq('id', questionId)
    .single();

  if (error || !question) {
    throw new Error('Question not found.');
  }

  const isCorrect = !!selectedOption && selectedOption === question.correct_option;
  const marksAwarded = isCorrect ? question.marks : 0;

  return { question, isCorrect, marksAwarded };
}

/** Recomputes and stores an attempt's total score from its saved answers. */
export async function recalculateAttemptScore(attemptId) {
  const { data: answers, error } = await supabaseAdmin
    .from('attempt_answers')
    .select('marks_awarded')
    .eq('attempt_id', attemptId);

  if (error) throw error;

  const score = answers.reduce((sum, a) => sum + a.marks_awarded, 0);

  const { data: attempt, error: updateError } = await supabaseAdmin
    .from('attempts')
    .update({ score })
    .eq('id', attemptId)
    .select()
    .single();

  if (updateError) throw updateError;
  return attempt;
}
