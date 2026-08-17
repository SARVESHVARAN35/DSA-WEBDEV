import { supabaseAdmin } from '../config/supabaseClient.js';

function sanitizeProfile(profile) {
  if (!profile) return null;
  const { session_token, password_hash, ...safeProfile } = profile;
  return safeProfile;
}

/**
 * Verifies the Supabase access token sent by the frontend
 * (Authorization: Bearer <token>) and loads the matching profile row
 * (including app role) onto req.user. Every protected route relies on
 * this so scoring/admin checks are always done against the database,
 * never trusted from the client.
 */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Missing authorization token.' });
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('session_token', token)
      .single();

    if (error || !profile) {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }

    req.user = { profile: sanitizeProfile(profile) };
    next();
  } catch (err) {
    console.error('[auth] unexpected error', err);
    res.status(500).json({ error: 'Authentication check failed.' });
  }
}

/** Optional auth: attaches req.user if a valid token is present, otherwise continues. */
export async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  return requireAuth(req, res, next);
}
