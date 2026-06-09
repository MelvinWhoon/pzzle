-- ============================================================
-- Migration 003 — Klant stats-token + Instant Win + QR support
-- Uitvoeren in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Stats-token per klant (voor de geheime stats-portal link)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stats_token text UNIQUE;
UPDATE clients SET stats_token = gen_random_uuid()::text WHERE stats_token IS NULL;

-- 2. Instant Win opties per campagne
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS instant_win_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS instant_win_slots integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS instant_win_time_sec integer;

-- 3. Markeer instant-win winnaars
ALTER TABLE winners ADD COLUMN IF NOT EXISTS is_instant_win boolean DEFAULT false;
