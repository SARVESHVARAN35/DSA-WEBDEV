import { supabaseAdmin } from '../config/supabaseClient.js';

/**
 * Evaluates a user's badge eligibility for a specific quiz attempt and
 * awards any newly-earned badges. Safe to call multiple times — it never
 * awards the same badge twice for the same quiz (unique constraint on
 * user_badges(user_id, badge_id, quiz_id)).
 */
export async function evaluateBadgesForAttempt({ userId, quizId }) {
  const { data: badges } = await supabaseAdmin.from('badges').select('*');
  if (!badges?.length) return [];

  const { data: attempt } = await supabaseAdmin
    .from('attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('quiz_id', quizId)
    .single();

  if (!attempt || attempt.status !== 'submitted') return [];

  const percent = attempt.max_score > 0 ? (attempt.score / attempt.max_score) * 100 : 0;

  const { count: quizCount } = await supabaseAdmin
    .from('attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'submitted');

  // Rank on this quiz's leaderboard (only meaningful once results are published,
  // but we compute it regardless — the badge is only awarded when eligible).
  const { data: leaderboard } = await supabaseAdmin
    .from('attempts')
    .select('user_id, score, submitted_at')
    .eq('quiz_id', quizId)
    .eq('status', 'submitted')
    .order('score', { ascending: false })
    .order('submitted_at', { ascending: true });

  const rank = (leaderboard || []).findIndex((a) => a.user_id === userId) + 1;

  const newlyAwarded = [];

  for (const badge of badges) {
    let eligible = false;
    switch (badge.criteria_type) {
      case 'perfect_score':
        eligible = percent >= 100;
        break;
      case 'high_scorer':
        eligible = percent >= badge.criteria_value;
        break;
      case 'top_rank':
        eligible = rank > 0 && rank <= badge.criteria_value;
        break;
      case 'quiz_count':
        eligible = (quizCount || 0) >= badge.criteria_value;
        break;
      default:
        eligible = false;
    }

    if (!eligible) continue;

    const { error, data } = await supabaseAdmin
      .from('user_badges')
      .insert({ user_id: userId, badge_id: badge.id, quiz_id: badge.criteria_type === 'quiz_count' ? null : quizId })
      .select()
      .maybeSingle();

    // Ignore unique-constraint conflicts (already awarded); surface real errors only.
    if (!error && data) newlyAwarded.push({ ...badge, quiz_id: data.quiz_id });
  }

  return newlyAwarded;
}
