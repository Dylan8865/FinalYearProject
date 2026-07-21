-- Persist ownership and visibility for educator-published 3D models.
-- Existing resources deliberately remain public so current student links keep working.

alter table public.resources
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists visibility text not null default 'public';

alter table public.resources
  drop constraint if exists resources_visibility_check,
  add constraint resources_visibility_check check (visibility in ('public', 'private'));

update public.resources
set visibility = 'public'
where visibility is null;

create index if not exists idx_resources_model_visibility
  on public.resources (visibility, created_by)
  where resource_type in ('3d_model', '3D Model');
