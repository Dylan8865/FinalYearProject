create table public.video_shares (
  share_id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(video_id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  message text check (char_length(message) <= 300),
  shared_at timestamptz not null default now(),
  read_at timestamptz,
  constraint video_shares_different_users_check check (sender_id <> recipient_id),
  constraint video_shares_one_share_per_sender unique (video_id, sender_id, recipient_id)
);

create index idx_video_shares_recipient on public.video_shares(recipient_id, shared_at desc);
alter table public.video_shares enable row level security;
grant select, insert, update on public.video_shares to authenticated;

create policy "users read sent or received video shares" on public.video_shares for select to authenticated
  using ((select auth.uid()) = sender_id or (select auth.uid()) = recipient_id);
create policy "users share videos as themselves" on public.video_shares for insert to authenticated
  with check ((select auth.uid()) = sender_id);
create policy "recipients mark own video shares read" on public.video_shares for update to authenticated
  using ((select auth.uid()) = recipient_id)
  with check ((select auth.uid()) = recipient_id);
