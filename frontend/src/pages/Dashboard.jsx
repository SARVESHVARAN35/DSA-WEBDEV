import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { FullPageSpinner } from '../components/ProtectedRoute';
import BadgeGrid from '../components/BadgeGrid';

export default function Dashboard() {
  const { profile } = useAuth();
  const [attempts, setAttempts] = useState(null);
  const [badges, setBadges] = useState(null);
  const [myBadges, setMyBadges] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/attempts/mine'), api.get('/badges'), api.get('/badges/mine')])
      .then(([a, b, mb]) => {
        setAttempts(a.attempts);
        setBadges(b.badges);
        setMyBadges(mb.badges);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="p-10 text-center text-red-600">{error}</p>;
  if (!attempts || !badges || !myBadges) return <FullPageSpinner />;

  const earnedIds = new Set(myBadges.map((b) => b.badges.id));
  const submitted = attempts.filter((a) => a.status === 'submitted');
  const visibleScores = submitted.filter((a) => a.results_visible);
  const avgPercent = visibleScores.length
    ? Math.round(
        (visibleScores.reduce((sum, a) => sum + a.score / (a.max_score || 1), 0) / visibleScores.length) * 100
      )
    : null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-3xl font-bold text-ink">
        Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
      </h1>
      <p className="mt-1 text-sm text-slateink">Your quiz history, achievements, and badges.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Quizzes completed" value={submitted.length} />
        <Stat label="Badges earned" value={myBadges.length} />
        <Stat label="Avg. score (published)" value={avgPercent !== null ? `${avgPercent}%` : '—'} />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-ink">Your badges</h2>
        <div className="mt-4">
          <BadgeGrid badges={badges} earnedIds={earnedIds} />
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Review tests</h2>
            <p className="mt-1 text-sm text-slateink">Reopen submitted quizzes and check attempted, wrong, and skipped questions.</p>
          </div>
          <Link to="/reviews" className="text-sm font-semibold text-cobalt hover:underline">
            View all
          </Link>
        </div>
        {submitted.length === 0 ? (
          <p className="card mt-4 p-6 text-sm text-slateink">Submitted quizzes will appear here.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {submitted.slice(0, 4).map((a) => (
              <div key={a.id} className="card p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slateink">{a.category}</p>
                <h3 className="mt-2 font-display text-base font-bold text-ink">{a.quiz_title}</h3>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="font-mono text-sm font-semibold text-ink">
                    {a.results_visible ? `${a.score} / ${a.max_score}` : 'Score pending'}
                  </p>
                  <Link to={`/attempts/${a.id}/review`} className="btn-secondary !px-3 !py-2 text-xs">
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-ink">Quiz history</h2>
        {attempts.length === 0 ? (
          <p className="card mt-4 p-6 text-sm text-slateink">
            You haven't taken any quizzes yet. <Link to="/quizzes" className="font-semibold text-cobalt">Browse quizzes →</Link>
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl2 border border-ink/5">
            <table className="w-full text-sm">
              <thead className="bg-sky/60 text-left text-xs font-semibold uppercase tracking-wide text-slateink">
                <tr>
                  <th className="px-4 py-3">Quiz</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Score</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id} className="border-t border-ink/5">
                    <td className="px-4 py-3 font-medium text-ink">{a.quiz_title}</td>
                    <td className="px-4 py-3 capitalize text-slateink">{a.status.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-ink">
                      {a.results_visible ? `${a.score} / ${a.max_score}` : 'Pending'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {a.status === 'submitted' ? (
                        <Link to={`/attempts/${a.id}/review`} className="mr-3 text-xs font-semibold text-teal hover:underline">
                          Review →
                        </Link>
                      ) : null}
                      {a.results_visible ? (
                        <Link to={`/quizzes/${a.quiz_id}/leaderboard`} className="text-xs font-semibold text-cobalt hover:underline">
                          Leaderboard →
                        </Link>
                      ) : (
                        <button
                          onClick={() => window.alert('Leaderboard is hidden until the admin publishes results.')}
                          className="text-xs font-semibold text-slateink/70"
                        >
                          Locked
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slateink">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}
