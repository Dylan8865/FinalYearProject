-- Public determines who may view a model. Only the model uploader may add hotspots.

drop policy if exists "educators create own resource annotations" on public.resource_annotations;
create policy "model owners create resource annotations"
  on public.resource_annotations for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'educator'
    )
    and exists (
      select 1
      from public.resources r
      where r.resource_id = resource_annotations.resource_id
        and r.created_by = (select auth.uid())
    )
  );
