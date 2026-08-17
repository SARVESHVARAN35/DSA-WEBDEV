import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { FullPageSpinner } from '../components/ProtectedRoute';

export default function Reviews() {
  const [attempts, setAttempts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/attempts/mine')
      .then((result) => setAttempts(result.attempts.filter((attempt) => attempt.status === 'submitted')))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="p-10 text-center text-red-600">{error}</p>;
  if (!attempts) return <FullPageSpinner />;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-3xl font-bold text-ink">Review tests</h1>
      <p className="mt-1 text-sm text-slateink">Open any submitted quiz and review your answers anytime.</p>

      {attempts.length === 0 ? (
        <p className="card mt-6 p-6 text-sm text-slateink">
          You do not have submitted quizzes yet.{' '}
          <Link to="/quizzes" className="font-semibold text-cobalt hover:underline">
            Browse quizzes
          </Link>
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {attempts.map((attempt) => (
            <article key={attempt.id} className="card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slateink">{attempt.category}</p>
              <h2 className="mt-2 font-display text-lg font-bold text-ink">{attempt.quiz_title}</h2>
              <p className="mt-2 text-sm text-slateink">
                Submitted {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : 'recently'}
              </p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="font-mono text-sm font-semibold text-ink">
                  {attempt.results_visible ? `${attempt.score} / ${attempt.max_score}` : 'Score pending'}
                </p>
                <Link to={`/attempts/${attempt.id}/review`} className="btn-secondary !px-3 !py-2 text-xs">
                  Review
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
