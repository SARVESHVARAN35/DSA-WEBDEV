import { Link } from 'react-router-dom';
import PulseRing from './PulseRing';

const statusStyle = {
  live: { chip: 'bg-teal/15 text-teal', label: 'Live now' },
  upcoming: { chip: 'bg-cobalt/10 text-cobalt', label: 'Upcoming' },
  ended: { chip: 'bg-slateink/10 text-slateink', label: 'Ended' },
};

function fmt(dt) {
  return new Date(dt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function QuizCard({ quiz }) {
  const s = statusStyle[quiz.status] || statusStyle.ended;

  return (
    <Link to={`/quizzes/${quiz.id}`} className="card group flex flex-col gap-4 p-5 transition hover:shadow-glow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={`badge-chip ${s.chip}`}>
            {quiz.status === 'live' && <span className="pulse-dot" />}
            {s.label}
          </span>
          <h3 className="mt-2 font-display text-lg font-bold text-ink group-hover:text-cobalt">{quiz.title}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slateink">{quiz.category}</p>
        </div>
        <PulseRing
          size={52}
          stroke={5}
          percent={quiz.status === 'live' ? 65 : quiz.status === 'ended' ? 100 : 8}
          center={<span className="font-mono text-[10px] font-bold text-cobalt">{quiz.duration_minutes}m</span>}
        />
      </div>

      {quiz.description && <p className="line-clamp-2 text-sm text-slateink">{quiz.description}</p>}

      <div className="mt-auto flex items-center justify-between border-t border-ink/5 pt-3 text-xs text-slateink">
        <span>Starts {fmt(quiz.start_time)}</span>
        <span className="font-mono font-semibold text-ink">{quiz.total_points} pts</span>
      </div>
    </Link>
  );
}
