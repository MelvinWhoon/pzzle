import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const days = body.days ?? 14
  const label = body.label ?? null

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + days)

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('preview_links')
    .insert({ campaign_id: id, expires_at: expiresAt.toISOString(), label })
    .select('token')
    .single()

  if (error || !data) return NextResponse.json({ error: 'Kan link niet aanmaken' }, { status: 500 })
  return NextResponse.json({ token: data.token })
}
