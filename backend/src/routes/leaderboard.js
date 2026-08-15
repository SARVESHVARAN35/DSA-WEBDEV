import { Router } from 'express';
import { supabaseAdmin } from '../config/supabaseClient.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/quizzes/:id/leaderboard
router.get('/:id/leaderboard', optionalAuth, async (req, res) => {
  const isAdmin = req.user?.profile?.role === 'admin';

  const { data: quiz, error: quizError } = await supabaseAdmin
    .from('quizzes')
    .select('id, title, results_published, results_publish_at, total_points')
    .eq('id', req.params.id)
    .single();

  if (quizError || !quiz) return res.status(404).json({ error: 'Quiz not found.' });

  const now = new Date();
  const resultsVisible =
    isAdmin || quiz.results_published || (quiz.results_publish_at && new Date(quiz.results_publish_at) <= now);

  if (!resultsVisible) {
    return res.status(403).json({
      error: 'Results have not been published yet.',
      results_publish_at: quiz.results_publish_at,
    });
  }

  const { data: attempts, error } = await supabaseAdmin
    .from('attempts')
    .select('user_id, score, submitted_at, profiles(full_name, avatar_url, email)')
    .eq('quiz_id', quiz.id)
    .eq('status', 'submitted')
    .order('score', { ascending: false })
    .order('submitted_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  const leaderboard = attempts.map((a, idx) => ({
    rank: idx + 1,
    user_id: a.user_id,
    name: a.profiles?.full_name || a.profiles?.email || 'Anonymous',
    avatar_url: a.profiles?.avatar_url || null,
    score: a.score,
    total_points: quiz.total_points,
    submitted_at: a.submitted_at,
  }));

  res.json({ quiz: { id: quiz.id, title: quiz.title, total_points: quiz.total_points }, leaderboard });
});

export default router;
