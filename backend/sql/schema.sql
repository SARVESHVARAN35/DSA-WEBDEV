-- =========================================================
-- Intellexa Quiz Platform — Supabase schema
-- Run this in the Supabase SQL editor (Project > SQL Editor)
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- PROFILES  (mirrors auth.users, adds app-level fields)
-- ---------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up (Google OAuth etc.)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------
-- QUIZZES
-- ---------------------------------------------------------
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  category text default 'General',
  start_time timestamptz not null,
  end_time timestamptz not null,
  duration_minutes int not null default 10,
  total_points int not null default 0,
  is_published boolean not null default false,      -- visible to users / open for attempts
  results_published boolean not null default false, -- leaderboard + scores visible
  results_publish_at timestamptz,                    -- optional scheduled auto-publish
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint end_after_start check (end_time > start_time)
);

-- ---------------------------------------------------------
-- QUESTIONS  (correct_option NEVER sent to non-admins by the API)
-- ---------------------------------------------------------
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option char(1) not null check (correct_option in ('a','b','c','d')),
  marks int not null default 1 check (marks > 0),
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- ATTEMPTS  (one per user per quiz)
-- ---------------------------------------------------------
create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress','submitted')),
  score int not null default 0,
  max_score int not null default 0,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (quiz_id, user_id)
);

-- ---------------------------------------------------------
-- ATTEMPT ANSWERS
-- ---------------------------------------------------------
create table if not exists public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_option char(1) check (selected_option in ('a','b','c','d')),
  is_correct boolean not null default false,
  marks_awarded int not null default 0,
  answered_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

-- ---------------------------------------------------------
-- BADGES
-- ---------------------------------------------------------
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  icon text not null default '🏅',
  criteria_type text not null check (criteria_type in
    ('perfect_score','top_rank','quiz_count','high_scorer')),
  criteria_value int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  quiz_id uuid references public.quizzes(id) on delete set null,
  awarded_at timestamptz not null default now(),
  unique (user_id, badge_id, quiz_id)
);

-- Seed a few default badges
insert into public.badges (name, description, icon, criteria_type, criteria_value)
values
  ('Perfect Score', 'Scored 100% on a quiz', '🎯', 'perfect_score', 100),
  ('Top of the Class', 'Finished #1 on a quiz leaderboard', '🥇', 'top_rank', 1),
  ('High Scorer', 'Scored 80% or more on a quiz', '⭐', 'high_scorer', 80),
  ('Getting Started', 'Completed your first quiz', '🚀', 'quiz_count', 1),
  ('Quiz Regular', 'Completed 5 quizzes', '🔥', 'quiz_count', 5),
  ('Quiz Veteran', 'Completed 20 quizzes', '🏆', 'quiz_count', 20)
on conflict (name) do nothing;

-- ---------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------
create index if not exists idx_questions_quiz on public.questions(quiz_id);
create index if not exists idx_attempts_quiz on public.attempts(quiz_id);
create index if not exists idx_attempts_user on public.attempts(user_id);
create index if not exists idx_attempt_answers_attempt on public.attempt_answers(attempt_id);
create index if not exists idx_user_badges_user on public.user_badges(user_id);

-- ---------------------------------------------------------
-- ROW LEVEL SECURITY
-- The Node backend uses the SERVICE ROLE key for all writes and for any
-- read that must hide answers/gate on time, so it bypasses RLS entirely.
-- These policies only matter if the frontend ever queries Supabase
-- directly with the user's session (kept minimal & safe by default).
-- ---------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;
alter table public.attempt_answers enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

create policy "profiles are self-readable" on public.profiles
  for select using (auth.uid() = id);

create policy "published quizzes are readable" on public.quizzes
  for select using (is_published = true);

create policy "badges are readable by everyone" on public.badges
  for select using (true);

create policy "users read their own attempts" on public.attempts
  for select using (auth.uid() = user_id);

create policy "users read their own badges" on public.user_badges
  for select using (auth.uid() = user_id);

-- No insert/update/delete policies are defined for authenticated/anon roles,
-- so all writes must go through the backend service-role key. This is
-- intentional: it guarantees every answer is graded against the DB and
-- every points/publish decision goes through the admin-checked API.
