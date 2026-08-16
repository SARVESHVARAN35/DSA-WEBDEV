import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { FullPageSpinner } from '../components/ProtectedRoute';
import Countdown from '../components/Countdown';

export default function QuizDetail() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [quiz, setQuiz] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    api
      .get(`/quizzes/${id}`)
      .then((r) => {
        setQuiz(r.quiz);
        setQuestionCount(r.questions.length);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="p-10 text-center text-red-600">{error}</p>;
  if (!quiz) return <FullPageSpinner />;

  async function handleStart() {
    if (!user) return navigate('/login', { state: { from: location } });
    setStarting(true);
    try {
      await api.post(`/attempts/quizzes/${id}/start`);
      navigate(`/quizzes/${id}/attempt`);
    } catch (e) {
      setError(e.message);
      setStarting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="card overflow-hidden">
        <div className="gradient-hero bg-grid p-8 text-white">
          <span className="badge-chip bg-white/10 text-white capitalize">{quiz.status}</span>
          <h1 className="mt-3 font-display text-3xl font-bold">{quiz.title}</h1>
          <p className="mt-1 text-sm text-white/70">{quiz.category} · {questionCount} questions · {quiz.total_points} points</p>
          {isAdmin && (
            <Link to={`/admin/quizzes/${quiz.id}`} className="mt-4 inline-block text-xs font-semibold text-cobalt2 hover:underline">
              Manage this quiz →
            </Link>
          )}
        </div>

        <div className="space-y-6 p-8">
          {quiz.description && <p className="text-sm text-slateink">{quiz.description}</p>}

          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <Info label="Opens">{new Date(quiz.start_time).toLocaleString()}</Info>
            <Info label="Closes">{new Date(quiz.end_time).toLocaleString()}</Info>
            <Info label="Time limit">{quiz.duration_minutes} minutes</Info>
          </dl>

          {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex flex-wrap items-center gap-4 border-t border-ink/5 pt-6">
            {quiz.status === 'upcoming' && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slateink">Starts in</p>
                <Countdown targetIso={quiz.start_time} />
              </div>
            )}
            {quiz.status === 'live' && (
              <button onClick={handleStart} disabled={starting} className="btn-primary">
                {starting ? 'Starting…' : user ? (isAdmin ? 'Practice quiz' : 'Start quiz') : 'Create profile to start'}
              </button>
            )}
            {quiz.status === 'ended' && (
              <p className="text-sm text-slateink">This quiz has ended.</p>
            )}
            <Link to={`/quizzes/${quiz.id}/leaderboard`} className="btn-secondary">
              View leaderboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slateink">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink">{children}</dd>
    </div>
  );
}
