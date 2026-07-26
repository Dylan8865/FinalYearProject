-- Priority 2 analytics: configurable warnings and traceable per-attempt forecasts.
-- The existing study_sessions, session_topics, exam_predictions and
-- educator_students tables are reused.

alter table public.profiles
  add column if not exists prediction_alert_threshold numeric(5,2) not null default 50;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_prediction_alert_threshold_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_prediction_alert_threshold_check
      check (prediction_alert_threshold between 0 and 100);
  end if;
end $$;

alter table public.exam_predictions
  add column if not exists quiz_attempt_id uuid references public.quiz_attempts(id) on delete set null,
  add column if not exists alert_threshold numeric(5,2) not null default 50,
  add column if not exists is_warning boolean not null default false,
  add column if not exists basis_attempt_count integer not null default 1,
  add column if not exists model_version text not null default 'weighted-trend-v1';

create unique index if not exists idx_exam_predictions_attempt
  on public.exam_predictions(quiz_attempt_id)
  where quiz_attempt_id is not null;

create index if not exists idx_study_sessions_student_subject_date
  on public.study_sessions(student_id, subject_id, session_date desc);

create index if not exists idx_exam_predictions_student_subject_date
  on public.exam_predictions(student_id, subject_id, generated_at desc);

create index if not exists idx_quiz_attempts_student_date
  on public.quiz_attempts(student_id, attempted_at desc);

grant select, insert, update, delete on table public.study_sessions to service_role;
grant select, insert, update, delete on table public.session_topics to service_role;
grant select, insert, update, delete on table public.exam_predictions to service_role;
grant select, insert, update, delete on table public.educator_students to service_role;
grant select, insert, update, delete on table public.topics to service_role;
