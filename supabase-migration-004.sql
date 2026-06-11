-- ============================================================
-- Migration 004 — Logo Legpuzzel spelvariant
-- Uitvoeren in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Game-type discriminator op campagnes (default = bestaand gedrag)
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS game_type text NOT NULL DEFAULT 'spot_diff'
    CHECK (game_type IN ('spot_diff', 'logo_puzzle'));

-- 2. Puzzle-configuratie op varianten (alleen ingevuld voor logo_puzzle)
--    Vorm: { "grid_size": 3, "logo_url": "https://..." }
ALTER TABLE campaign_variants
  ADD COLUMN IF NOT EXISTS puzzle_config jsonb;
