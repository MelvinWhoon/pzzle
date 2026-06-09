import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { calculateScore } from '@/lib/game'

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const body = await req.json()
  const { differences_found, time_spent_sec, click_log } = body

  const supabase = createServiceClient()

  const { data: session, error: sesErr } = await supabase
    .from('game_sessions')
    .select('*, campaign:campaigns(time_limit_sec, instant_win_enabled, instant_win_slots, instant_win_time_sec, prizes(id, title, active))')
    .eq('session_token', token)
    .single()

  if (sesErr || !session) {
    return NextResponse.json({ error: 'Sessie niet gevonden' }, { status: 404 })
  }

  if (session.completed) {
    return NextResponse.json({ error: 'Spel al voltooid' }, { status: 409 })
  }

  const campaign = (Array.isArray(session.campaign) ? session.campaign[0] : session.campaign) as {
    time_limit_sec: number
    instant_win_enabled: boolean
    instant_win_slots: number
    instant_win_time_sec: number | null
    prizes?: { id: string; title: string; active: boolean }[]
  } | null

  const completed = differences_found >= session.differences_total
  const score = calculateScore(
    differences_found,
    session.differences_total,
    time_spent_sec ?? 0,
    campaign?.time_limit_sec ?? 0
  )

  const { error: updateErr } = await supabase
    .from('game_sessions')
    .update({
      differences_found,
      completed,
      score,
      time_spent_sec: time_spent_sec ?? null,
      click_log: click_log ?? [],
      completed_at: new Date().toISOString(),
    })
    .eq('session_token', token)

  if (updateErr) {
    return NextResponse.json({ error: 'Kan sessie niet bijwerken' }, { status: 500 })
  }

  // ── Instant Win check ─────────────────────────────────────────────────────
  let instantWin = false
  let instantWinPrize: string | null = null

  if (
    completed &&
    campaign?.instant_win_enabled &&
    (campaign.instant_win_slots ?? 0) > 0
  ) {
    // Tijdscheck (als ingesteld)
    const withinTime = campaign.instant_win_time_sec == null
      || (time_spent_sec != null && time_spent_sec <= campaign.instant_win_time_sec)

    if (withinTime) {
      // Tel hoeveel instant-win slots al gebruikt zijn
      const { count: usedSlots } = await supabase
        .from('winners')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', session.campaign_id)
        .eq('is_instant_win', true)

      if ((usedSlots ?? 0) < campaign.instant_win_slots) {
        // Slot beschikbaar — maak winnaarrecord aan
        const activePrize = campaign.prizes?.find((p) => p.active)
        const { error: winErr } = await supabase.from('winners').insert({
          game_session_id: session.id,
          player_id: session.player_id,
          prize_id: activePrize?.id ?? null,
          campaign_id: session.campaign_id,
          is_instant_win: true,
          notified: false,
        })

        if (!winErr) {
          instantWin = true
          instantWinPrize = activePrize?.title ?? null
        }
      }
    }
  }

  return NextResponse.json({ completed, score, session_token: token, instant_win: instantWin, instant_win_prize: instantWinPrize })
}
