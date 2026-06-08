import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })

  const supabase = createServiceClient()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayStr = todayStart.toISOString()

  const [campaigns, sessionsToday, playersToday, completedToday, leadsToday] = await Promise.all([
    supabase.from('campaigns').select('id, status'),
    supabase.from('game_sessions').select('id', { count: 'exact', head: true }).gte('started_at', todayStr),
    supabase.from('players').select('id', { count: 'exact', head: true }).gte('created_at', todayStr),
    supabase.from('game_sessions').select('id', { count: 'exact', head: true }).gte('started_at', todayStr).eq('completed', true),
    supabase.from('game_sessions').select('id', { count: 'exact', head: true }).gte('registered_at', todayStr).not('player_id', 'is', null),
  ])

  const campaignList = campaigns.data ?? []
  const active = campaignList.filter((c) => c.status === 'active').length
  const pendingApproval = await supabase
    .from('campaign_variants')
    .select('id', { count: 'exact', head: true })
    .is('client_approved', null)

  return NextResponse.json({
    total_campaigns: campaignList.length,
    active_campaigns: active,
    sessions_today: sessionsToday.count ?? 0,
    players_today: playersToday.count ?? 0,
    completed_today: completedToday.count ?? 0,
    leads_today: leadsToday.count ?? 0,
    pending_approval: pendingApproval.count ?? 0,
  })
}
