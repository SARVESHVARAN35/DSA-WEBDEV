import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import PulseRing from '../components/PulseRing';
import QuizCard from '../components/QuizCard';

export default function Home() {
  const { user, signInWithGoogle } = useAuth();
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    api.get('/quizzes').then((r) => setQuizzes(r.quizzes.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="gradient-hero bg-grid relative overflow-hidden text-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">
          <div>
            <span className="badge-chip bg-white/10 text-white">
              <span className="pulse-dot" /> Live, timed quizzes
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-5xl">
              Think fast. <br /> Rank higher. <br />
              <span className="text-cobalt2">Prove it, live.</span>
            </h1>
            <p className="mt-5 max-w-md text-white/70">
              Intellexa runs quizzes on the clock — join during the window, answer
              questions graded instantly against the database, and see exactly
              where you stand once results go live.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <Link to="/quizzes" className="btn-primary">Browse quizzes</Link>
              ) : (
                <button onClick={signInWithGoogle} className="btn-primary flex items-center gap-2">
                  <GoogleIcon /> Continue with Google
                </button>
              )}
              <Link to="/quizzes" className="btn-secondary !border-white/20 !bg-transparent !text-white hover:!bg-white/10">
                See live quizzes
              </Link>
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-sm flex-col gap-4 rounded-xl2 border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Now live</p>
                <p className="font-display text-lg font-bold">World Capitals Sprint</p>
              </div>
              <PulseRing
                size={64}
                stroke={6}
                percent={62}
                trackColor="rgba(255,255,255,0.15)"
                ringColor="#5B7CFF"
                center={<span className="font-mono text-xs font-bold">04:12</span>}
              />
            </div>
            <div className="h-px bg-white/10" />
            <div className="space-y-3 text-sm">
              <p className="text-white/60">Q7 of 12</p>
              <p className="font-medium">Which strait separates Europe and Africa?</p>
              <div className="grid gap-2">
                {['Strait of Gibraltar', 'Bosphorus', 'Bab-el-Mandeb', 'Strait of Hormuz'].map((opt, i) => (
                  <div
                    key={opt}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      i === 0 ? 'border-teal/60 bg-teal/10 text-teal' : 'border-white/10 text-white/70'
                    }`}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { title: 'Every answer verified', body: 'Correctness and marks are checked against the database on submit — never trusted from the browser.' },
            { title: 'Admin-controlled results', body: 'Scores and leaderboards stay hidden until an admin publishes them — instantly or on a schedule.' },
            { title: 'Badges that mean something', body: 'Perfect scores, top ranks, and quiz streaks earn real recognition on your profile.' },
          ].map((f) => (
            <div key={f.title} className="card p-6">
              <h3 className="font-display text-base font-bold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm text-slateink">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming/live quizzes preview */}
      {quizzes.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold text-ink">Jump into a quiz</h2>
            <Link to="/quizzes" className="text-sm font-semibold text-cobalt hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((q) => (
              <QuizCard key={q.id} quiz={q} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#fff" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" opacity=".9"/>
      <path fill="#fff" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.9v2.33A9 9 0 0 0 9 18z" opacity=".7"/>
      <path fill="#fff" d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.16.29-1.7V4.97H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.03l3.05-2.33z" opacity=".5"/>
      <path fill="#fff" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.97l3.05 2.33C4.66 5.17 6.65 3.58 9 3.58z" opacity=".8"/>
    </svg>
  );
}
