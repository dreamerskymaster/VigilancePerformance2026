-- Supabase Schema for Vigilance Decrement Study
-- Run this in the Supabase SQL Editor to create the required tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  participant_id TEXT UNIQUE NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('AI_ASSISTED', 'UNASSISTED')),
  
  -- Demographics (stored as JSONB)
  demographics JSONB,
  
  -- KSS scores
  pre_kss INTEGER CHECK (pre_kss >= 1 AND pre_kss <= 9),
  post_kss INTEGER CHECK (post_kss >= 1 AND post_kss <= 9),
  
  -- NASA-TLX scores (stored as JSONB)
  nasa_tlx JSONB,
  
  -- AI Trust scores (stored as JSONB, nullable for unassisted condition)
  ai_trust JSONB,
  
  -- Aggregated trial results by block (stored as JSONB)
  trial_results JSONB,
  
  -- Timestamps
  consent_timestamp TIMESTAMPTZ,
  completion_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trials table
CREATE TABLE IF NOT EXISTS trials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  participant_id TEXT NOT NULL REFERENCES participants(participant_id) ON DELETE CASCADE,
  
  trial_number INTEGER NOT NULL CHECK (trial_number >= 1 AND trial_number <= 180),
  image_id TEXT NOT NULL,
  defect_type TEXT NOT NULL,
  participant_response BOOLEAN NOT NULL,
  response_type TEXT NOT NULL CHECK (response_type IN ('HIT', 'MISS', 'FA', 'CR')),
  response_time REAL NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  time_block INTEGER NOT NULL CHECK (time_block >= 1 AND time_block <= 3),
  
  -- AI prediction (nullable, only for AI_ASSISTED condition)
  ai_prediction JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(participant_id, trial_number)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_participants_condition ON participants(condition);
CREATE INDEX IF NOT EXISTS idx_participants_created_at ON participants(created_at);
CREATE INDEX IF NOT EXISTS idx_trials_participant_id ON trials(participant_id);
CREATE INDEX IF NOT EXISTS idx_trials_time_block ON trials(time_block);

-- Updated_at trigger for participants
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_participants_updated_at ON participants;
CREATE TRIGGER update_participants_updated_at
  BEFORE UPDATE ON participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
-- Enable RLS
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE trials ENABLE ROW LEVEL SECURITY;

-- Policy for inserting participants (anyone can insert)
CREATE POLICY "Enable insert for all" ON participants
  FOR INSERT WITH CHECK (true);

-- Policy for reading participants (for admin access, adjust as needed)
CREATE POLICY "Enable read for all" ON participants
  FOR SELECT USING (true);

-- Policy for updating participants
CREATE POLICY "Enable update for all" ON participants
  FOR UPDATE USING (true);

-- Policy for inserting trials
CREATE POLICY "Enable insert for all" ON trials
  FOR INSERT WITH CHECK (true);

-- Policy for reading trials
CREATE POLICY "Enable read for all" ON trials
  FOR SELECT USING (true);

-- Grant permissions to authenticated and anon users
GRANT ALL ON participants TO authenticated;
GRANT ALL ON participants TO anon;
GRANT ALL ON trials TO authenticated;
GRANT ALL ON trials TO anon;

-- Example queries for data analysis:

-- Get participant counts by condition
-- SELECT condition, COUNT(*) as count FROM participants GROUP BY condition;

-- Get average d' by condition and block
-- SELECT 
--   p.condition,
--   t.time_block,
--   AVG(
--     CASE WHEN total_defect > 0 AND total_non_defect > 0 THEN
--       -- Simplified d' calculation
--       (hits::float / total_defect) - (fas::float / total_non_defect)
--     ELSE 0 END
--   ) as avg_d_prime
-- FROM participants p
-- JOIN (
--   SELECT 
--     participant_id,
--     time_block,
--     SUM(CASE WHEN response_type = 'HIT' THEN 1 ELSE 0 END) as hits,
--     SUM(CASE WHEN response_type = 'MISS' THEN 1 ELSE 0 END) as misses,
--     SUM(CASE WHEN response_type = 'FA' THEN 1 ELSE 0 END) as fas,
--     SUM(CASE WHEN response_type = 'CR' THEN 1 ELSE 0 END) as crs,
--     SUM(CASE WHEN response_type IN ('HIT', 'MISS') THEN 1 ELSE 0 END) as total_defect,
--     SUM(CASE WHEN response_type IN ('FA', 'CR') THEN 1 ELSE 0 END) as total_non_defect
--   FROM trials
--   GROUP BY participant_id, time_block
-- ) t ON p.participant_id = t.participant_id
-- GROUP BY p.condition, t.time_block
-- ORDER BY p.condition, t.time_block;
