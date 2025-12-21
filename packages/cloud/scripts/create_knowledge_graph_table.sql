-- Create topic-relationships table for knowledge graph
-- Run this in Supabase SQL Editor

-- 1. Create the relationships table
CREATE TABLE IF NOT EXISTS "topic-relationships" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_topic_id uuid NOT NULL REFERENCES "cloud-topics-cache"(id) ON DELETE CASCADE,
  target_topic_id uuid NOT NULL REFERENCES "cloud-topics-cache"(id) ON DELETE CASCADE,
  relationship_type text NOT NULL, -- 'related', 'prerequisite', 'application', 'opposite'
  strength decimal(3,2) NOT NULL CHECK (strength >= 0 AND strength <= 1),
  reasoning text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Prevent duplicate relationships and self-references
  CONSTRAINT unique_relationship UNIQUE (source_topic_id, target_topic_id),
  CONSTRAINT no_self_reference CHECK (source_topic_id != target_topic_id)
);

-- 2. Create indexes for performance
CREATE INDEX idx_topic_relationships_source ON "topic-relationships"(source_topic_id);
CREATE INDEX idx_topic_relationships_target ON "topic-relationships"(target_topic_id);
CREATE INDEX idx_topic_relationships_strength ON "topic-relationships"(strength DESC);

-- 3. Enable RLS
ALTER TABLE "topic-relationships" ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Allow anonymous read access"
ON "topic-relationships"
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anonymous write access"
ON "topic-relationships"
FOR INSERT
TO anon
WITH CHECK (true);

-- 5. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_topic_relationships_updated_at 
  BEFORE UPDATE ON "topic-relationships"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Verify table creation
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'topic-relationships'
ORDER BY ordinal_position;
