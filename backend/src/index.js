import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import quizRoutes from './routes/quizzes.js';
import questionRoutes from './routes/questions.js';
import attemptRoutes from './routes/attempts.js';
import leaderboardRoutes from './routes/leaderboard.js';
import badgeRoutes from './routes/badges.js';
import adminRoutes from './routes/admin.js';
import { startScheduledResultsJob } from './jobs/publishScheduledResults.js';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'intellexa-quiz-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
// questionRoutes exposes POST /api/quizzes/:quizId/questions and PUT/DELETE /api/questions/:id
app.use('/api', questionRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/quizzes', leaderboardRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, _req, res, _next) => {
  console.error('[unhandled]', err);
  res.status(500).json({ error: 'Internal server error.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Intellexa quiz backend listening on http://localhost:${PORT}`);
  startScheduledResultsJob();
});
