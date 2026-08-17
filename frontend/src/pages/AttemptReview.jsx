import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { FullPageSpinner } from '../components/ProtectedRoute';

export default function AttemptReview() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/attempts/${id}/review`)
      .then((result) => setData(result))
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="p-10 text-center text-red-600">{error}</p>;
  if (!data) return <FullPageSpinner />;

  const correctCount = data.review.filter((item) => item.is_correct).length;
  const wrongCount = data.review.length - correctCount;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link to="/dashboard" className="text-sm font-semibold text-cobalt hover:underline">
        ← Back to dashboard
      </Link>

      <h1 className="mt-3 font-display text-3xl font-bold text-ink">Answer review</h1>
      <p className="mt-1 text-sm text-slateink">
        Score: <span className="font-semibold text-ink">{data.score} / {data.max_score}</span>
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slateink">Correct</p>
          <p className="mt-2 text-2xl font-bold text-teal">{correctCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slateink">Wrong</p>
          <p className="mt-2 text-2xl font-bold text-red-600">{wrongCount}</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {data.review.map((item, index) => {
          const options = ['a', 'b', 'c', 'd']
            .map((letter) => ({
              letter,
              text: item[`option_${letter}`],
              isCorrect: item.correct_option === letter,
              isSelected: item.selected_option === letter,
            }));

          return (
            <div key={item.id} className="card p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-bold text-ink">Q{index + 1}</h2>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    item.is_correct ? 'bg-teal/15 text-teal' : 'bg-red-50 text-red-600'
                  }`}
                >
                  {item.is_correct ? `Correct (+${item.marks_awarded})` : `Incorrect (${item.marks_awarded} pts)`}
                </span>
              </div>

              <p className="mt-3 text-sm font-medium text-ink">{item.question_text}</p>

              <div className="mt-4 grid gap-2">
                {options.map(({ letter, text, isCorrect, isSelected }) => {
                  let variant = 'border-ink/10 bg-white text-ink';
                  let badge = null;

                  if (isCorrect) {
                    variant = 'border-teal bg-teal/10 text-teal';
                    badge = '✓ correct answer';
                  } else if (isSelected) {
                    variant = 'border-red-300 bg-red-50 text-red-700';
                    badge = 'Your answer';
                  }

                  return (
                    <div key={letter} className={`rounded-xl border px-3 py-2 text-sm ${variant}`}>
                      <span className="mr-2 font-bold uppercase">{letter}</span>
                      {text}
                      {badge && <span className="ml-2 font-semibold">{badge}</span>}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slateink">
                {item.is_correct ? 'You answered correctly.' : `You answered ${item.selected_option?.toUpperCase() || 'nothing'} — the correct answer is ${item.correct_option?.toUpperCase()}.`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
