import { Router } from 'express';
import { supabaseAdmin } from '../config/supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = Router();

// GET /api/badges - full badge catalogue
router.get('/', async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('badges').select('*').order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ badges: data });
});

// GET /api/badges/mine - badges the caller has earned
router.get('/mine', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('user_badges')
    .select('*, badges(*)')
    .eq('user_id', req.user.profile.id)
    .order('awarded_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ badges: data });
});

// POST /api/badges - create a new badge (admin)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { name, description, icon, criteria_type, criteria_value } = req.body;
  const validTypes = ['perfect_score', 'top_rank', 'quiz_count', 'high_scorer', 'correct_answers'];
  const numericValue = Number(criteria_value);

  if (!name || !description || !criteria_type || !Number.isFinite(numericValue)) {
    return res.status(400).json({ error: 'name, description, criteria_type and criteria_value are required.' });
  }
  if (!validTypes.includes(criteria_type)) {
    return res.status(400).json({ error: `criteria_type must be one of: ${validTypes.join(', ')}.` });
  }
  if (numericValue < 1) {
    return res.status(400).json({ error: 'criteria_value must be a positive number.' });
  }

  const { data, error } = await supabaseAdmin
    .from('badges')
    .insert({ name, description, icon: icon || '??', criteria_type, criteria_value: numericValue })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ badge: data });
});

export default router;
