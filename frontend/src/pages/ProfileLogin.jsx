import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  full_name: '',
  email: '',
  department: '',
  coding_languages: '',
  bio: '',
};

export default function ProfileLogin() {
  const { user, completeProfile, loading } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (!loading && user) return <Navigate to="/quizzes" replace />;

  const from = location.state?.from?.pathname || '/quizzes';

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await completeProfile(form);
      navigate(from, { replace: true });
    } catch (e) {
      setError(e.message || 'Could not save your profile.');
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-2xl flex-col items-center justify-center px-6 py-10">
      <div className="w-full rounded-3xl border border-ink/5 bg-white p-8 shadow-sm sm:p-10">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-cobalt to-cobalt2 font-display text-xl font-bold text-white shadow-glow">
          IQ
        </div>
        <h1 className="mt-6 text-center font-display text-3xl font-bold text-ink">Join Intellexa</h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-slateink">
          Create your profile once, then use the same email to come back later. This keeps the
          whole flow inside the app.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" name="full_name" value={form.full_name} onChange={handleChange} required />
            <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Department"
              name="department"
              value={form.department}
              onChange={handleChange}
              placeholder="Computer Science"
              required
            />
            <Field
              label="Coding languages they know"
              name="coding_languages"
              value={form.coding_languages}
              onChange={handleChange}
              placeholder="JavaScript, Python, C++"
            />
          </div>

          <Field
            label="Description about them"
            name="bio"
            value={form.bio}
            onChange={handleChange}
            as="textarea"
            rows={5}
            placeholder="Tell us a little about your interests, strengths, and what you want to get from the quizzes."
          />

          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={saving} className="btn-primary mt-2 flex w-full items-center justify-center">
            {saving ? 'Saving profile...' : 'Continue'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slateink">
          Your profile is stored in the app database.
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
