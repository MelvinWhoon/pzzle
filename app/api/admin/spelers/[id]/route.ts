import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
  const { id } = await params
  const supabase = createServiceClient()
  const [player, sessions, consents] = await Promise.all([
    supabase.from('players').select('*').eq('id', id).single(),
    supabase.from('game_sessions').select('*, campaign:campaigns(title)').eq('player_id', id).order('started_at', { ascending: false }),
    supabase.from('marketing_consents').select('*').eq('player_id', id).order('consented_at', { ascending: false }),
  ])
  if (player.error || !player.data) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })
  return NextResponse.json({ player: player.data, sessions: sessions.data ?? [], consents: consents.data ?? [] })
}
