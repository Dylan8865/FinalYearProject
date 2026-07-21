-- Immutable, meaningful learning actions.  user_resources remains the
-- per-user/per-content summary table; this table is used for analytics and
-- recommendation signals without treating browser refreshes as new learners.
create table public.learning_events (
  event_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('model', 'video', 'quiz')),
  resource_id uuid references public.resources(resource_id) on delete cascade,
  video_id uuid references public.videos(video_id) on delete cascade,
  event_type text not null check (event_type in (
    'opened', 'saved', 'unsaved', 'shared', 'completed',
    'model_explored', 'model_viewed', 'video_played', 'video_paused', 'video_progress',
    'skipped_quickly', 'rewound', 'quiz_attempted', 'quiz_completed'
  )),
  session_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  constraint learning_events_target_check check (
    (target_type = 'model' and resource_id is not null and video_id is null)
    or (target_type = 'video' and video_id is not null and resource_id is null)
    or (target_type = 'quiz' and resource_id is null and video_id is null)
  )
);

create index idx_learning_events_user_recent
  on public.learning_events(user_id, occurred_at desc);
create index idx_learning_events_event_recent
  on public.learning_events(event_type, occurred_at desc);
create index idx_learning_events_resource_recent
  on public.learning_events(resource_id, occurred_at desc)
  where resource_id is not null;
create index idx_learning_events_video_recent
  on public.learning_events(video_id, occurred_at desc)
  where video_id is not null;

alter table public.user_resources
  add column if not exists completed_at timestamptz;

alter table public.learning_events enable row level security;
grant select, insert on public.learning_events to authenticated;

create policy "users read own learning events"
  on public.learning_events for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "users add own learning events"
  on public.learning_events for insert to authenticated
  with check ((select auth.uid()) = user_id);
