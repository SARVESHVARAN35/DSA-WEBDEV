import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { FullPageSpinner } from '../../components/ProtectedRoute';

const emptyQuiz = {
  title: '',
  description: '',
  category: 'General',
  start_time: '',
  end_time: '',
  duration_minutes: 10,
};

const emptyQuestion = {
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_option: 'a',
  marks: 1,
  available_at: '',
};

function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function QuizEditor({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(mode === 'create' ? emptyQuiz : null);
  const [questions, setQuestions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [newQuestion, setNewQuestion] = useState({ ...emptyQuestion, question_duration_seconds: 30 });
  const [publishAt, setPublishAt] = useState('');
  const [scheduleMode, setScheduleMode] = useState('immediate');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  function loadQuiz() {
    if (mode !== 'edit') return;
    Promise.all([api.get(`/quizzes/${id}`), api.get(`/admin/quizzes/${id}/attempts`)])
      .then(([q, a]) => {
        setQuiz(q.quiz);
        setQuestions(q.questions);
        setAttempts(a.attempts);
      })
      .catch((e) => setError(e.message));
  }

  function getDailyQuestionRelease(index) {
    if (!quiz?.start_time) return '';
    const base = new Date(quiz.start_time);
    const target = new Date(base.getTime() + index * 24 * 60 * 60 * 1000);
    return toLocalInput(target.toISOString());
  }

  useEffect(loadQuiz, [id, mode]);

  function flash(msg) {
    setNotice(msg);
    setTimeout(() => setNotice(''), 2500);
  }

  async function saveQuizDetails(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (mode === 'create') {
        const { quiz: created } = await api.post('/quizzes', quiz);
        navigate(`/admin/quizzes/${created.id}`);
      } else {
        const { quiz: updated } = await api.put(`/quizzes/${id}`, quiz);
        setQuiz(updated);
        flash('Quiz details saved.');
      }
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish() {
    try {
      const { quiz: updated } = await api.post(`/quizzes/${id}/publish`, { is_published: !quiz.is_published });
      setQuiz((q) => ({ ...q, ...updated }));
      flash(updated.is_published ? 'Quiz is now visible to users.' : 'Quiz hidden from users.');
    } catch (e) {
      setError(e.message);
    }
  }

  async function publishResultsNow() {
    try {
      const { quiz: updated } = await api.post(`/quizzes/${id}/publish-results`, { publish_now: true });
      setQuiz((q) => ({ ...q, ...updated }));
      flash('Results and leaderboard are now live.');
    } catch (e) {
      setError(e.message);
    }
  }

  async function scheduleResults(e) {
    e.preventDefault();
    if (!publishAt) return;
    try {
      const { quiz: updated } = await api.post(`/quizzes/${id}/publish-results`, {
        results_publish_at: new Date(publishAt).toISOString(),
      });
      setQuiz((q) => ({ ...q, ...updated }));
      flash('Results publish time scheduled.');
    } catch (e) {
      setError(e.message);
    }
  }

  async function addQuestion(e) {
    e.preventDefault();
    setError('');
    try {
      const nextIndex = questions.length;
      const releaseInput =
        scheduleMode === 'daily'
          ? getDailyQuestionRelease(nextIndex)
          : newQuestion.available_at;

      await api.post(`/quizzes/${id}/questions`, {
        ...newQuestion,
        position: nextIndex,
        available_at: releaseInput ? new Date(releaseInput).toISOString() : null,
        question_duration_seconds: Number(newQuestion.question_duration_seconds) || 30,
      });
      setNewQuestion({ ...emptyQuestion, question_duration_seconds: 30 });
      loadQuiz();
      flash('Question added.');
    } catch (e2) {
      setError(e2.message);
    }
  }

  async function updateQuestion(qid, patch) {
    try {
      await api.put(`/questions/${qid}`, {
        ...patch,
        available_at: patch.available_at ? new Date(patch.available_at).toISOString() : null,
      });
      loadQuiz();
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteQuestion(qid) {
    if (!confirm('Delete this question?')) return;
    try {
      await api.del(`/questions/${qid}`);
      loadQuiz();
      flash('Question removed.');
    } catch (e) {
      setError(e.message);
    }
  }

  if (!quiz) return <FullPageSpinner />;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link to="/admin" className="text-sm font-semibold text-cobalt hover:underline">? Back to admin</Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-ink">
          {mode === 'create' ? 'Create quiz' : quiz.title}
        </h1>
        {mode === 'edit' && (
          <div className="flex gap-2">
            <span className={`badge-chip ${quiz.is_published ? 'bg-teal/15 text-teal' : 'bg-slateink/10 text-slateink'}`}>
              {quiz.is_published ? 'Published' : 'Draft'}
            </span>
            <button onClick={togglePublish} className="btn-secondary !px-3 !py-1.5 text-sm">
              {quiz.is_published ? 'Unpublish' : 'Publish quiz'}
            </button>
          </div>
        )}
      </div>

      {notice && <p className="mt-4 rounded-lg bg-teal/10 px-4 py-2 text-sm font-medium text-teal">{notice}</p>}
      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={saveQuizDetails} className="card mt-6 grid gap-4 p-6">
        <h2 className="font-display text-base font-bold text-ink">Details</h2>
        <Field label="Title">
          <input required className="input" value={quiz.title} onChange={(e) => setQuiz({ ...quiz, title: e.target.value })} />
        </Field>
        <Field label="Description">
          <textarea className="input" rows={3} value={quiz.description} onChange={(e) => setQuiz({ ...quiz, description: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <input className="input" value={quiz.category} onChange={(e) => setQuiz({ ...quiz, category: e.target.value })} />
          </Field>
          <Field label="Duration (minutes)">
            <input
              type="number"
              min={1}
              className="input"
              value={quiz.duration_minutes}
              onChange={(e) => setQuiz({ ...quiz, duration_minutes: Number(e.target.value) })}
            />
          </Field>
          <Field label="Opens">
            <input
              type="datetime-local"
              required
              className="input"
              value={toLocalInput(quiz.start_time)}
              onChange={(e) => setQuiz({ ...quiz, start_time: new Date(e.target.value).toISOString() })}
            />
          </Field>
          <Field label="Closes">
            <input
              type="datetime-local"
              required
              className="input"
              value={toLocalInput(quiz.end_time)}
              onChange={(e) => setQuiz({ ...quiz, end_time: new Date(e.target.value).toISOString() })}
            />
          </Field>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-fit">
          {saving ? 'Saving...' : mode === 'create' ? 'Create quiz' : 'Save details'}
        </button>
      </form>

      {mode === 'edit' && (
        <>
          <div className="card mt-6 p-6">
            <h2 className="font-display text-base font-bold text-ink">Results &amp; leaderboard</h2>
            <p className="mt-1 text-sm text-slateink">
              Scores stay hidden from users until you publish them � right away, or on a schedule.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className={`badge-chip ${quiz.results_published ? 'bg-teal/15 text-teal' : 'bg-slateink/10 text-slateink'}`}>
                {quiz.results_published ? 'Published' : quiz.results_publish_at ? `Scheduled for ${new Date(quiz.results_publish_at).toLocaleString()}` : 'Hidden'}
              </span>
              <button onClick={publishResultsNow} className="btn-primary !px-4 !py-2 text-sm" disabled={quiz.results_published}>
                Publish now
              </button>
              <form onSubmit={scheduleResults} className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  className="input !py-2"
                  value={publishAt}
                  onChange={(e) => setPublishAt(e.target.value)}
                />
                <button type="submit" className="btn-secondary !px-3 !py-2 text-sm">Schedule</button>
              </form>
            </div>
            <Link to={`/quizzes/${id}/leaderboard`} className="mt-3 inline-block text-xs font-semibold text-cobalt hover:underline">
              Preview leaderboard ?
            </Link>
          </div>

          <div className="card mt-6 p-6">
            <h2 className="font-display text-base font-bold text-ink">Questions ({questions.length}) � {quiz.total_points} total points</h2>

            <div className="mt-4 space-y-3">
              {questions.map((q, idx) => (
                <QuestionRow key={q.id} index={idx} question={q} onSave={updateQuestion} onDelete={deleteQuestion} />
              ))}
            </div>

            <form onSubmit={addQuestion} className="mt-6 grid gap-3 rounded-xl2 border border-dashed border-ink/15 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-ink">Add a question</h3>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slateink">
                  Release mode
                  <select
                    className="input !w-auto !py-2 text-xs"
                    value={scheduleMode}
                    onChange={(e) => setScheduleMode(e.target.value)}
                  >
                    <option value="immediate">Immediate</option>
                    <option value="daily">Daily unlock</option>
                  </select>
                </label>
              </div>
              <p className="text-xs text-slateink">
                {scheduleMode === 'daily'
                  ? 'Each new question will unlock one day after the previous one, starting from the quiz start time.'
                  : 'Leave the release date blank to publish this question immediately when the quiz is live.'}
              </p>
              <textarea
                required
                placeholder="Question text"
                className="input"
                rows={2}
                value={newQuestion.question_text}
                onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                {['a', 'b', 'c', 'd'].map((opt) => (
                  <input
                    key={opt}
                    required
                    placeholder={`Option ${opt.toUpperCase()}`}
                    className="input"
                    value={newQuestion[`option_${opt}`]}
                    onChange={(e) => setNewQuestion({ ...newQuestion, [`option_${opt}`]: e.target.value })}
                  />
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-slateink">
                  Correct answer
                  <select
                    className="input !w-auto"
                    value={newQuestion.correct_option}
                    onChange={(e) => setNewQuestion({ ...newQuestion, correct_option: e.target.value })}
                  >
                    {['a', 'b', 'c', 'd'].map((o) => (
                      <option key={o} value={o}>{o.toUpperCase()}</option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm text-slateink">
                  Marks
                  <input
                    type="number"
                    min={1}
                    className="input !w-20"
                    value={newQuestion.marks}
                    onChange={(e) => setNewQuestion({ ...newQuestion, marks: Number(e.target.value) })}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-slateink">
                  Time per question (sec)
                  <input
                    type="number"
                    min={5}
                    step={5}
                    className="input !w-24"
                    value={newQuestion.question_duration_seconds}
                    onChange={(e) => setNewQuestion({ ...newQuestion, question_duration_seconds: Number(e.target.value) || 30 })}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-slateink">
                  Release at
                  <input
                    type="datetime-local"
                    className="input !w-auto"
                    value={newQuestion.available_at}
                    onChange={(e) => setNewQuestion({ ...newQuestion, available_at: e.target.value })}
                    disabled={scheduleMode === 'daily'}
                  />
                </label>
                <button type="submit" className="btn-primary ml-auto !px-4 !py-2 text-sm">Add question</button>
              </div>
            </form>
          </div>

          <div className="card mt-6 p-6">
            <h2 className="font-display text-base font-bold text-ink">Participants ({attempts.length})</h2>
            {attempts.length === 0 ? (
              <p className="mt-3 text-sm text-slateink">No one has attempted this quiz yet.</p>
            ) : (
              <div className="mt-4 overflow-hidden rounded-xl2 border border-ink/5">
                <table className="w-full text-sm">
                  <thead className="bg-sky/60 text-left text-xs font-semibold uppercase tracking-wide text-slateink">
                    <tr>
                      <th className="px-4 py-2">Participant</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((a) => (
                      <tr key={a.id} className="border-t border-ink/5">
                        <td className="px-4 py-2 font-medium text-ink">{a.profiles?.full_name || a.profiles?.email}</td>
                        <td className="px-4 py-2 capitalize text-slateink">{a.status.replace('_', ' ')}</td>
                        <td className="px-4 py-2 text-right font-mono">{a.score} / {a.max_score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        .input {
          width: 100%;
          border: 1px solid rgba(15,27,69,0.12);
          border-radius: 0.65rem;
          padding: 0.55rem 0.8rem;
          font-size: 0.875rem;
          background: white;
        }
        .input:focus { outline: 2px solid #2451FF; outline-offset: 1px; }
      `}</style>
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

function QuestionRow({ index, question, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(question);

  if (!editing) {
    return (
      <div className="flex items-start justify-between gap-4 rounded-xl2 border border-ink/10 p-4">
        <div>
          <p className="text-xs font-semibold text-slateink">Q{index + 1} • {question.marks} pt{question.marks > 1 ? 's' : ''} • {question.question_duration_seconds || 30}s</p>
          <p className="mt-1 text-sm font-medium text-ink">{question.question_text}</p>
          <p className="mt-1 text-xs text-slateink">
            {question.available_at ? `Releases at ${new Date(question.available_at).toLocaleString()}` : 'Releases immediately'}
          </p>
          <p className="mt-1 text-xs text-teal">Correct: {question.correct_option?.toUpperCase()}) {question[`option_${question.correct_option}`]}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => setEditing(true)} className="text-xs font-semibold text-cobalt hover:underline">Edit</button>
          <button onClick={() => onDelete(question.id)} className="text-xs font-semibold text-red-500 hover:underline">Delete</button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-2 rounded-xl2 border border-cobalt/30 bg-cobalt/5 p-4">
      <textarea className="input" rows={2} value={draft.question_text} onChange={(e) => setDraft({ ...draft, question_text: e.target.value })} />
      <div className="grid gap-2 sm:grid-cols-2">
        {['a', 'b', 'c', 'd'].map((opt) => (
          <input key={opt} className="input" value={draft[`option_${opt}`]} onChange={(e) => setDraft({ ...draft, [`option_${opt}`]: e.target.value })} />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <select className="input !w-auto" value={draft.correct_option} onChange={(e) => setDraft({ ...draft, correct_option: e.target.value })}>
          {['a', 'b', 'c', 'd'].map((o) => <option key={o} value={o}>{o.toUpperCase()}</option>)}
        </select>
        <input type="number" min={1} className="input !w-20" value={draft.marks} onChange={(e) => setDraft({ ...draft, marks: Number(e.target.value) })} />
        <input
          type="number"
          min={5}
          step={5}
          className="input !w-24"
          value={draft.question_duration_seconds || 30}
          onChange={(e) => setDraft({ ...draft, question_duration_seconds: Number(e.target.value) || 30 })}
        />
        <input
          type="datetime-local"
          className="input !w-auto"
          value={toLocalInput(draft.available_at)}
          onChange={(e) => setDraft({ ...draft, available_at: e.target.value })}
        />
        <div className="ml-auto flex gap-2">
          <button onClick={() => setEditing(false)} className="btn-secondary !px-3 !py-1.5 text-xs">Cancel</button>
          <button
            onClick={async () => {
              await onSave(question.id, draft);
              setEditing(false);
            }}
            className="btn-primary !px-3 !py-1.5 text-xs"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
