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
  const [badges, setBadges] = useState(null);
  const [badgeForm, setBadgeForm] = useState({
    name: '',
    description: '',
    icon: '??',
    criteria_type: 'correct_answers',
    criteria_value: 5,
  });
  const [badgeSaving, setBadgeSaving] = useState(false);
  const [error, setError] = useState('');

  function load() {
    Promise.all([api.get('/admin/stats'), api.get('/quizzes'), api.get('/badges')])
      .then(([s, q, b]) => {
        setStats(s);
        setQuizzes(q.quizzes);
        setBadges(b.badges);
      })
      .catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function createBadge(e) {
    e.preventDefault();
    setBadgeSaving(true);
    setError('');
    try {
      await api.post('/badges', badgeForm);
      setBadgeForm({
        name: '',
        description: '',
        icon: '??',
        criteria_type: 'correct_answers',
        criteria_value: 5,
      });
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBadgeSaving(false);
    }
  }

  if (error) return <p className="p-10 text-center text-red-600">{error}</p>;
  if (!stats || !quizzes || !badges) return <FullPageSpinner />;

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
                    {q.results_published ? 'Published' : q.results_publish_at ? 'Scheduled' : 'Hidden'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/quizzes/${q.id}`} className="text-xs font-semibold text-cobalt hover:underline">
                      Manage ?
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">Badges</h2>
          <p className="mt-1 text-sm text-slateink">
            Create unlock rules like “5 correct answers” for a badge such as DSA KING.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {badges.map((badge) => (
              <div key={badge.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{badge.icon} {badge.name}</p>
                    <p className="mt-1 text-sm text-slateink">{badge.description}</p>
                  </div>
                  <span className="badge-chip bg-sky/60 text-slateink text-xs">
                    {badge.criteria_type}:{badge.criteria_value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={createBadge} className="card p-6">
          <h3 className="font-display text-base font-bold text-ink">Create badge</h3>
          <div className="mt-4 grid gap-3">
            <Field label="Name">
              <input
                className="input"
                value={badgeForm.name}
                onChange={(e) => setBadgeForm({ ...badgeForm, name: e.target.value })}
                placeholder="DSA KING"
              />
            </Field>
            <Field label="Description">
              <textarea
                className="input"
                rows={3}
                value={badgeForm.description}
                onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
                placeholder="Unlocked after 5 correct answers in a quiz."
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Icon">
                <input
                  className="input"
                  value={badgeForm.icon}
                  onChange={(e) => setBadgeForm({ ...badgeForm, icon: e.target.value })}
                />
              </Field>
              <Field label="Rule">
                <select
                  className="input"
                  value={badgeForm.criteria_type}
                  onChange={(e) => setBadgeForm({ ...badgeForm, criteria_type: e.target.value })}
                >
                  <option value="correct_answers">Correct answers</option>
                  <option value="perfect_score">Perfect score</option>
                  <option value="high_scorer">High scorer</option>
                  <option value="quiz_count">Quiz count</option>
                  <option value="top_rank">Top rank</option>
                </select>
              </Field>
            </div>
            <Field label="Rule value">
              <input
                type="number"
                min={1}
                className="input"
                value={badgeForm.criteria_value}
                onChange={(e) => setBadgeForm({ ...badgeForm, criteria_value: Number(e.target.value) })}
              />
            </Field>
            <button type="submit" disabled={badgeSaving} className="btn-primary">
              {badgeSaving ? 'Creating...' : 'Create badge'}
            </button>
          </div>
        </form>
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

function Field({ label, children }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}
