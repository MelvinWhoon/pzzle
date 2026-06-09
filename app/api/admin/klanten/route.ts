import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*, campaigns(count)')
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Flatten the campaign count from the nested join
  const clients = (data ?? []).map((c: Record<string, unknown> & { campaigns?: { count: number }[] }) => ({
    ...c,
    campaign_count: c.campaigns?.[0]?.count ?? 0,
    campaigns: undefined,
  }))
  return NextResponse.json({ clients })
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
  const body = await req.json()
  const supabase = createServiceClient()
  const { data, error } = await supabase.from('clients').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ client: data }, { status: 201 })
}
