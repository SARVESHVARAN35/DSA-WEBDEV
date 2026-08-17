# Intellexa - Live Quiz Platform

A full-stack quiz platform with profile-based sign-in, timed quizzes, server-side answer validation, admin-controlled results publishing, leaderboards, and badges.

- Backend: Node.js + Express + Supabase (service-role key, `.env`-based credentials)
- Frontend: React (Vite) + Tailwind, blue Intellexa theme
- Auth: App-managed profile passwords and session tokens
- Database: Supabase (Postgres)

```
intellexa-quiz/
  backend/     Express API
  frontend/    React app
```

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In Project Settings -> API, copy:
   - `Project URL`
   - `anon public` key
   - `service_role` key (keep this secret - backend only, never in the frontend)
3. Open the SQL Editor and run the entire contents of `backend/sql/schema.sql`.
   This creates all tables, profile/session fields, RLS policies, and seeds a starter set of badges.

## 2. Profile sign-in

1. No external OAuth provider is required.
2. New users create a profile with name, email, password, department, coding languages, and a short bio.
3. Returning users log in with the email and password they used when creating the profile.
4. Passwords are hashed by the backend; the browser only stores a local session token.

## 3. Backend setup

```bash
cd backend
cp .env.example .env
# fill in SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev        # starts on http://localhost:4000
```

## 4. Frontend setup

```bash
cd frontend
cp .env.example .env
# fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
npm install
npm run dev         # starts on http://localhost:5173
```

## 5. Make yourself an admin

Profiles default to the `user` role. Promote your account with one SQL statement in the Supabase SQL editor:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

Once you're an admin, you can promote/demote other users from `/admin` - the `POST /api/admin/users/:id/role` endpoint.

## How the key features work

- Sign in / sign up - profile creation stores a server-side password hash, login verifies that password, and both flows issue a local session token stored in the browser.
- Answer validation - every submitted answer is graded in `backend/src/utils/scoring.js` against the `correct_option` stored in the database. The API never sends `correct_option` to non-admins, and never trusts a correctness/marks value from the client.
- Points - admins set `marks` per question when adding it; the quiz's `total_points` is recomputed automatically.
- Timed attendance - a quiz can only be started while `start_time <= now <= end_time`. Once started, the effective deadline is `min(quiz.end_time, attempt.started_at + duration_minutes)`, enforced on every `/answer` and `/submit` call - not just in the UI.
- Admin-gated results - `quizzes.results_published` and `results_publish_at` control when scores/leaderboards become visible. Admins can publish instantly or schedule a time; a cron job (`backend/src/jobs/publishScheduledResults.js`) flips the flag automatically once that time arrives.
- Leaderboard - ranked by score (desc), then submission time (asc), computed live from `attempts` + `profiles`.
- Badges - awarded automatically on submit (and re-checked when results are published, for rank-based badges) in `backend/src/utils/badges.js`.

## Notes

- The frontend never talks to Supabase for quiz data or auth. All quiz/question/attempt/leaderboard reads and writes go through the backend, which uses the Supabase service role key so grading and publish rules can't be bypassed by RLS or client tampering.
- Deploy the backend anywhere Node runs (Render, Railway, Fly.io, a VM) and the frontend as a static build (`npm run build` -> `frontend/dist`) on Vercel/Netlify/anywhere static hosting works. Update `CORS_ORIGIN` in the backend `.env` and `VITE_API_URL` in the frontend `.env` accordingly.
