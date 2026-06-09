-- Migratie 001: logo_url en website toevoegen aan clients
-- Uitvoeren in Supabase SQL Editor

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS website text;
