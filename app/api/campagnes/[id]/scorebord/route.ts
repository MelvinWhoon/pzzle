import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const myScore = searchParams.get('score') ? parseInt(searchParams.get('score')!) : null
  const myTime = searchParams.get('time') ? parseInt(searchParams.get('time')!) : null

  const supabase = createServiceClient()

  // Top 10 voltooide, geregistreerde sessies — gesorteerd op score (hoog) dan tijd (laag)
  const { data } = await supabase
    .from('game_sessions')
    .select('id, score, time_spent_sec, differences_found, differences_total, player:players(first_name, last_name)')
    .eq('campaign_id', id)
    .eq('completed', true)
    .not('player_id', 'is', null)
    .not('registered_at', 'is', null)
    .order('score', { ascending: false })
    .order('time_spent_sec', { ascending: true })
    .limit(10)

  const entries = (data ?? []).map((s, index) => {
    const p = (Array.isArray(s.player) ? s.player[0] : s.player) as { first_name: string; last_name: string } | null
    const name = p
      ? `${p.first_name} ${p.last_name?.charAt(0) ?? ''}.`
      : `Speler ${index + 1}`
    return {
      rank: index + 1,
      name,
      score: s.score,
      time_spent_sec: s.time_spent_sec,
      differences_found: s.differences_found,
      differences_total: s.differences_total,
    }
  })

  // Bereken mijn rang op basis van score + tijd (als meegegeven)
  let myRank: number | null = null
  if (myScore !== null) {
    const { count } = await supabase
      .from('game_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', id)
      .eq('completed', true)
      .not('player_id', 'is', null)
      .not('registered_at', 'is', null)
      .gt('score', myScore)

    // Sessies met dezelfde score maar betere tijd
    const { count: fasterCount } = myTime !== null
      ? await supabase
          .from('game_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('campaign_id', id)
          .eq('completed', true)
          .not('player_id', 'is', null)
          .not('registered_at', 'is', null)
          .eq('score', myScore)
          .lt('time_spent_sec', myTime)
      : { count: 0 }

    myRank = (count ?? 0) + (fasterCount ?? 0) + 1
  }

  return NextResponse.json({ entries, my_rank: myRank })
}
