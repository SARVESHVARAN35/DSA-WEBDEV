import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const initialProfileForm = {
  full_name: '',
  email: '',
  password: '',
  department: '',
  coding_languages: '',
  bio: '',
};

const initialLoginForm = {
  email: '',
  password: '',
};

export default function ProfileLogin() {
  const { user, completeProfile, login, loading } = useAuth();
  const [mode, setMode] = useState('login');
  const [profileForm, setProfileForm] = useState(initialProfileForm);
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (!loading && user) return <Navigate to="/quizzes" replace />;

  const from = location.state?.from?.pathname || '/quizzes';
  const isLogin = mode === 'login';

  function handleProfileChange(event) {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
  }

  function handleLoginChange(event) {
    const { name, value } = event.target;
    setLoginForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (isLogin) {
        await login(loginForm);
      } else {
        await completeProfile(profileForm);
      }
      navigate(from, { replace: true });
    } catch (e) {
      setError(e.message || (isLogin ? 'Could not log in.' : 'Could not save your profile.'));
      setSaving(false);
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError('');
  }

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-2xl flex-col items-center justify-center px-6 py-10">
      <div className="w-full rounded-3xl border border-ink/5 bg-white p-8 shadow-sm sm:p-10">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-cobalt to-cobalt2 font-display text-xl font-bold text-white shadow-glow">
          IQ
        </div>
        <h1 className="mt-6 text-center font-display text-3xl font-bold text-ink">
          {isLogin ? 'Log in to Intellexa' : 'Create your profile'}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-slateink">
          {isLogin
            ? 'Use the password you chose when creating your profile.'
            : 'Set a password now, then use it with your email whenever you come back.'}
        </p>

        <div className="mt-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`rounded-lg px-4 py-2 transition ${
              isLogin ? 'bg-white text-cobalt shadow-sm' : 'text-slateink hover:text-ink'
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => switchMode('create')}
            className={`rounded-lg px-4 py-2 transition ${
              !isLogin ? 'bg-white text-cobalt shadow-sm' : 'text-slateink hover:text-ink'
            }`}
          >
            Create profile
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
          {isLogin ? (
            <>
              <Field label="Email" name="email" type="email" value={loginForm.email} onChange={handleLoginChange} required />
              <Field
                label="Password"
                name="password"
                type="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                required
              />
            </>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" name="full_name" value={profileForm.full_name} onChange={handleProfileChange} required />
                <Field label="Email" name="email" type="email" value={profileForm.email} onChange={handleProfileChange} required />
              </div>

              <Field
                label="Password"
                name="password"
                type="password"
                minLength={6}
                value={profileForm.password}
                onChange={handleProfileChange}
                required
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Department"
                  name="department"
                  value={profileForm.department}
                  onChange={handleProfileChange}
                  placeholder="Computer Science"
                  required
                />
                <Field
                  label="Coding languages they know"
                  name="coding_languages"
                  value={profileForm.coding_languages}
                  onChange={handleProfileChange}
                  placeholder="JavaScript, Python, C++"
                />
              </div>

              <Field
                label="Description about them"
                name="bio"
                value={profileForm.bio}
                onChange={handleProfileChange}
                as="textarea"
                rows={5}
                placeholder="Tell us a little about your interests, strengths, and what you want to get from the quizzes."
              />
            </>
          )}

          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={saving} className="btn-primary mt-2 flex w-full items-center justify-center">
            {saving ? (isLogin ? 'Logging in...' : 'Saving profile...') : (isLogin ? 'Log in' : 'Create profile')}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slateink">
          Passwords are stored as server-side hashes, never as plain text.
        </p>
      </div>
    </div>
  );
}

function Field({ label, as = 'input', className = '', ...props }) {
  const Component = as;
  return (
    <label className="grid gap-2 text-left text-sm font-semibold text-ink">
      <span>{label}</span>
      <Component
        className={`w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-cobalt focus:bg-white ${className}`}
        {...props}
      />
    </label>
  );
}
