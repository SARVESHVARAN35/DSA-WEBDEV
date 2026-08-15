import cron from 'node-cron';
import { supabaseAdmin } from '../config/supabaseClient.js';
import { evaluateBadgesForAttempt } from '../utils/badges.js';

/**
 * Runs every minute. Any quiz the admin scheduled a results_publish_at
 * for gets flipped to results_published = true once that time arrives,
 * and re-evaluates rank-based badges (e.g. "Top of the Class") now that
 * the final leaderboard is public.
 */
export function startScheduledResultsJob() {
  cron.schedule('* * * * *', async () => {
    const nowIso = new Date().toISOString();

    const { data: due, error } = await supabaseAdmin
      .from('quizzes')
      .select('id')
      .eq('results_published', false)
      .not('results_publish_at', 'is', null)
      .lte('results_publish_at', nowIso);

    if (error || !due?.length) return;

    for (const quiz of due) {
      await supabaseAdmin.from('quizzes').update({ results_published: true }).eq('id', quiz.id);

      const { data: attempts } = await supabaseAdmin
        .from('attempts')
        .select('user_id')
        .eq('quiz_id', quiz.id)
        .eq('status', 'submitted');

      for (const attempt of attempts || []) {
        await evaluateBadgesForAttempt({ userId: attempt.user_id, quizId: quiz.id });
      }

      console.log(`[cron] auto-published results for quiz ${quiz.id}`);
    }
  });
}
