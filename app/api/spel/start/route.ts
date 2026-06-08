import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function rateLimit(ip: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: 'Te veel pogingen, even wachten.' }, { status: 429 })
  }

  const body = await req.json()
  const { campaign_id, variant_id, player_postcode, player_city, player_lat, player_lng } = body

  if (!campaign_id || !variant_id) {
    return NextResponse.json({ error: 'campaign_id en variant_id vereist' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Haal aantal verschillen op
  const { data: variant } = await supabase
    .from('campaign_variants')
    .select('differences')
    .eq('id', variant_id)
    .single()

  const diffCount = Array.isArray(variant?.differences) ? variant.differences.length : 0

  const { data, error } = await supabase
    .from('game_sessions')
    .insert({
      campaign_id,
      variant_id,
      player_postcode: player_postcode ?? null,
      player_city: player_city ?? null,
      player_lat: player_lat ?? null,
      player_lng: player_lng ?? null,
      differences_total: diffCount,
      ip_address: ip,
      user_agent: req.headers.get('user-agent'),
    })
    .select('session_token, id')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Kan sessie niet aanmaken' }, { status: 500 })
  }

  return NextResponse.json({ session_token: data.session_token })
}
