-- One activity record represents either a 3D/general resource or a video.
-- A student can have at most one activity row per target, which lets the
-- application update last_viewed_at and view_count safely.

alter table public.user_resources
  alter column resource_id drop not null,
  add column video_id uuid references public.videos(video_id) on delete cascade,
  add column last_viewed_at timestamptz not null default now(),
  add column view_count integer not null default 0 check (view_count >= 0);

alter table public.user_resources
  add constraint user_resources_one_target_check
  check (num_nonnulls(resource_id, video_id) = 1),
  add constraint user_resources_user_resource_key unique (user_id, resource_id),
  add constraint user_resources_user_video_key unique (user_id, video_id);

create index idx_user_resources_recently_viewed
  on public.user_resources(user_id, last_viewed_at desc);

alter table public.user_resources enable row level security;

grant select, insert, update on public.user_resources to authenticated;

drop policy if exists "users read own resource activity" on public.user_resources;
create policy "users read own resource activity"
  on public.user_resources for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "users insert own resource activity" on public.user_resources;
create policy "users insert own resource activity"
  on public.user_resources for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "users update own resource activity" on public.user_resources;
create policy "users update own resource activity"
  on public.user_resources for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
