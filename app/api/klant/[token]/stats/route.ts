import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createServiceClient()

  // Zoek klant op basis van stats_token
  const { data: client, error } = await supabase
    .from('clients')
    .select('id, name, logo_url, website, city')
    .eq('stats_token', token)
    .single()

  if (error || !client) {
    return NextResponse.json({ error: 'Onbekende link' }, { status: 404 })
  }

  // Haal alle campagnes van deze klant op
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, title, status, starts_at, ends_at')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })

  const campaignIds = (campaigns ?? []).map((c) => c.id)

  if (campaignIds.length === 0) {
    return NextResponse.json({
      client,
      campaigns: [],
      stats: {
        total_players: 0,
        total_leads: 0,
        completion_rate: 0,
        avg_score: 0,
        active_campaigns: 0,
        this_week_leads: 0,
      },
    })
  }

  // Totale sessies
  const { count: totalSessions } = await supabase
    .from('game_sessions')
    .select('id', { count: 'exact', head: true })
    .in('campaign_id', campaignIds)

  // Voltooide sessies
  const { count: completedSessions } = await supabase
    .from('game_sessions')
    .select('id', { count: 'exact', head: true })
    .in('campaign_id', campaignIds)
    .eq('completed', true)

  // Geregistreerde spelers (leads)
  const { count: totalLeads } = await supabase
    .from('game_sessions')
    .select('id', { count: 'exact', head: true })
    .in('campaign_id', campaignIds)
    .not('registered_at', 'is', null)

  // Leads deze week
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: weekLeads } = await supabase
    .from('game_sessions')
    .select('id', { count: 'exact', head: true })
    .in('campaign_id', campaignIds)
    .not('registered_at', 'is', null)
    .gte('registered_at', weekAgo)

  // Gemiddelde score
  const { data: scoreData } = await supabase
    .from('game_sessions')
    .select('score')
    .in('campaign_id', campaignIds)
    .eq('completed', true)
    .gt('score', 0)
    .limit(500)

  const scores = (scoreData ?? []).map((s) => s.score)
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0

  // Actieve campagnes
  const now = new Date().toISOString()
  const activeCampaigns = (campaigns ?? []).filter((c) =>
    c.status === 'active' &&
    (!c.starts_at || c.starts_at <= now) &&
    (!c.ends_at || c.ends_at >= now)
  ).length

  const completionRate = (totalSessions ?? 0) > 0
    ? Math.round(((completedSessions ?? 0) / (totalSessions ?? 1)) * 100)
    : 0

  // Recente leads (laatste 5)
  const { data: recentLeads } = await supabase
    .from('game_sessions')
    .select('registered_at, campaign_id, player:players(first_name, city)')
    .in('campaign_id', campaignIds)
    .not('registered_at', 'is', null)
    .order('registered_at', { ascending: false })
    .limit(5)

  return NextResponse.json({
    client,
    campaigns: campaigns ?? [],
    recent_leads: recentLeads ?? [],
    stats: {
      total_players: totalSessions ?? 0,
      total_leads: totalLeads ?? 0,
      completion_rate: completionRate,
      avg_score: avgScore,
      active_campaigns: activeCampaigns,
      this_week_leads: weekLeads ?? 0,
    },
  })
}
