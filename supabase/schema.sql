-- Vigilance Study Database Schema
-- Run this in Supabase SQL Editor to create required tables

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
  id BIGSERIAL PRIMARY KEY,
  participant_id TEXT UNIQUE NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('AI_ASSISTED', 'UNASSISTED')),
  demographics JSONB,
  pre_kss INTEGER,
  post_kss INTEGER,
  nasa_tlx JSONB,
  ai_trust JSONB,
  trials JSONB,
  consent_timestamp TIMESTAMPTZ,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_participants_condition ON participants(condition);
CREATE INDEX IF NOT EXISTS idx_participants_completed ON participants(completed_at);

-- Enable Row Level Security
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anon users (for study submissions)
CREATE POLICY "Allow anonymous inserts" ON participants
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow select for authenticated users only (admin)
CREATE POLICY "Allow authenticated select" ON participants
  FOR SELECT TO authenticated
  USING (true);
