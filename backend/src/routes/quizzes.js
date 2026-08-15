import { Router } from 'express';
import { supabaseAdmin } from '../config/supabaseClient.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { evaluateBadgesForAttempt } from '../utils/badges.js';

const router = Router();

function statusOf(quiz, now = new Date()) {
  const start = new Date(quiz.start_time);
  const end = new Date(quiz.end_time);
  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'live';
  return 'ended';
}

// ---------------------------------------------------------------------
// GET /api/quizzes — list (published only for normal users, all for admin)
// ---------------------------------------------------------------------
router.get('/', optionalAuth, async (req, res) => {
  const isAdmin = req.user?.profile?.role === 'admin';

  let query = supabaseAdmin
    .from('quizzes')
    .select('id, title, description, category, start_time, end_time, duration_minutes, total_points, is_published, results_published, results_publish_at, created_at')
    .order('start_time', { ascending: false });

  if (!isAdmin) query = query.eq('is_published', true);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const withStatus = data.map((q) => ({ ...q, status: statusOf(q) }));
  res.json({ quizzes: withStatus });
});

// ---------------------------------------------------------------------
// GET /api/quizzes/:id — quiz detail + questions
// Questions never include correct_option unless the caller is admin.
// ---------------------------------------------------------------------
router.get('/:id', optionalAuth, async (req, res) => {
  const isAdmin = req.user?.profile?.role === 'admin';

  const { data: quiz, error } = await supabaseAdmin
    .from('quizzes')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !quiz) return res.status(404).json({ error: 'Quiz not found.' });
  if (!quiz.is_published && !isAdmin) return res.status(404).json({ error: 'Quiz not found.' });

  const columns = isAdmin
    ? 'id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks, position'
    : 'id, quiz_id, question_text, option_a, option_b, option_c, option_d, marks, position';

  const { data: questions, error: qError } = await supabaseAdmin
    .from('questions')
    .select(columns)
    .eq('quiz_id', quiz.id)
    .order('position', { ascending: true });

  if (qError) return res.status(500).json({ error: qError.message });

  res.json({ quiz: { ...quiz, status: statusOf(quiz) }, questions });
});

// ---------------------------------------------------------------------
// POST /api/quizzes — create (admin)
// ---------------------------------------------------------------------
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { title, description, category, start_time, end_time, duration_minutes, results_publish_at } = req.body;

  if (!title || !start_time || !end_time) {
    return res.status(400).json({ error: 'title, start_time and end_time are required.' });
  }
  if (new Date(end_time) <= new Date(start_time)) {
    return res.status(400).json({ error: 'end_time must be after start_time.' });
  }

  const { data, error } = await supabaseAdmin
    .from('quizzes')
    .insert({
      title,
      description: description || '',
      category: category || 'General',
      start_time,
      end_time,
      duration_minutes: duration_minutes || 10,
      results_publish_at: results_publish_at || null,
      created_by: req.user.profile.id,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ quiz: data });
});

// ---------------------------------------------------------------------
// PUT /api/quizzes/:id — update (admin)
// ---------------------------------------------------------------------
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const allowed = ['title', 'description', 'category', 'start_time', 'end_time', 'duration_minutes', 'results_publish_at'];
  const updates = {};
  for (const key of allowed) if (key in req.body) updates[key] = req.body[key];

  const { data, error } = await supabaseAdmin
    .from('quizzes')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ quiz: data });
});

// ---------------------------------------------------------------------
// DELETE /api/quizzes/:id — (admin)
// ---------------------------------------------------------------------
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { error } = await supabaseAdmin.from('quizzes').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

// ---------------------------------------------------------------------
// POST /api/quizzes/:id/publish — toggle visibility to users (admin)
// ---------------------------------------------------------------------
router.post('/:id/publish', requireAuth, requireAdmin, async (req, res) => {
  const { is_published } = req.body;
  const { data, error } = await supabaseAdmin
    .from('quizzes')
    .update({ is_published: !!is_published })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ quiz: data });
});

// ---------------------------------------------------------------------
// POST /api/quizzes/:id/publish-results — admin decides when scores/
// leaderboard become visible: immediately, or scheduled for later.
// Body: { publish_now: true } OR { results_publish_at: <ISO time> }
// ---------------------------------------------------------------------
router.post('/:id/publish-results', requireAuth, requireAdmin, async (req, res) => {
  const { publish_now, results_publish_at } = req.body;

  const updates = publish_now
    ? { results_published: true, results_publish_at: null }
    : { results_published: false, results_publish_at: results_publish_at || null };

  const { data, error } = await supabaseAdmin
    .from('quizzes')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  if (updates.results_published) {
    const { data: attempts } = await supabaseAdmin
      .from('attempts')
      .select('user_id')
      .eq('quiz_id', data.id)
      .eq('status', 'submitted');
    for (const attempt of attempts || []) {
      await evaluateBadgesForAttempt({ userId: attempt.user_id, quizId: data.id });
    }
  }

  res.json({ quiz: data });
});

export default router;
