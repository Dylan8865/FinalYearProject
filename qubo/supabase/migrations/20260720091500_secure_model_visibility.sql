-- Private 3D models must not be readable through the Data API by other users.
-- The backend uses the service-role client for publishing and therefore bypasses RLS.

alter table public.resources enable row level security;

drop policy if exists "authenticated users read visible resources" on public.resources;
create policy "authenticated users read visible resources"
  on public.resources for select to authenticated
  using (
    resource_type not in ('3d_model', '3D Model')
    or visibility = 'public'
    or created_by = (select auth.uid())
  );
