-- Fix cloud-topics-cache constraint issue
-- Run this in Supabase SQL Editor

-- 1. Delete all existing cache (old structure words)
TRUNCATE TABLE "cloud-topics-cache";

-- 2. Add unique constraint to item_id
ALTER TABLE "cloud-topics-cache" 
ADD CONSTRAINT cloud_topics_cache_item_id_unique 
UNIQUE (item_id);

-- 3. Verify constraint was added
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'cloud-topics-cache'::regclass;
