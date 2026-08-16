import { Router } from 'express';
import crypto from 'node:crypto';
import { supabaseAdmin } from '../config/supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function sanitizeProfile(profile) {
  if (!profile) return null;
  const { session_token, ...safeProfile } = profile;
  return safeProfile;
}

// POST /api/auth/session — creates or updates a profile and returns a local session token.
router.post('/session', async (req, res) => {
  try {
    const {
      full_name,
      email,
      department,
      coding_languages,
      bio,
    } = req.body || {};

    if (!full_name || !email || !department) {
      return res.status(400).json({ error: 'full_name, email and department are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const token = crypto.randomUUID();

    const baseProfile = {
      email: normalizedEmail,
      full_name: String(full_name).trim(),
      department: String(department).trim(),
      coding_languages: coding_languages ? String(coding_languages).trim() : null,
      bio: bio ? String(bio).trim() : null,
      session_token: token,
    };

    const { data: existing, error: lookupError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (lookupError) {
      return res.status(500).json({ error: lookupError.message });
    }

    let profile;
    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(baseProfile)
        .eq('id', existing.id)
        .select('*')
        .single();
      if (error) return res.status(500).json({ error: error.message });
      profile = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .insert(baseProfile)
        .select('*')
        .single();
      if (error) return res.status(500).json({ error: error.message });
      profile = data;
    }

    res.json({ profile: sanitizeProfile(profile), token });
  } catch (err) {
    console.error('[auth/session] unexpected error', err);
    res.status(500).json({ error: 'Could not create session.' });
  }
});

// GET /api/auth/me — returns the caller's profile from the local session token.
router.get('/me', requireAuth, (req, res) => {
  res.json({ profile: req.user.profile });
});

export default router;
