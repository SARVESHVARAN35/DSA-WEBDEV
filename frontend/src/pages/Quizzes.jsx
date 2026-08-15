import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import QuizCard from '../components/QuizCard';
import { FullPageSpinner } from '../components/ProtectedRoute';

const FILTERS = ['all', 'live', 'upcoming', 'ended'];

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState(null);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/quizzes').then((r) => setQuizzes(r.quizzes)).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="p-10 text-center text-red-600">{error}</p>;
  if (!quizzes) return <FullPageSpinner />;

  const filtered = filter === 'all' ? quizzes : quizzes.filter((q) => q.status === filter);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Quizzes</h1>
          <p className="mt-1 text-sm text-slateink">Join within the prescribed time window — late entries aren't accepted.</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-sky p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold capitalize transition ${
                filter === f ? 'bg-white text-cobalt shadow-sm' : 'text-slateink hover:text-ink'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slateink">No quizzes in this category right now.</div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((q) => (
            <QuizCard key={q.id} quiz={q} />
          ))}
        </div>
      )}
    </div>
  );
}
