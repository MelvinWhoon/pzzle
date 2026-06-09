import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { sendRegistrationConfirmation } from '@/lib/mailer'
import { RegistrationInput } from '@/lib/types'

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
function rateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: 'Te veel pogingen' }, { status: 429 })
  }

  const body: RegistrationInput = await req.json()
  const {
    session_token, first_name, last_name, email, phone, postal_code, city,
    consent_marketing, consent_terms, consent_privacy, consent_text_shown,
  } = body

  if (!session_token || !first_name || !last_name || !email) {
    return NextResponse.json({ error: 'Verplichte velden ontbreken' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Controleer sessie + haal campagne info op voor e-mail
  const { data: session, error: sesErr } = await supabase
    .from('game_sessions')
    .select('id, campaign_id, player_id, campaign:campaigns(title, client:clients(name))')
    .eq('session_token', session_token)
    .single()

  if (sesErr || !session) {
    return NextResponse.json({ error: 'Ongeldige sessie' }, { status: 400 })
  }

  if (session.player_id) {
    return NextResponse.json({ error: 'Al geregistreerd voor dit spel' }, { status: 409 })
  }

  // Speler aanmaken of bijwerken op basis van e-mail
  let playerId: string
  const { data: existing } = await supabase
    .from('players')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (existing) {
    playerId = existing.id

    // ── Play-once check: heeft deze speler al een voltooide registratie voor deze campagne? ──
    const { data: prevSession } = await supabase
      .from('game_sessions')
      .select('id')
      .eq('player_id', existing.id)
      .eq('campaign_id', session.campaign_id)
      .not('registered_at', 'is', null)
      .neq('id', session.id)
      .limit(1)
      .maybeSingle()

    if (prevSession) {
      return NextResponse.json({ error: 'already_played', campaign_id: session.campaign_id }, { status: 409 })
    }

    await supabase
      .from('players')
      .update({ first_name, last_name, phone: phone ?? null, postal_code: postal_code ?? null, city: city ?? null, updated_at: new Date().toISOString() })
      .eq('id', playerId)
  } else {
    const { data: newPlayer, error: playerErr } = await supabase
      .from('players')
      .insert({ first_name, last_name, email: email.toLowerCase().trim(), phone: phone ?? null, postal_code: postal_code ?? null, city: city ?? null })
      .select('id')
      .single()
    if (playerErr || !newPlayer) {
      return NextResponse.json({ error: 'Kan speler niet aanmaken' }, { status: 500 })
    }
    playerId = newPlayer.id
  }

  // Koppel speler aan sessie
  await supabase
    .from('game_sessions')
    .update({ player_id: playerId, registered_at: new Date().toISOString() })
    .eq('session_token', session_token)

  // Sla toestemmingen op (AVG)
  await supabase.from('marketing_consents').insert({
    player_id: playerId,
    game_session_id: session.id,
    consent_marketing,
    consent_terms,
    consent_privacy,
    consent_text_shown,
    ip_address: ip,
    user_agent: req.headers.get('user-agent'),
  })

  // Stuur bevestigingsmail (non-blocking — laat app niet falen als mail mislukt)
  const campaignRaw = session.campaign
  const campaign = (Array.isArray(campaignRaw) ? campaignRaw[0] : campaignRaw) as unknown as { title: string; client?: { name: string } | null } | null
  if (campaign) {
    sendRegistrationConfirmation({ email: email.toLowerCase().trim(), first_name }, campaign).catch(() => {})
  }

  return NextResponse.json({ success: true, player_id: playerId })
}
