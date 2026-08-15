/**
 * Intellexa's signature visual motif: a circular progress ring.
 * percent: 0-100 (how much of the ring is filled)
 * size/stroke: px
 * center: optional node rendered in the middle (e.g. time remaining, a score)
 */
export default function PulseRing({ percent = 100, size = 96, stroke = 8, center, trackColor, ringColor }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  return (
    <div className="pulse-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          className="track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          style={trackColor ? { stroke: trackColor } : undefined}
        />
        <circle
          className="progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={ringColor ? { stroke: ringColor } : undefined}
        />
      </svg>
      {center && (
        <div className="absolute inset-0 flex items-center justify-center">
          {center}
        </div>
      )}
    </div>
  );
}
