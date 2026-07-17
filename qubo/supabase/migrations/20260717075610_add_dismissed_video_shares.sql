-- A recipient may hide a shared lesson from their own My Learning inbox.
-- The share remains intact for the sender and can be restored with Undo.
alter table public.video_shares
  add column if not exists dismissed_at timestamptz;

create index if not exists idx_video_shares_recipient_visible
  on public.video_shares(recipient_id, shared_at desc)
  where dismissed_at is null;
