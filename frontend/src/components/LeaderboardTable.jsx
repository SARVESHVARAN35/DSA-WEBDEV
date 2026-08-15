const medal = ['🥇', '🥈', '🥉'];

export default function LeaderboardTable({ leaderboard, highlightUserId }) {
  if (!leaderboard?.length) {
    return <p className="py-6 text-center text-sm text-slateink">No submissions yet.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl2 border border-ink/5">
      <table className="w-full text-sm">
        <thead className="bg-sky/60 text-left text-xs font-semibold uppercase tracking-wide text-slateink">
          <tr>
            <th className="px-4 py-3">Rank</th>
            <th className="px-4 py-3">Participant</th>
            <th className="px-4 py-3 text-right">Score</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((row) => (
            <tr
              key={row.user_id}
              className={`border-t border-ink/5 ${row.user_id === highlightUserId ? 'bg-cobalt/5' : ''}`}
            >
              <td className="px-4 py-3 font-mono font-semibold text-ink">
                {medal[row.rank - 1] || `#${row.rank}`}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {row.avatar_url ? (
                    <img src={row.avatar_url} alt="" className="h-7 w-7 rounded-full" />
                  ) : (
                    <div className="grid h-7 w-7 place-items-center rounded-full bg-sky text-xs font-bold text-cobalt">
                      {row.name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <span className="font-medium text-ink">{row.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-right font-mono font-semibold text-ink">
                {row.score} <span className="text-slateink">/ {row.total_points}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
