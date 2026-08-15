import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/auth/me — returns (and lazily creates) the caller's profile.
// The frontend calls this right after a Google sign-in/sign-up redirect.
router.get('/me', requireAuth, (req, res) => {
  res.json({ profile: req.user.profile });
});

export default router;
