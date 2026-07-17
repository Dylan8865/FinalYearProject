-- Educator-authored learning hotspots for private GLB models.
-- Coordinates are captured from the rendered model and remain attached while
-- a student rotates or zooms it.

create table public.resource_annotations (
  annotation_id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(resource_id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  description text not null check (char_length(description) between 1 and 1200),
  position_x double precision not null,
  position_y double precision not null,
  position_z double precision not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_resource_annotations_resource
  on public.resource_annotations(resource_id, created_at);

alter table public.resource_annotations enable row level security;

create policy "authenticated users read resource annotations"
  on public.resource_annotations for select to authenticated using (true);

create policy "educators create own resource annotations"
  on public.resource_annotations for insert to authenticated
  with check (
    (select auth.uid()) = created_by
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role::text = 'educator'
    )
  );

create policy "educators manage own resource annotations"
  on public.resource_annotations for update to authenticated
  using ((select auth.uid()) = created_by)
  with check ((select auth.uid()) = created_by);

create policy "educators delete own resource annotations"
  on public.resource_annotations for delete to authenticated
  using ((select auth.uid()) = created_by);
