-- ============================================================
-- FIX: Row Level Security Policies for Cloud Topics Feature
-- ============================================================
-- Run this in Supabase SQL Editor to fix cache write errors

-- Drop existing policies if they exist (won't error if missing)
DROP POLICY IF EXISTS "Allow public insert to cloud-topics-cache" ON "cloud-topics-cache";
DROP POLICY IF EXISTS "Allow public update to cloud-topics-cache" ON "cloud-topics-cache";
DROP POLICY IF EXISTS "Allow public read from cloud-topics-cache" ON "cloud-topics-cache";

-- 1. Allow anonymous users to write to cloud-topics-cache
CREATE POLICY "Allow public insert to cloud-topics-cache"
ON "cloud-topics-cache"
FOR INSERT
TO anon
WITH CHECK (true);

-- 2. Allow anonymous users to update cache (for is_stale flag)
CREATE POLICY "Allow public update to cloud-topics-cache"
ON "cloud-topics-cache"
FOR UPDATE
TO anon
USING (true);

-- 3. Allow anonymous users to read cache (for frontend)
CREATE POLICY "Allow public read from cloud-topics-cache"
ON "cloud-topics-cache"
FOR SELECT
TO anon
USING (true);

-- Verify policies were created
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'cloud-topics-cache';
