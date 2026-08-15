import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { FullPageSpinner } from '../components/ProtectedRoute';
import PulseRing from '../components/PulseRing';
import { useCountdown } from '../components/Countdown';

export default function QuizAttempt() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({}); // question_id -> option
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const startRes = await api.post(`/attempts/quizzes/${id}/start`);
        setAttempt(startRes.attempt);
        const quizRes = await api.get(`/quizzes/${id}`);
        setQuiz(quizRes.quiz);
        setQuestions(quizRes.questions);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [id]);

  const deadline = useMemo(() => {
    if (!quiz || !attempt) return null;
    const byDuration = new Date(attempt.started_at).getTime() + quiz.duration_minutes * 60000;
    const byQuizEnd = new Date(quiz.end_time).getTime();
    return new Date(Math.min(byDuration, byQuizEnd)).toISOString();
  }, [quiz, attempt]);

  const submit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      await api.post(`/attempts/${attempt.id}/submit`);
    } catch {
      // even if already submitted server-side, proceed to results
    }
    navigate(`/quizzes/${id}/leaderboard`);
  }, [attempt, id, navigate]);

  const { hours, minutes, seconds, isDone } = useCountdown(deadline || new Date().toISOString());

  useEffect(() => {
    if (deadline && isDone && attempt) submit();
  }, [isDone, deadline, attempt, submit]);

  async function selectOption(questionId, option) {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
    setSaving(true);
    try {
      await api.post(`/attempts/${attempt.id}/answer`, { question_id: questionId, selected_option: option });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (error) return <p className="p-10 text-center text-red-600">{error}</p>;
  if (!quiz || !attempt || questions.length === 0) return <FullPageSpinner />;

  const q = questions[current];
  const answeredCount = Object.keys(answers).length;
  const percentLeft = deadline
    ? Math.max(0, Math.min(100, (((hours * 3600 + minutes * 60 + seconds) * 1000) / (quiz.duration_minutes * 60000)) * 100))
    : 100;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">{quiz.title}</h1>
          <p className="text-xs font-semibold uppercase tracking-wide text-slateink">
            Question {current + 1} of {questions.length} · {answeredCount} answered
          </p>
        </div>
        <PulseRing
          size={64}
          stroke={6}
          percent={percentLeft}
          center={
            <span className="font-mono text-xs font-bold text-ink">
              {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          }
        />
      </div>

      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-sky">
        <div className="h-full bg-cobalt transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
      </div>

      <div className="card p-6">
        <p className="font-display text-lg font-semibold text-ink">{q.question_text}</p>
        <div className="mt-5 grid gap-3">
          {['a', 'b', 'c', 'd'].map((opt) => {
            const text = q[`option_${opt}`];
            const selected = answers[q.id] === opt;
            return (
              <button
                key={opt}
                onClick={() => selectOption(q.id, opt)}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                  selected ? 'border-cobalt bg-cobalt/5 text-cobalt' : 'border-ink/10 text-ink hover:border-cobalt/40'
                }`}
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-bold uppercase ${
                    selected ? 'border-cobalt bg-cobalt text-white' : 'border-ink/20 text-slateink'
                  }`}
                >
                  {opt}
                </span>
                {text}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="btn-secondary disabled:opacity-40"
        >
          Previous
        </button>

        <span className="text-xs text-slateink">{saving ? 'Saving…' : 'Answers save automatically'}</span>

        {current < questions.length - 1 ? (
          <button onClick={() => setCurrent((c) => c + 1)} className="btn-primary">
            Next
          </button>
        ) : (
          <button onClick={submit} disabled={submitting} className="btn-primary">
            {submitting ? 'Submitting…' : 'Submit quiz'}
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {questions.map((qq, idx) => (
          <button
            key={qq.id}
            onClick={() => setCurrent(idx)}
            className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-bold transition ${
              idx === current
                ? 'bg-cobalt text-white'
                : answers[qq.id]
                ? 'bg-teal/15 text-teal'
                : 'bg-sky text-slateink'
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
