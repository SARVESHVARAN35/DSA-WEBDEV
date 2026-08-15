import { supabaseAuth, supabaseAdmin } from '../config/supabaseClient.js';

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
      return res.status(401).json({ error: 'Missing Authorization bearer token.' });
    }

    const { data, error } = await supabaseAuth.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }

    let { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    // Safety net: if the on-signup trigger hasn't fired yet, create the
    // profile row now so a brand-new Google sign-up isn't blocked.
    if (profileError || !profile) {
      const { data: created, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
          avatar_url: data.user.user_metadata?.avatar_url,
        })
        .select()
        .single();
      if (createError) {
        return res.status(500).json({ error: 'Could not initialize user profile.' });
      }
      profile = created;
    }

    req.user = { authUser: data.user, profile };
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
