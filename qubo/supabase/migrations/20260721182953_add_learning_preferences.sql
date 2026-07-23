alter table public.profiles
  add column if not exists visual_score smallint,
  add column if not exists auditory_score smallint,
  add column if not exists kinesthetic_score smallint,
  add column if not exists learning_style_assessed_at timestamptz,
  add column if not exists daily_flashcards_enabled boolean not null default true,
  add column if not exists daily_flashcards_time time not null default '20:00',
  add column if not exists nightly_review_enabled boolean not null default true,
  add column if not exists nightly_review_time time not null default '22:30',
  add column if not exists reminder_timezone text not null default 'Asia/Kuala_Lumpur';

alter table public.profiles
  drop constraint if exists profiles_learning_style_scores_check,
  add constraint profiles_learning_style_scores_check check (
    (visual_score is null and auditory_score is null and kinesthetic_score is null)
    or
    (visual_score between 0 and 100 and auditory_score between 0 and 100 and kinesthetic_score between 0 and 100)
  );

comment on column public.profiles.learning_style_assessed_at is
  'When the learner last completed the preference questionnaire.';

comment on column public.profiles.reminder_timezone is
  'IANA timezone used to interpret the reminder times.';
