import { Router } from 'express';
import { supabaseAdmin } from '../config/supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = Router();
router.use(requireAuth, requireAdmin);

// GET /api/admin/stats — quick overview for the admin dashboard
router.get('/stats', async (_req, res) => {
  const [{ count: userCount }, { count: quizCount }, { count: attemptCount }] = await Promise.all([
    supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('quizzes').select('id', { count: 'exact', head: true }),
    supabaseAdmin
      .from('attempts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'submitted')
      .eq('is_practice', false),
  ]);

  res.json({ userCount: userCount || 0, quizCount: quizCount || 0, attemptCount: attemptCount || 0 });
});

// GET /api/admin/quizzes/:id/attempts — every participant's status/score for review before publishing
router.get('/quizzes/:id/attempts', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('attempts')
    .select('id, status, score, max_score, started_at, submitted_at, profiles(full_name, email)')
    .eq('quiz_id', req.params.id)
    .eq('is_practice', false)
    .order('score', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ attempts: data });
});

// GET /api/admin/users — list users for role management
router.get('/users', async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('profiles').select('id, email, full_name, role, created_at').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ users: data });
});

// POST /api/admin/users/:id/role  { role: 'admin' | 'user' }
router.post('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'user'].includes(role)) return res.status(400).json({ error: "role must be 'admin' or 'user'." });

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ role })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ user: data });
});

export default router;
