import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
    isActive ? 'bg-sky text-cobalt' : 'text-slateink hover:text-ink hover:bg-sky/60'
  }`;

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-ink/5 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-ink">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-cobalt to-cobalt2 text-white">
            IQ
          </span>
          Intellexa
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/quizzes" className={linkClass}>Quizzes</NavLink>
          {user && <NavLink to="/dashboard" className={linkClass}>My Dashboard</NavLink>}
          {user && <NavLink to="/reviews" className={linkClass}>Reviews</NavLink>}
          {isAdmin && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold leading-tight text-ink">{profile?.full_name || user.email}</p>
                <p className="text-xs leading-tight text-slateink">{isAdmin ? 'Admin' : 'Learner'}</p>
              </div>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-9 w-9 rounded-full border border-ink/10" />
              ) : (
                <div className="grid h-9 w-9 place-items-center rounded-full bg-sky font-display font-bold text-cobalt">
                  {(profile?.full_name || user.email || '?')[0]?.toUpperCase()}
                </div>
              )}
              <button
                onClick={async () => {
                  await signOut();
                  navigate('/');
                }}
                className="btn-secondary !px-3 !py-1.5 text-sm"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary !px-4 !py-2 text-sm">
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
