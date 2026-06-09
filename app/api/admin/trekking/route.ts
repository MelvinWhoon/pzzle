import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { sendWinnerNotification } from '@/lib/mailer'

// GET /api/admin/trekking?scope=all&time_filter=today
// Geeft het aantal in aanmerking komende spelers terug
export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const scope = searchParams.get('scope') ?? 'all'
  const timeFilter = searchParams.get('time_filter') ?? 'today'
  const excludeWinners = searchParams.get('exclude_winners') !== 'false'

  const supabase = createServiceClient()

  let query = supabase
    .from('game_sessions')
    .select('player_id')
    .eq('completed', true)
    .not('player_id', 'is', null)

  if (scope !== 'all') query = query.eq('campaign_id', scope)

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

  if (excludeWinners && playerIds.length > 0) {
    const { data: existingWinners } = await supabase
      .from('winners').select('player_id').in('player_id', playerIds)
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

  let query = supabase
    .from('game_sessions')
    .select('id, player_id, campaign_id')
    .eq('completed', true)
    .not('player_id', 'is', null)

  if (scope && scope !== 'all') query = query.eq('campaign_id', scope)

  if (time_filter === 'today') {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    query = query.gte('completed_at', today.toISOString())
  } else if (time_filter === 'week') {
    const week = new Date(); week.setDate(week.getDate() - 7)
    query = query.gte('completed_at', week.toISOString())
  }

  const { data: sessions, error: sessErr } = await query
  if (sessErr) return NextResponse.json({ error: sessErr.message }, { status: 500 })

  const seen = new Set<string>()
  const eligibleSessions = (sessions ?? []).filter((s: { player_id: string }) => {
    if (seen.has(s.player_id)) return false
    seen.add(s.player_id); return true
  })

  let pool = eligibleSessions
  if (exclude_winners !== false && pool.length > 0) {
    const { data: existingWinners } = await supabase
      .from('winners').select('player_id').in('player_id', pool.map((s: { player_id: string }) => s.player_id))
    const winnerIds = new Set((existingWinners ?? []).map((w: { player_id: string }) => w.player_id))
    pool = pool.filter((s: { player_id: string }) => !winnerIds.has(s.player_id))
  }

  if (pool.length === 0) {
    return NextResponse.json({ error: 'Geen in aanmerking komende spelers gevonden' }, { status: 400 })
  }

  const picked = pool[Math.floor(Math.random() * pool.length)] as { id: string; player_id: string; campaign_id: string | null }
  const prizeNotes = prize_description ? `${prize_title} — ${prize_description}` : prize_title

  const { data: winnerRecord, error: winErr } = await supabase
    .from('winners')
    .insert({
      game_session_id: picked.id,
      player_id: picked.player_id,
      campaign_id: picked.campaign_id,
      prize_id: null,
      notes: prizeNotes,
      notified: false,
    })
    .select('*, player:players(first_name, last_name, email, phone), campaign:campaigns(title, client:clients(name))')
    .single()

  if (winErr) return NextResponse.json({ error: winErr.message }, { status: 500 })

  // Stuur automatisch winnaarmelding (non-blocking)
  const player = winnerRecord.player as { first_name: string; last_name: string; email: string } | null
  const campaign = winnerRecord.campaign as { title: string; client?: { name: string } | null } | null
  if (player && campaign) {
    sendWinnerNotification(
      player,
      campaign.title,
      (campaign.client as { name: string } | null)?.name ?? campaign.title,
      prizeNotes,
    ).then(async () => {
      // Markeer als genotificeerd na succesvolle mail
      await supabase.from('winners').update({ notified: true, notified_at: new Date().toISOString() }).eq('id', winnerRecord.id)
    }).catch(() => {})
  }

  return NextResponse.json({ winner: winnerRecord }, { status: 201 })
}
