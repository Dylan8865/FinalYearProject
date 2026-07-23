-- Backfill topic mastery and review schedules for quiz attempts saved
-- before automatic spaced-repetition updates were introduced.

insert into public.performance_records (
  student_id,
  topic_id,
  score_percentage,
  sessions_count,
  last_updated
)
select
  attempt.student_id,
  quiz.topic_id,
  round(avg(attempt.score), 2),
  count(*)::integer,
  max(attempt.attempted_at)
from public.quiz_attempts attempt
join public.quizzes quiz on quiz.id = attempt.quiz_id
where quiz.topic_id is not null
group by attempt.student_id, quiz.topic_id
on conflict (student_id, topic_id) do nothing;

do $$
declare
  topic_group record;
  attempt_row record;
  review_ease numeric(4, 2);
  review_interval integer;
  review_repetitions integer;
  review_quality integer;
  latest_review_date date;
  latest_score numeric(5, 2);
begin
  for topic_group in
    select distinct attempt.student_id, quiz.topic_id
    from public.quiz_attempts attempt
    join public.quizzes quiz on quiz.id = attempt.quiz_id
    where quiz.topic_id is not null
  loop
    if exists (
      select 1
      from public.spaced_repetition_schedule schedule
      where schedule.student_id = topic_group.student_id
        and schedule.topic_id = topic_group.topic_id
    ) then
      continue;
    end if;

    review_ease := 2.50;
    review_interval := 1;
    review_repetitions := 0;

    for attempt_row in
      select attempt.score, attempt.attempted_at
      from public.quiz_attempts attempt
      join public.quizzes quiz on quiz.id = attempt.quiz_id
      where attempt.student_id = topic_group.student_id
        and quiz.topic_id = topic_group.topic_id
      order by attempt.attempted_at, attempt.id
    loop
      review_quality := case
        when attempt_row.score >= 90 then 5
        when attempt_row.score >= 75 then 4
        when attempt_row.score >= 60 then 3
        when attempt_row.score >= 40 then 2
        else 1
      end;

      if review_quality < 3 then
        review_repetitions := 0;
        review_interval := 1;
      else
        review_repetitions := review_repetitions + 1;
        review_interval := case
          when review_repetitions = 1 then 1
          when review_repetitions = 2 then 6
          else greatest(1, round(review_interval * review_ease)::integer)
        end;
      end if;

      review_ease := greatest(
        1.30,
        review_ease + (
          0.10
          - (5 - review_quality)
            * (0.08 + (5 - review_quality) * 0.02)
        )
      );
      latest_review_date := attempt_row.attempted_at::date;
      latest_score := attempt_row.score;
    end loop;

    insert into public.spaced_repetition_schedule (
      student_id,
      topic_id,
      ease_factor,
      interval_days,
      repetitions,
      next_review_date,
      last_reviewed_date,
      last_score
    )
    values (
      topic_group.student_id,
      topic_group.topic_id,
      review_ease,
      review_interval,
      review_repetitions,
      latest_review_date + review_interval,
      latest_review_date,
      latest_score
    )
    on conflict (student_id, topic_id) do nothing;
  end loop;
end $$;
