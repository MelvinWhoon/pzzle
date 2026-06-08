-- =========================================================
-- Zoek de Verschillen — Supabase Schema
-- Draai dit in de Supabase SQL-editor
-- =========================================================

-- Klanten (adverteerders)
create table if not exists clients (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  contact_name text,
  email        text,
  phone        text,
  city         text,
  postal_code  text,
  notes        text,
  active       boolean default true,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Campagnes
create table if not exists campaigns (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid references clients(id) on delete set null,
  title            text not null,
  description      text,
  city             text,
  postal_codes     text[] default '{}',
  radius_km        numeric(6,2),
  lat              numeric(10,7),
  lng              numeric(10,7),
  num_differences  integer default 5,
  time_limit_sec   integer default 120,
  status           text default 'draft'
                   check (status in ('draft','active','paused','archived')),
  starts_at        timestamptz,
  ends_at          timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists idx_campaigns_status on campaigns(status);
create index if not exists idx_campaigns_client on campaigns(client_id);

-- Afbeeldingsvarianten
-- differences: [{id:"d1", x:0.45, y:0.32, radius:0.05, label:"Bloem"}]
create table if not exists campaign_variants (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid references campaigns(id) on delete cascade,
  label           text not null default 'Variant A',
  image_original  text not null,
  image_modified  text not null,
  differences     jsonb not null default '[]',
  is_active       boolean default true,
  sort_order      integer default 0,
  client_approved boolean,
  client_comment  text,
  approved_at     timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists idx_variants_campaign on campaign_variants(campaign_id);

-- Previewlinks (tokengebaseerd, met vervaldatum)
create table if not exists preview_links (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid references campaigns(id) on delete cascade,
  token        text unique not null default gen_random_uuid()::text,
  label        text,
  expires_at   timestamptz not null,
  used_at      timestamptz,
  created_at   timestamptz default now()
);

create index if not exists idx_preview_token on preview_links(token);

-- Spelers
create table if not exists players (
  id           uuid primary key default gen_random_uuid(),
  first_name   text not null,
  last_name    text not null,
  email        text not null,
  phone        text,
  postal_code  text,
  city         text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists idx_players_email on players(email);

-- Spelersessies
create table if not exists game_sessions (
  id                 uuid primary key default gen_random_uuid(),
  campaign_id        uuid references campaigns(id) on delete set null,
  variant_id         uuid references campaign_variants(id) on delete set null,
  player_id          uuid references players(id) on delete set null,
  player_postcode    text,
  player_city        text,
  player_lat         numeric(10,7),
  player_lng         numeric(10,7),
  differences_found  integer default 0,
  differences_total  integer default 0,
  completed          boolean default false,
  score              integer default 0,
  time_spent_sec     integer,
  click_log          jsonb default '[]',
  session_token      text unique not null default gen_random_uuid()::text,
  ip_address         inet,
  user_agent         text,
  started_at         timestamptz default now(),
  completed_at       timestamptz,
  registered_at      timestamptz
);

create index if not exists idx_sessions_campaign on game_sessions(campaign_id);
create index if not exists idx_sessions_player   on game_sessions(player_id);
create index if not exists idx_sessions_token    on game_sessions(session_token);

-- Prijzen
create table if not exists prizes (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid references campaigns(id) on delete cascade,
  title         text not null,
  description   text,
  value_eur     numeric(8,2),
  quantity      integer default 1,
  remaining     integer default 1,
  win_condition text default 'random_draw'
                check (win_condition in ('all_found','any_complete','random_draw')),
  active        boolean default true,
  created_at    timestamptz default now()
);

create index if not exists idx_prizes_campaign on prizes(campaign_id);

-- Winnaars
create table if not exists winners (
  id               uuid primary key default gen_random_uuid(),
  game_session_id  uuid references game_sessions(id) on delete cascade,
  player_id        uuid references players(id) on delete cascade,
  prize_id         uuid references prizes(id) on delete set null,
  campaign_id      uuid references campaigns(id) on delete set null,
  notified         boolean default false,
  notified_at      timestamptz,
  claimed          boolean default false,
  claimed_at       timestamptz,
  notes            text,
  created_at       timestamptz default now()
);

create index if not exists idx_winners_campaign on winners(campaign_id);

-- Marketingtoestemmingen (AVG-compliant)
create table if not exists marketing_consents (
  id               uuid primary key default gen_random_uuid(),
  player_id        uuid references players(id) on delete cascade,
  game_session_id  uuid references game_sessions(id) on delete set null,
  consent_marketing boolean not null default false,
  consent_terms     boolean not null default false,
  consent_privacy   boolean not null default false,
  consent_text_shown text,
  ip_address        inet,
  user_agent        text,
  consented_at      timestamptz default now()
);

create index if not exists idx_consents_player on marketing_consents(player_id);

-- =========================================================
-- Supabase Storage bucket voor afbeeldingen
-- =========================================================
insert into storage.buckets (id, name, public)
values ('campaign-images', 'campaign-images', true)
on conflict do nothing;

create policy "Public read campaign images"
  on storage.objects for select
  using (bucket_id = 'campaign-images');

create policy "Service role upload campaign images"
  on storage.objects for insert
  with check (bucket_id = 'campaign-images');

-- =========================================================
-- RLS uitgeschakeld — service role key server-side
-- =========================================================
alter table clients             disable row level security;
alter table campaigns           disable row level security;
alter table campaign_variants   disable row level security;
alter table preview_links       disable row level security;
alter table players             disable row level security;
alter table game_sessions       disable row level security;
alter table prizes              disable row level security;
alter table winners             disable row level security;
alter table marketing_consents  disable row level security;

-- =========================================================
-- RPC: prijs claimen met race-condition beveiliging
-- =========================================================
create or replace function claim_prize(
  p_prize_id uuid,
  p_session_id uuid,
  p_player_id uuid,
  p_campaign_id uuid
) returns boolean language plpgsql as $$
declare
  updated_count int;
begin
  update prizes
  set remaining = remaining - 1
  where id = p_prize_id and remaining > 0;

  get diagnostics updated_count = row_count;

  if updated_count = 0 then
    return false;
  end if;

  insert into winners (game_session_id, player_id, prize_id, campaign_id)
  values (p_session_id, p_player_id, p_prize_id, p_campaign_id);

  return true;
end;
$$;
