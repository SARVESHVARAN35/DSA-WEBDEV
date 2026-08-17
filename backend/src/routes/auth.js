import { Router } from 'express';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { supabaseAdmin } from '../config/supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const scryptAsync = promisify(crypto.scrypt);

function sanitizeProfile(profile) {
  if (!profile) return null;
  const { session_token, password_hash, ...safeProfile } = profile;
  return safeProfile;
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return false;
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;

  const derivedKey = await scryptAsync(password, salt, 64);
  const storedKey = Buffer.from(key, 'hex');
  if (storedKey.length !== derivedKey.length) return false;
  return crypto.timingSafeEqual(storedKey, derivedKey);
}

function createSessionToken() {
  return crypto.randomUUID();
}

function validatePassword(password) {
  if (!password || String(password).length < 6) {
    return 'Password must be at least 6 characters.';
  }
  return null;
}

// POST /api/auth/session - creates or updates a profile and returns a local session token.
router.post('/session', async (req, res) => {
  try {
    const {
      full_name,
      email,
      department,
      coding_languages,
      bio,
      password,
    } = req.body || {};

    if (!full_name || !email || !department) {
      return res.status(400).json({ error: 'full_name, email and department are required.' });
    }

    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ error: passwordError });

    const normalizedEmail = String(email).trim().toLowerCase();
    const token = createSessionToken();

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
      if (existing.password_hash) {
        const passwordMatches = await verifyPassword(String(password), existing.password_hash);
        if (!passwordMatches) {
          return res.status(401).json({ error: 'That email already has a profile. Use the correct password to update it.' });
        }
      } else {
        baseProfile.password_hash = await hashPassword(String(password));
      }

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(baseProfile)
        .eq('id', existing.id)
        .select('*')
        .single();
      if (error) return res.status(500).json({ error: error.message });
      profile = data;
    } else {
      baseProfile.password_hash = await hashPassword(String(password));
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

// POST /api/auth/login - signs in with an existing profile password.
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const { data: existing, error: lookupError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (lookupError) return res.status(500).json({ error: lookupError.message });

    const passwordMatches = await verifyPassword(String(password), existing?.password_hash);
    if (!existing || !passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = createSessionToken();
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .update({ session_token: token })
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.json({ profile: sanitizeProfile(profile), token });
  } catch (err) {
    console.error('[auth/login] unexpected error', err);
    res.status(500).json({ error: 'Could not log in.' });
  }
});

// GET /api/auth/me - returns the caller's profile from the local session token.
router.get('/me', requireAuth, (req, res) => {
  res.json({ profile: req.user.profile });
});

export default router;
