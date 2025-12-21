-- Create knowledge-graph-favorites table
CREATE TABLE IF NOT EXISTS "knowledge-graph-favorites" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "profile"(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL,
  topic_name TEXT NOT NULL,
  category TEXT DEFAULT 'Other',
  graph_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate favorites for same user + topic
  UNIQUE(user_id, topic_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON "knowledge-graph-favorites"(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON "knowledge-graph-favorites"(created_at DESC);

-- Add RLS policies (Row Level Security)
ALTER TABLE "knowledge-graph-favorites" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own favorites
CREATE POLICY "Users can view own favorites"
  ON "knowledge-graph-favorites"
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own favorites
CREATE POLICY "Users can insert own favorites"
  ON "knowledge-graph-favorites"
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own favorites
CREATE POLICY "Users can update own favorites"
  ON "knowledge-graph-favorites"
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own favorites
CREATE POLICY "Users can delete own favorites"
  ON "knowledge-graph-favorites"
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_knowledge_graph_favorites_updated_at
  BEFORE UPDATE ON "knowledge-graph-favorites"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
