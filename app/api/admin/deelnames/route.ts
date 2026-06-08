import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const campaignId = searchParams.get('campaign_id')
  const supabase = createServiceClient()

  let query = supabase
    .from('game_sessions')
    .select('*, player:players(first_name, last_name, email), campaign:campaigns(title)')
    .order('started_at', { ascending: false })
    .limit(200)

  if (campaignId) query = query.eq('campaign_id', campaignId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sessions: data })
}
