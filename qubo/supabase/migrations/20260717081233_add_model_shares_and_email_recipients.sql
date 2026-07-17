-- Generalise existing video shares so a share can target exactly one video or
-- one 3D resource. Existing video-share records and RLS policies remain valid
-- after the table rename.
alter table public.video_shares rename to content_shares;

alter index if exists public.idx_video_shares_recipient
  rename to idx_content_shares_recipient;
alter index if exists public.idx_video_shares_recipient_visible
  rename to idx_content_shares_recipient_visible;

alter table public.content_shares
  drop constraint video_shares_one_share_per_sender,
  alter column video_id drop not null,
  add column resource_id uuid references public.resources(resource_id) on delete cascade,
  add constraint content_shares_one_target_check
    check (num_nonnulls(video_id, resource_id) = 1),
  add constraint content_shares_video_sender_recipient_key
    unique (video_id, sender_id, recipient_id),
  add constraint content_shares_resource_sender_recipient_key
    unique (resource_id, sender_id, recipient_id);

alter policy "users read sent or received video shares" on public.content_shares
  rename to "users read sent or received content shares";
alter policy "users share videos as themselves" on public.content_shares
  rename to "users share content as themselves";
alter policy "recipients mark own video shares read" on public.content_shares
  rename to "recipients update own content shares";
