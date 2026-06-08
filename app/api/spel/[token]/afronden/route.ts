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
    .select('*, campaign:campaigns(time_limit_sec)')
    .eq('session_token', token)
    .single()

  if (sesErr || !session) {
    return NextResponse.json({ error: 'Sessie niet gevonden' }, { status: 404 })
  }

  if (session.completed) {
    return NextResponse.json({ error: 'Spel al voltooid' }, { status: 409 })
  }

  const completed = differences_found >= session.differences_total
  const score = calculateScore(
    differences_found,
    session.differences_total,
    time_spent_sec ?? 0,
    session.campaign?.time_limit_sec ?? 0
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

  return NextResponse.json({ completed, score, session_token: token })
}
