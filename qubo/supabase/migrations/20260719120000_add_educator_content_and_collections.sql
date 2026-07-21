-- Educator publishing and versioned learning collections.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('3d-models', '3d-models', false, 52428800, array['model/gltf-binary', 'application/octet-stream'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.collections
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists primary_subject_id uuid references public.subjects(id),
  add column if not exists status text not null default 'draft',
  add column if not exists source_collection_id uuid references public.collections(collection_id),
  add column if not exists version integer not null default 1,
  add column if not exists is_student_copy boolean not null default false,
  add column if not exists cover_image_url text,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists archived_at timestamptz;

alter table public.collections
  drop constraint if exists collections_status_check,
  add constraint collections_status_check check (status in ('draft', 'shared', 'archived'));

create table if not exists public.collection_items (
  collection_item_id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(collection_id) on delete cascade,
  item_type text not null check (item_type in ('video', 'model', 'quiz')),
  video_id uuid references public.videos(video_id) on delete cascade,
  resource_id uuid references public.resources(resource_id) on delete cascade,
  quiz_id uuid references public.quizzes(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  check ((item_type = 'video' and video_id is not null and resource_id is null and quiz_id is null)
      or (item_type = 'model' and resource_id is not null and video_id is null and quiz_id is null)
      or (item_type = 'quiz' and quiz_id is not null and video_id is null and resource_id is null))
);

create index if not exists idx_collection_items_collection_order
  on public.collection_items(collection_id, sort_order);

create table if not exists public.collection_shares (
  collection_share_id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(collection_id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  shared_by uuid not null references public.profiles(id) on delete cascade,
  message text,
  due_at date,
  shared_at timestamptz not null default now(),
  opened_at timestamptz,
  unique(collection_id, student_id)
);

create index if not exists idx_collection_shares_collection
  on public.collection_shares(collection_id, shared_at desc);

alter table public.collection_items enable row level security;
alter table public.collection_shares enable row level security;

create policy "owners manage their collection items" on public.collection_items for all to authenticated
  using (exists (select 1 from public.collections c where c.collection_id = collection_items.collection_id and c.educator_id = auth.uid()))
  with check (exists (select 1 from public.collections c where c.collection_id = collection_items.collection_id and c.educator_id = auth.uid()));

create policy "owners view collection shares" on public.collection_shares for select to authenticated
  using (shared_by = auth.uid());
create policy "educators create collection shares" on public.collection_shares for insert to authenticated
  with check (shared_by = auth.uid());
create policy "students view own collection shares" on public.collection_shares for select to authenticated
  using (student_id = auth.uid());
create policy "students mark own collection opened" on public.collection_shares for update to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid());
