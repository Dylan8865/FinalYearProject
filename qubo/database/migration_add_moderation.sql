-- ============================================================
-- Admin Content Moderation: Add is_locked and is_deleted
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- Add moderation columns to videos table
alter table videos
  add column if not exists is_locked  boolean not null default false,
  add column if not exists is_deleted boolean not null default false,
  add column if not exists locked_reason text;

-- Add moderation columns to resources table
alter table resources
  add column if not exists is_locked  boolean not null default false,
  add column if not exists is_deleted boolean not null default false,
  add column if not exists locked_reason text;

-- Indexes for fast moderation filtering
create index if not exists idx_videos_moderation   on videos(is_locked, is_deleted);
create index if not exists idx_resources_moderation on resources(is_locked, is_deleted);
