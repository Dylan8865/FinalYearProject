-- Make quizzes created before topic detection compatible with topic mastery
-- and spaced repetition without hardcoding subject or quiz IDs.

insert into public.topics (subject_id, topic_name)
select distinct quiz.subject_id, 'General Practice'
from public.quizzes quiz
where quiz.subject_id is not null
  and quiz.topic_id is null
  and not exists (
    select 1
    from public.topics topic
    where topic.subject_id = quiz.subject_id
      and lower(topic.topic_name) = lower('General Practice')
  );

update public.quizzes quiz
set topic_id = topic.id
from public.topics topic
where quiz.subject_id = topic.subject_id
  and quiz.topic_id is null
  and lower(topic.topic_name) = lower('General Practice');
