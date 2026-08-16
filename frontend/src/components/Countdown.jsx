import { useEffect, useState } from 'react';

export function useCountdown(targetIso) {
  const getRemainingMs = () => {
    if (!targetIso) return 0;
    const target = new Date(targetIso).getTime();
    return Number.isFinite(target) ? target - Date.now() : 0;
  };

  const [remainingMs, setRemainingMs] = useState(() => getRemainingMs());

  useEffect(() => {
    setRemainingMs(getRemainingMs());
    const id = setInterval(() => {
      setRemainingMs(getRemainingMs());
    }, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  const clamped = Math.max(0, remainingMs);
  const totalSeconds = Math.floor(clamped / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { remainingMs: clamped, hours, minutes, seconds, isDone: Boolean(targetIso) && remainingMs <= 0 };
}

export default function Countdown({ targetIso, label }) {
  const { hours, minutes, seconds, isDone } = useCountdown(targetIso);

  return (
    <div className="flex items-baseline gap-2 font-mono">
      {isDone ? (
        <span className="text-teal font-bold">00:00:00</span>
      ) : (
        <span className="text-lg font-bold text-ink">
          {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      )}
      {label && <span className="text-xs font-semibold uppercase tracking-wide text-slateink">{label}</span>}
    </div>
  );
}
