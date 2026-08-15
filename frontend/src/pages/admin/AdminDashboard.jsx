import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { FullPageSpinner } from '../../components/ProtectedRoute';

const statusStyle = {
  live: 'bg-teal/15 text-teal',
  upcoming: 'bg-cobalt/10 text-cobalt',
  ended: 'bg-slateink/10 text-slateink',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [quizzes, setQuizzes] = useState(null);
  const [error, setError] = useState('');

  function load() {
    Promise.all([api.get('/admin/stats'), api.get('/quizzes')])
      .then(([s, q]) => {
        setStats(s);
        setQuizzes(q.quizzes);
      })
      .catch((e) => setError(e.message));
  }

  useEffect(load, []);

  if (error) return <p className="p-10 text-center text-red-600">{error}</p>;
  if (!stats || !quizzes) return <FullPageSpinner />;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Admin dashboard</h1>
          <p className="mt-1 text-sm text-slateink">Create quizzes, add questions, and control when results go live.</p>
        </div>
        <Link to="/admin/quizzes/new" className="btn-primary">+ New quiz</Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Total users" value={stats.userCount} />
        <Stat label="Total quizzes" value={stats.quizCount} />
        <Stat label="Submitted attempts" value={stats.attemptCount} />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-ink">All quizzes</h2>
        <div className="mt-4 overflow-hidden rounded-xl2 border border-ink/5">
          <table className="w-full text-sm">
            <thead className="bg-sky/60 text-left text-xs font-semibold uppercase tracking-wide text-slateink">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Visibility</th>
                <th className="px-4 py-3">Results</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {quizzes.map((q) => (
                <tr key={q.id} className="border-t border-ink/5">
                  <td className="px-4 py-3 font-medium text-ink">{q.title}</td>
                  <td className="px-4 py-3">
                    <span className={`badge-chip ${statusStyle[q.status]}`}>{q.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slateink">{q.is_published ? 'Published' : 'Draft'}</td>
                  <td className="px-4 py-3 text-slateink">
                    {q.results_published ? 'Published' : q.results_publish_at ? `Scheduled` : 'Hidden'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/quizzes/${q.id}`} className="text-xs font-semibold text-cobalt hover:underline">
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
