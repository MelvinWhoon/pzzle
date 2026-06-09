-- Migratie 002: flyer velden + handmatige trekking
-- Uitvoeren in Supabase SQL Editor

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS flyer_image text,
  ADD COLUMN IF NOT EXISTS flyer_tagline text;
