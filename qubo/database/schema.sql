-- ============================================================
-- Qubo — AI-Powered Personalized Learning Platform
-- Supabase (PostgreSQL) Schema
-- Aligned with Chapter 3 Functional Requirements & Chapter 4 Class Diagram
-- ============================================================

-- ------------------------------------------------------------
-- ENUM TYPES
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('student', 'educator');
  end if;
  if not exists (select 1 from pg_type where typname = 'learning_style') then
    create type learning_style as enum ('visual', 'auditory', 'kinesthetic');
  end if;
  if not exists (select 1 from pg_type where typname = 'question_type') then
    create type question_type as enum ('mcq', 'fill_blank', 'short_answer');
  end if;
  if not exists (select 1 from pg_type where typname = 'quiz_source_type') then
    create type quiz_source_type as enum ('ai_generated', 'manual');
  end if;
  if not exists (select 1 from pg_type where typname = 'risk_level') then
    create type risk_level as enum ('low', 'medium', 'high');
  end if;
end $$;

-- ------------------------------------------------------------
-- 1.0 USER AUTHENTICATION & PROFILE MANAGEMENT (FR 1.1–1.10)
-- ------------------------------------------------------------

-- Profiles extend Supabase's built-in auth.users table (1-to-1)
-- Passwords are managed by Supabase Auth in auth.users.
-- Do not store plaintext or hashed passwords in public.profiles.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  full_name text,
  email text,
  role user_role not null default 'student',
  profile_picture_url text,
  learning_style text,                 -- visual / auditory / kinesthetic
  form_level text,                     -- e.g. 'Form 4', 'Form 5'
  school text,
  target_grade text,
  target_exam_date date,
  prediction_alert_threshold numeric(5,2) not null default 50
    check (prediction_alert_threshold between 0 and 100),
  failed_login_attempts int not null default 0,   -- FR 1.10
  locked_until timestamptz,                        -- FR 1.10
  created_at timestamptz not null default now()
);

-- Public reads support profile avatars in <img> tags. Uploads are performed
-- only by the authenticated backend through its server-side service client.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  subject_name text not null unique,   -- Bahasa Melayu, English, Mathematics, etc.
  category text
);

-- Which SPM subjects a student is studying (FR 1.8)
create table if not exists student_subjects (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  unique (student_id, subject_id)
);

-- Explicit educator-student link (per your answer: not open access)
create table if not exists educator_students (
  id uuid primary key default gen_random_uuid(),
  educator_id uuid not null references profiles(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  unique (educator_id, student_id)
);

create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  topic_name text not null,
  difficulty_level text
);

-- ------------------------------------------------------------
-- 2.0 PERFORMANCE TRACKING & ANALYTICS DASHBOARD (FR 2.1–2.10)
-- ------------------------------------------------------------

create table if not exists study_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  subject_id uuid not null references subjects(id),
  duration_minutes int not null,
  pomodoro_cycles int not null default 0,
  session_date timestamptz not null default now(),
  notes text
);

-- A session can touch multiple topics; tracks time per topic (matches class diagram's SessionTopic)
create table if not exists session_topics (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references study_sessions(id) on delete cascade,
  topic_id uuid not null references topics(id),
  time_spent_minutes int not null default 0
);

-- Aggregated performance per student per topic — also drives the "weakest topics" feature (FR 2.4)
create table if not exists performance_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  topic_id uuid not null references topics(id) on delete cascade,
  score_percentage numeric(5,2) not null default 0,
  sessions_count int not null default 0,
  last_updated timestamptz not null default now(),
  unique (student_id, topic_id)
);

-- Predictive exam score forecasts + early-risk alerts (FR 2.5, 2.6)
create table if not exists exam_predictions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  predicted_score numeric(5,2) not null,
  risk_level risk_level not null,
  quiz_attempt_id uuid,
  alert_threshold numeric(5,2) not null default 50,
  is_warning boolean not null default false,
  basis_attempt_count int not null default 1,
  model_version text not null default 'weighted-trend-v1',
  generated_at timestamptz not null default now()
);

-- Spaced repetition scheduling per topic (FR 3.8)
create table if not exists spaced_repetition_schedule (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  topic_id uuid not null references topics(id) on delete cascade,
  ease_factor numeric(4,2) not null default 2.5,
  interval_days int not null default 1,
  repetitions int not null default 0,
  next_review_date date not null default current_date,
  last_reviewed_date date,
  last_score numeric(5,2),
  unique (student_id, topic_id)
);

-- Learning Recommendations (UC400)
create table if not exists learning_recommendations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  recommendation_type text not null, -- 'study_strategy', 'topic_focus', 'resource'
  subject_id uuid references subjects(id) on delete cascade,
  topic_id uuid references topics(id) on delete cascade,
  recommendation_text text not null,
  priority_level int not null default 5,
  resource_link text,
  is_accepted boolean not null default false,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3.0 AI-POWERED QUIZ GENERATION & PRACTICE (FR 3.1–3.10)
-- ------------------------------------------------------------

create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,  -- creator
  subject_id uuid references subjects(id),
  topic_id uuid references topics(id),
  title text not null,
  source_type quiz_source_type not null default 'ai_generated',
  is_assigned boolean not null default false,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  question_text text not null,
  question_type question_type not null,
  correct_answer text,           -- used for fill_blank / short_answer
  explanation text,
  difficulty_level text,
  created_at timestamptz not null default now()
);

create table if not exists question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false
);

-- Educator assigning a quiz to a specific student (supports class diagram's QuizAssignment)
create table if not exists quiz_assignments (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  assigned_by uuid not null references profiles(id),
  assigned_to uuid not null references profiles(id),
  due_date date,
  assigned_at timestamptz not null default now()
);

create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  quiz_id uuid not null references quizzes(id) on delete cascade,
  score numeric(5,2),
  total_questions int not null,
  time_taken_seconds int,
  attempted_at timestamptz not null default now()
);

-- Per-question responses (per your answer) — needed for FR 2.2 and spaced repetition
create table if not exists attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references quiz_attempts(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  selected_answer text,
  is_correct boolean not null,
  time_spent_seconds int
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'exam_predictions_quiz_attempt_id_fkey'
      and conrelid = 'exam_predictions'::regclass
  ) then
    alter table exam_predictions
      add constraint exam_predictions_quiz_attempt_id_fkey
      foreign key (quiz_attempt_id) references quiz_attempts(id) on delete set null;
  end if;
end $$;

-- ------------------------------------------------------------
-- INDEXES (for common dashboard/query patterns)
-- ------------------------------------------------------------
create index if not exists idx_study_sessions_student on study_sessions(student_id);
create index if not exists idx_performance_records_student on performance_records(student_id);
create index if not exists idx_quiz_attempts_student on quiz_attempts(student_id);
create index if not exists idx_attempt_answers_attempt on attempt_answers(attempt_id);
create unique index if not exists idx_attempt_answers_attempt_question
  on attempt_answers(attempt_id, question_id);
create index if not exists idx_exam_predictions_student on exam_predictions(student_id);
create unique index if not exists idx_exam_predictions_attempt
  on exam_predictions(quiz_attempt_id) where quiz_attempt_id is not null;
create index if not exists idx_educator_students_educator on educator_students(educator_id);
create index if not exists idx_learning_recommendations_student on learning_recommendations(student_id);

-- ------------------------------------------------------------
-- AUTO-CREATE PROFILE ON SIGNUP (standard Supabase pattern)
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  if exists (select 1 from public.profiles where id = new.id) then
    update public.profiles
    set
      username = coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
      full_name = coalesce(new.raw_user_meta_data->>'full_name', ''),
      email = new.email,
      role = coalesce(new.raw_user_meta_data->>'role', 'student')::user_role
    where id = new.id;
  else
    insert into public.profiles (id, username, full_name, email, role)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
      coalesce(new.raw_user_meta_data->>'full_name', ''),
      new.email,
      coalesce(new.raw_user_meta_data->>'role', 'student')::user_role
    );
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY (NFR 3.2: users only access their own data)
-- ------------------------------------------------------------
alter table profiles enable row level security;
alter table student_subjects enable row level security;
alter table educator_students enable row level security;
alter table study_sessions enable row level security;
alter table session_topics enable row level security;
alter table performance_records enable row level security;
alter table exam_predictions enable row level security;
alter table spaced_repetition_schedule enable row level security;
alter table learning_recommendations enable row level security;
alter table quizzes enable row level security;
alter table questions enable row level security;
alter table question_options enable row level security;
alter table quiz_assignments enable row level security;
alter table quiz_attempts enable row level security;
alter table attempt_answers enable row level security;

-- Profiles: users can read/update their own profile
drop policy if exists "own profile" on profiles;
create policy "own profile" on profiles
  for select using (auth.uid() = id);
drop policy if exists "update own profile" on profiles;
create policy "update own profile" on profiles
  for update using (auth.uid() = id);

-- Study sessions: owner-only
drop policy if exists "own study sessions" on study_sessions;
create policy "own study sessions" on study_sessions
  for all using (auth.uid() = student_id);

-- Performance & predictions: owner, plus linked educators can view (FR 2.8)
drop policy if exists "own performance records" on performance_records;
create policy "own performance records" on performance_records
  for select using (
    auth.uid() = student_id
    or exists (
      select 1 from educator_students es
      where es.student_id = performance_records.student_id
      and es.educator_id = auth.uid()
    )
  );

drop policy if exists "own exam predictions" on exam_predictions;
create policy "own exam predictions" on exam_predictions
  for select using (
    auth.uid() = student_id
    or exists (
      select 1 from educator_students es
      where es.student_id = exam_predictions.student_id
      and es.educator_id = auth.uid()
    )
  );

drop policy if exists "own srs schedule" on spaced_repetition_schedule;
create policy "own srs schedule" on spaced_repetition_schedule
  for all using (auth.uid() = student_id);

drop policy if exists "own learning recommendations" on learning_recommendations;
create policy "own learning recommendations" on learning_recommendations
  for all using (auth.uid() = student_id);

-- Quizzes & quiz library: owner-only, unless assigned to the student
drop policy if exists "own or assigned quizzes" on quizzes;
create policy "own or assigned quizzes" on quizzes
  for select using (
    auth.uid() = owner_id
    or exists (
      select 1 from quiz_assignments qa
      where qa.quiz_id = quizzes.id and qa.assigned_to = auth.uid()
    )
  );
drop policy if exists "manage own quizzes" on quizzes;
create policy "manage own quizzes" on quizzes
  for insert with check (auth.uid() = owner_id);
drop policy if exists "update own quizzes" on quizzes;
create policy "update own quizzes" on quizzes
  for update using (auth.uid() = owner_id);
drop policy if exists "delete own quizzes" on quizzes;
create policy "delete own quizzes" on quizzes
  for delete using (auth.uid() = owner_id);

drop policy if exists "read public quizzes" on quizzes;
create policy "read public quizzes" on quizzes
  for select using (is_public = true);

drop policy if exists "own quiz attempts" on quiz_attempts;
create policy "own quiz attempts" on quiz_attempts
  for all using (auth.uid() = student_id);

drop policy if exists "own attempt answers" on attempt_answers;
create policy "own attempt answers" on attempt_answers
  for all using (
    exists (
      select 1 from quiz_attempts qa
      where qa.id = attempt_answers.attempt_id and qa.student_id = auth.uid()
    )
  );

-- Educator-student link: educators manage their own list; students can see who's linked to them
drop policy if exists "educator manages own links" on educator_students;
create policy "educator manages own links" on educator_students
  for all using (auth.uid() = educator_id);
drop policy if exists "student views own educators" on educator_students;
create policy "student views own educators" on educator_students
  for select using (auth.uid() = student_id);


-- ------------------------------------------------------------
-- 3.0 QUIZ PROGRESS PERSISTENCE
-- ------------------------------------------------------------
create table if not exists quiz_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  quiz_id uuid not null references quizzes(id) on delete cascade,
  current_index int not null default 0,
  elapsed_seconds int not null default 0,
  answers jsonb not null default '{}'::jsonb,
  answer_times jsonb not null default '{}'::jsonb,
  last_updated timestamptz not null default now(),
  unique (student_id, quiz_id)
);

alter table quiz_progress enable row level security;
drop policy if exists "own quiz progress" on quiz_progress;
create policy "own quiz progress" on quiz_progress
  for all using (auth.uid() = student_id);
