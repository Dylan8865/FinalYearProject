create table public.educator_recommendations (
  recommendation_id uuid primary key default gen_random_uuid(),
  educator_id uuid not null references public.profiles(id) on delete cascade,
  resource_id uuid references public.resources(resource_id) on delete cascade,
  video_id uuid references public.videos(video_id) on delete cascade,
  note text not null check (char_length(note) between 1 and 300),
  created_at timestamptz not null default now(),
  constraint educator_recommendations_one_target_check
    check (num_nonnulls(resource_id, video_id) = 1),
  constraint educator_recommendations_one_model_per_educator
    unique (educator_id, resource_id),
  constraint educator_recommendations_one_video_per_educator
    unique (educator_id, video_id)
);

create index idx_educator_recommendations_recent
  on public.educator_recommendations(created_at desc);

alter table public.educator_recommendations enable row level security;
grant select, insert, update, delete on public.educator_recommendations to authenticated;

create policy "authenticated users read educator recommendations"
  on public.educator_recommendations for select to authenticated
  using (true);

create policy "educators create own recommendations"
  on public.educator_recommendations for insert to authenticated
  with check (
    (select auth.uid()) = educator_id
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role::text = 'educator'
    )
  );

create policy "educators update own recommendations"
  on public.educator_recommendations for update to authenticated
  using ((select auth.uid()) = educator_id)
  with check ((select auth.uid()) = educator_id);

create policy "educators delete own recommendations"
  on public.educator_recommendations for delete to authenticated
  using ((select auth.uid()) = educator_id);
