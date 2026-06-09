import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })

  const supabase = createServiceClient()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayStr = todayStart.toISOString()

  const [campaigns, sessionsToday, playersToday, completedToday, leadsToday, scoresQuery, recentActivity] = await Promise.all([
    supabase.from('campaigns').select('id, status'),
    supabase.from('game_sessions').select('id', { count: 'exact', head: true }).gte('started_at', todayStr),
    supabase.from('players').select('id', { count: 'exact', head: true }).gte('created_at', todayStr),
    supabase.from('game_sessions').select('id', { count: 'exact', head: true }).gte('started_at', todayStr).eq('completed', true),
    supabase.from('game_sessions').select('id', { count: 'exact', head: true }).gte('registered_at', todayStr).not('player_id', 'is', null),
    supabase.from('game_sessions').select('score').gte('started_at', todayStr).eq('completed', true),
    supabase.from('game_sessions')
      .select('id, registered_at, player:players(first_name, last_name), campaign:campaigns(title)')
      .not('player_id', 'is', null)
      .not('registered_at', 'is', null)
      .order('registered_at', { ascending: false })
      .limit(5),
  ])

  const campaignList = campaigns.data ?? []
  const active = campaignList.filter((c) => c.status === 'active').length
  const pendingApproval = await supabase
    .from('campaign_variants')
    .select('id', { count: 'exact', head: true })
    .is('client_approved', null)

  // Gemiddelde score vandaag
  const scores = (scoresQuery.data ?? []).map((r: { score: number }) => r.score).filter((s) => s > 0)
  const avg_score = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

  const sessionsCount = sessionsToday.count ?? 0
  const completedCount = completedToday.count ?? 0
  const completion_rate = sessionsCount > 0 ? Math.round((completedCount / sessionsCount) * 100) : 0

  return NextResponse.json({
    total_campaigns: campaignList.length,
    active_campaigns: active,
    sessions_today: sessionsCount,
    players_today: playersToday.count ?? 0,
    completed_today: completedCount,
    leads_today: leadsToday.count ?? 0,
    pending_approval: pendingApproval.count ?? 0,
    avg_score,
    completion_rate,
    recent_activity: recentActivity.data ?? [],
  })
}
