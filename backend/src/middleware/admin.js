/**
 * Must run after requireAuth. Rejects anyone whose profile.role isn't
 * 'admin'. Role lives in the database (profiles.role) — never trust a
 * role claimed by the client.
 */
export function requireAdmin(req, res, next) {
  if (req.user?.profile?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}
