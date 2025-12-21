-- Cloud Topics Cache Table
-- Stores preprocessed AI-extracted topics for fast frontend loading
-- This is separate from the existing analysis-cache table
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public."cloud-topics-cache" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Source item reference
  item_id uuid,
  
  -- Extracted data
  main_topic text NOT NULL,
  sub_topics jsonb DEFAULT '[]'::jsonb,
  category text,
  
  -- Bubble map data (pre-formatted for frontend)
  bubble_map_data jsonb,
  
  -- Cache metadata
  weight integer DEFAULT 50,
  click_count integer DEFAULT 0,
  is_stale boolean DEFAULT false,
  
  CONSTRAINT "cloud-topics-cache_pkey" PRIMARY KEY (id),
  CONSTRAINT "cloud-topics-cache_item_id_fkey" FOREIGN KEY (item_id) 
    REFERENCES public."item-data"(id) ON DELETE CASCADE
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_cloud_topics_cache_main_topic 
  ON public."cloud-topics-cache"(main_topic);

CREATE INDEX IF NOT EXISTS idx_cloud_topics_cache_category 
  ON public."cloud-topics-cache"(category);

CREATE INDEX IF NOT EXISTS idx_cloud_topics_cache_item_id 
  ON public."cloud-topics-cache"(item_id);

-- Enable Row Level Security (optional)
ALTER TABLE public."cloud-topics-cache" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON public."cloud-topics-cache"
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to update
CREATE POLICY "Allow authenticated updates" ON public."cloud-topics-cache"
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Add comment
COMMENT ON TABLE public."cloud-topics-cache" IS 
  'Cached AI-extracted topics from item-data for fast frontend loading (separate from analysis-cache)';
