export interface Client {
  id: string
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  city: string | null
  postal_code: string | null
  notes: string | null
  active: boolean
  logo_url: string | null
  website: string | null
  campaign_count?: number
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  client_id: string | null
  title: string
  description: string | null
  city: string | null
  postal_codes: string[]
  radius_km: number | null
  lat: number | null
  lng: number | null
  num_differences: number
  time_limit_sec: number
  status: 'draft' | 'active' | 'paused' | 'archived'
  starts_at: string | null
  ends_at: string | null
  flyer_image: string | null
  flyer_tagline: string | null
  created_at: string
  updated_at: string
  client?: Client
  variants?: CampaignVariant[]
}

export interface PolygonPoint {
  x: number
  y: number
}

export interface Difference {
  id: string
  type?: 'circle' | 'polygon'
  x: number       // centerpunt (cirkel) of centroïde (polygoon)
  y: number
  radius: number  // cirkel-radius; polygoon gebruikt points
  points?: PolygonPoint[]
  label?: string
}

export interface CampaignVariant {
  id: string
  campaign_id: string
  label: string
  image_original: string
  image_modified: string
  differences: Difference[]
  is_active: boolean
  sort_order: number
  client_approved: boolean | null
  client_comment: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

export interface PreviewLink {
  id: string
  campaign_id: string
  token: string
  label: string | null
  expires_at: string
  used_at: string | null
  created_at: string
}

export interface Player {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  postal_code: string | null
  city: string | null
  created_at: string
  updated_at: string
}

export interface ClickLogEntry {
  x: number
  y: number
  hit: boolean
  difference_id: string | null
  ts: number
}

export interface GameSession {
  id: string
  campaign_id: string | null
  variant_id: string | null
  player_id: string | null
  player_postcode: string | null
  player_city: string | null
  player_lat: number | null
  player_lng: number | null
  differences_found: number
  differences_total: number
  completed: boolean
  score: number
  time_spent_sec: number | null
  click_log: ClickLogEntry[]
  session_token: string
  ip_address: string | null
  user_agent: string | null
  started_at: string
  completed_at: string | null
  registered_at: string | null
  player?: Player
  campaign?: Campaign
  variant?: CampaignVariant
}

export interface Prize {
  id: string
  campaign_id: string
  title: string
  description: string | null
  value_eur: number | null
  quantity: number
  remaining: number
  win_condition: 'all_found' | 'any_complete' | 'random_draw'
  active: boolean
  created_at: string
}

export interface Winner {
  id: string
  game_session_id: string
  player_id: string
  prize_id: string | null
  campaign_id: string | null
  notified: boolean
  notified_at: string | null
  claimed: boolean
  claimed_at: string | null
  notes: string | null
  created_at: string
  player?: Player
  prize?: Prize
  campaign?: Campaign
  game_session?: GameSession
}

export interface MarketingConsent {
  id: string
  player_id: string
  game_session_id: string | null
  consent_marketing: boolean
  consent_terms: boolean
  consent_privacy: boolean
  consent_text_shown: string | null
  ip_address: string | null
  user_agent: string | null
  consented_at: string
}

export interface AdminStats {
  total_campaigns: number
  active_campaigns: number
  players_today: number
  sessions_today: number
  completed_today: number
  leads_today: number
  pending_approval: number
  ready_for_draw: number
}

export interface LocationInput {
  lat?: number
  lng?: number
  postcode?: string
  city?: string
}

export interface RegistrationInput {
  session_token: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  postal_code?: string
  city?: string
  consent_marketing: boolean
  consent_terms: boolean
  consent_privacy: boolean
  consent_text_shown: string
}
