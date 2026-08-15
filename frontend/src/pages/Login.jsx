import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, signInWithGoogle, loading } = useAuth();

  if (!loading && user) return <Navigate to="/quizzes" replace />;

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-cobalt to-cobalt2 font-display text-xl font-bold text-white shadow-glow">
        IQ
      </div>
      <h1 className="mt-6 font-display text-2xl font-bold text-ink">Welcome to Intellexa</h1>
      <p className="mt-2 text-sm text-slateink">
        Sign in with Google to join quizzes, track your rank, and collect badges. New here?
        The same button creates your account.
      </p>

      <button onClick={signInWithGoogle} className="btn-primary mt-8 flex w-full items-center justify-center gap-3">
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path fill="#fff" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" opacity=".9"/>
          <path fill="#fff" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.9v2.33A9 9 0 0 0 9 18z" opacity=".7"/>
          <path fill="#fff" d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.16.29-1.7V4.97H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.03l3.05-2.33z" opacity=".5"/>
          <path fill="#fff" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.97l3.05 2.33C4.66 5.17 6.65 3.58 9 3.58z" opacity=".8"/>
        </svg>
        Continue with Google
      </button>

      <p className="mt-6 text-xs text-slateink">
        By continuing you agree to take quizzes fairly — every answer is checked server-side, so there's no benefit to poking around in dev tools. 😉
      </p>
    </div>
  );
}
