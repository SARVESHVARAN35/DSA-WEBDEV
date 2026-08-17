import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { FullPageSpinner } from '../components/ProtectedRoute';
import Countdown from '../components/Countdown';

function formatDateTime(value) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function QuizDetail() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [quiz, setQuiz] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [availableQuestionCount, setAvailableQuestionCount] = useState(0);
  const [nextQuestionAt, setNextQuestionAt] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/quizzes/${id}`)
      .then((r) => {
        setQuiz(r.quiz);
        setQuestionCount(r.total_question_count ?? r.questions.length);
        setAvailableQuestionCount(r.questions.length);
        setNextQuestionAt(r.next_question_available_at || null);
        setError('');
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="p-10 text-center text-red-600">{error}</p>;
  if (!quiz) return <FullPageSpinner />;

  function handleStart() {
    if (!user) return navigate('/login', { state: { from: location } });
    navigate(`/quizzes/${id}/attempt`);
  }

  const shouldWaitForQuestions = quiz.status === 'live' && availableQuestionCount === 0 && nextQuestionAt;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="card overflow-hidden">
        <div className="gradient-hero bg-grid p-8 text-white">
          <span className="badge-chip bg-white/10 text-white capitalize">{quiz.status}</span>
          <h1 className="mt-3 font-display text-3xl font-bold">{quiz.title}</h1>
          <p className="mt-1 text-sm text-white/70">
            {quiz.category} - {questionCount} available questions - {quiz.total_points} points
          </p>
          {isAdmin && (
            <Link to={`/admin/quizzes/${quiz.id}`} className="mt-4 inline-block text-xs font-semibold text-cobalt2 hover:underline">
              Manage this quiz
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

          <div className="flex flex-wrap items-center gap-4 border-t border-ink/5 pt-6">
            {quiz.status === 'upcoming' && (
              <div className="rounded-xl bg-sky/70 px-4 py-3">
                <p className="text-sm font-semibold text-ink">Come again at {formatDateTime(quiz.start_time)}.</p>
                <div className="mt-1 text-sm text-slateink">
                  Starts in <Countdown targetIso={quiz.start_time} />
                </div>
              </div>
            )}

            {shouldWaitForQuestions && (
              <div className="rounded-xl bg-sky/70 px-4 py-3">
                <p className="text-sm font-semibold text-ink">Come again at {formatDateTime(nextQuestionAt)}.</p>
                <p className="mt-1 text-sm text-slateink">The next scheduled question is not available yet.</p>
              </div>
            )}

            {quiz.status === 'live' && !shouldWaitForQuestions && (
              <button onClick={handleStart} className="btn-primary">
                {user ? (isAdmin ? 'Practice quiz' : 'Start quiz') : 'Log in to start'}
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
