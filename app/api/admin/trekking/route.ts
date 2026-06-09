import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

// GET /api/admin/trekking?scope=all&time_filter=today
// Geeft het aantal in aanmerking komende spelers terug
export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const scope = searchParams.get('scope') ?? 'all'          // 'all' | campaign_id
  const timeFilter = searchParams.get('time_filter') ?? 'today'  // 'today' | 'week' | 'all'
  const excludeWinners = searchParams.get('exclude_winners') !== 'false'

  const supabase = createServiceClient()

  let query = supabase
    .from('game_sessions')
    .select('player_id')
    .eq('completed', true)
    .not('player_id', 'is', null)

  if (scope !== 'all') {
    query = query.eq('campaign_id', scope)
  }

  if (timeFilter === 'today') {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    query = query.gte('completed_at', today.toISOString())
  } else if (timeFilter === 'week') {
    const week = new Date(); week.setDate(week.getDate() - 7)
    query = query.gte('completed_at', week.toISOString())
  }

  const { data: sessions, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let playerIds = [...new Set((sessions ?? []).map((s: { player_id: string }) => s.player_id))]

  // Sluit eerdere winnaars uit als gevraagd
  if (excludeWinners && playerIds.length > 0) {
    const { data: existingWinners } = await supabase
      .from('winners')
      .select('player_id')
      .in('player_id', playerIds)
    const winnerIds = new Set((existingWinners ?? []).map((w: { player_id: string }) => w.player_id))
    playerIds = playerIds.filter((id) => !winnerIds.has(id))
  }

  return NextResponse.json({ count: playerIds.length })
}

// POST /api/admin/trekking
// Trekt een willekeurige winnaar en slaat hem op
export async function POST(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })

  const { prize_title, prize_description, scope, time_filter, exclude_winners } = await req.json()

  if (!prize_title?.trim()) {
    return NextResponse.json({ error: 'Prijs-omschrijving is verplicht' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Haal in aanmerking komende sessies op
  let query = supabase
    .from('game_sessions')
    .select('id, player_id, campaign_id')
    .eq('completed', true)
    .not('player_id', 'is', null)

  if (scope && scope !== 'all') {
    query = query.eq('campaign_id', scope)
  }

  if (time_filter === 'today') {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    query = query.gte('completed_at', today.toISOString())
  } else if (time_filter === 'week') {
    const week = new Date(); week.setDate(week.getDate() - 7)
    query = query.gte('completed_at', week.toISOString())
  }

  const { data: sessions, error: sessErr } = await query
  if (sessErr) return NextResponse.json({ error: sessErr.message }, { status: 500 })

  // Dedupliceer op player_id
  const seen = new Set<string>()
  const eligibleSessions = (sessions ?? []).filter((s: { player_id: string }) => {
    if (seen.has(s.player_id)) return false
    seen.add(s.player_id)
    return true
  })

  // Sluit eerdere winnaars uit
  let pool = eligibleSessions
  if (exclude_winners !== false && pool.length > 0) {
    const { data: existingWinners } = await supabase
      .from('winners')
      .select('player_id')
      .in('player_id', pool.map((s: { player_id: string }) => s.player_id))
    const winnerIds = new Set((existingWinners ?? []).map((w: { player_id: string }) => w.player_id))
    pool = pool.filter((s: { player_id: string }) => !winnerIds.has(s.player_id))
  }

  if (pool.length === 0) {
    return NextResponse.json({ error: 'Geen in aanmerking komende spelers gevonden' }, { status: 400 })
  }

  // Willekeurige winnaar
  const winner = pool[Math.floor(Math.random() * pool.length)] as { id: string; player_id: string; campaign_id: string | null }

  // Maak winner-record aan (zonder prize_id, prijs staat in notes)
  const { data: winnerRecord, error: winErr } = await supabase
    .from('winners')
    .insert({
      game_session_id: winner.id,
      player_id: winner.player_id,
      campaign_id: winner.campaign_id,
      prize_id: null,
      notes: prize_description ? `${prize_title} — ${prize_description}` : prize_title,
    })
    .select('*, player:players(first_name, last_name, email, phone), campaign:campaigns(title)')
    .single()

  if (winErr) return NextResponse.json({ error: winErr.message }, { status: 500 })

  return NextResponse.json({ winner: winnerRecord }, { status: 201 })
}
