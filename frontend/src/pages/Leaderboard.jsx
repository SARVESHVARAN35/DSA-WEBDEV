import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { FullPageSpinner } from '../components/ProtectedRoute';
import LeaderboardTable from '../components/LeaderboardTable';

export default function Leaderboard() {
  const { id } = useParams();
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    api
      .get(`/quizzes/${id}/leaderboard`)
      .then((r) => setState({ loading: false, data: r }))
      .catch((e) =>
        setState({
          loading: false,
          error: e.message,
          publishAt: e.payload?.results_publish_at,
        })
      );
  }, [id]);

  if (state.loading) return <FullPageSpinner />;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to={`/quizzes/${id}`} className="text-sm font-semibold text-cobalt hover:underline">
        ← Back to quiz
      </Link>

      <h1 className="mt-3 font-display text-3xl font-bold text-ink">
        {state.data?.quiz?.title || 'Leaderboard'}
      </h1>

      {state.error ? (
        <div className="card mt-6 p-8 text-center">
          <p className="text-sm font-semibold text-ink">Results aren't published yet</p>
          <p className="mt-1 text-sm text-slateink">
            {state.publishAt
              ? `The admin has scheduled results for ${new Date(state.publishAt).toLocaleString()}.`
              : 'The admin will publish scores and the leaderboard once ready.'}
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <LeaderboardTable leaderboard={state.data.leaderboard} highlightUserId={user?.id} />
        </div>
      )}
    </div>
  );
}
