-- Parts 3 and 4: persist explanations, enforce one answer per question,
-- and track spaced-repetition progress.

alter table public.questions
  add column if not exists explanation text;

alter table public.spaced_repetition_schedule
  add column if not exists repetitions integer not null default 0,
  add column if not exists last_score numeric(5,2);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'spaced_repetition_repetitions_check'
      and conrelid = 'public.spaced_repetition_schedule'::regclass
  ) then
    alter table public.spaced_repetition_schedule
      add constraint spaced_repetition_repetitions_check
      check (repetitions >= 0);
  end if;
end $$;

create unique index if not exists idx_attempt_answers_attempt_question
  on public.attempt_answers(attempt_id, question_id);

create index if not exists idx_review_schedule_student_due
  on public.spaced_repetition_schedule(student_id, next_review_date);

create index if not exists idx_quizzes_subject_topic
  on public.quizzes(subject_id, topic_id);

grant select, insert, update, delete on table public.attempt_answers to service_role;
grant select, insert, update, delete on table public.performance_records to service_role;
grant select, insert, update, delete on table public.spaced_repetition_schedule to service_role;
