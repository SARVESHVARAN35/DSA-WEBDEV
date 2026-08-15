export default function BadgeGrid({ badges, earnedIds }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {badges.map((badge) => {
        const earned = earnedIds?.has(badge.id);
        return (
          <div
            key={badge.id}
            className={`card flex flex-col items-center gap-2 p-4 text-center ${!earned ? 'opacity-40 grayscale' : ''}`}
            title={badge.description}
          >
            <span className="text-3xl">{badge.icon}</span>
            <p className="text-xs font-semibold text-ink">{badge.name}</p>
            <p className="text-[11px] text-slateink">{badge.description}</p>
          </div>
        );
      })}
    </div>
  );
}
