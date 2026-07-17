-- A saved item can be either one tutorial video or one 3D/general resource.
alter table public.user_favourites
  alter column video_id drop not null,
  add column resource_id uuid references public.resources(resource_id) on delete cascade;

alter table public.user_favourites
  add constraint user_favourites_one_target_check
  check (num_nonnulls(video_id, resource_id) = 1),
  add constraint user_favourites_user_video_key unique (user_id, video_id),
  add constraint user_favourites_user_resource_key unique (user_id, resource_id);

create index idx_user_favourites_user_date_added
  on public.user_favourites(user_id, date_added desc);

alter table public.user_favourites enable row level security;

grant select, insert, delete on public.user_favourites to authenticated;

drop policy if exists "users read own favourites" on public.user_favourites;
create policy "users read own favourites"
  on public.user_favourites for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "users add own favourites" on public.user_favourites;
create policy "users add own favourites"
  on public.user_favourites for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "users delete own favourites" on public.user_favourites;
create policy "users delete own favourites"
  on public.user_favourites for delete to authenticated
  using ((select auth.uid()) = user_id);
