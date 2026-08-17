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

  const isAttempted = (item) => item.is_attempted ?? Boolean(item.selected_option);
  const correctCount = data.review.filter((item) => isAttempted(item) && item.is_correct).length;
  const notAttemptedCount = data.review.filter((item) => !isAttempted(item)).length;
  const wrongCount = data.review.filter((item) => isAttempted(item) && !item.is_correct).length;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link to="/reviews" className="text-sm font-semibold text-cobalt hover:underline">
        Back to reviews
      </Link>

      <h1 className="mt-3 font-display text-3xl font-bold text-ink">Answer review</h1>
      <p className="mt-1 text-sm text-slateink">
        Score: <span className="font-semibold text-ink">{data.score} / {data.max_score}</span>
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Correct" value={correctCount} className="text-teal" />
        <Stat label="Wrong" value={wrongCount} className="text-red-600" />
        <Stat label="Not attempted" value={notAttemptedCount} className="text-slateink" />
      </div>

      <div className="mt-6 space-y-4">
        {data.review.map((item, index) => {
          const options = ['a', 'b', 'c', 'd'].map((letter) => ({
            letter,
            text: item[`option_${letter}`],
            isCorrect: item.correct_option === letter,
            isSelected: item.selected_option === letter,
          }));

          return (
            <div key={item.question_id} className="card p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-bold text-ink">Q{index + 1}</h2>
                <StatusBadge item={item} isAttempted={isAttempted(item)} />
              </div>

              <p className="mt-3 text-sm font-medium text-ink">{item.question_text}</p>

              <div className="mt-4 grid gap-2">
                {options.map(({ letter, text, isCorrect, isSelected }) => {
                  let variant = 'border-ink/10 bg-white text-ink';
                  let badge = null;

                  if (isCorrect) {
                    variant = 'border-teal bg-teal/10 text-teal';
                    badge = 'Correct answer';
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
                <ReviewNote item={item} isAttempted={isAttempted(item)} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, className }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slateink">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${className}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ item, isAttempted }) {
  if (!isAttempted) {
    return (
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slateink">
        Not attempted
      </span>
    );
  }

  if (item.is_correct) {
    return (
      <span className="rounded-full bg-teal/15 px-2.5 py-1 text-xs font-semibold text-teal">
        Correct (+{item.marks_awarded})
      </span>
    );
  }

  return (
    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
      Incorrect ({item.marks_awarded} pts)
    </span>
  );
}

function ReviewNote({ item, isAttempted }) {
  const correct = item.correct_option?.toUpperCase();

  if (!isAttempted) {
    return <>You did not attempt this question. The correct answer is {correct}.</>;
  }

  if (item.is_correct) {
    return <>You answered correctly.</>;
  }

  return <>You answered {item.selected_option?.toUpperCase()} - the correct answer is {correct}.</>;
}
