import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
  const { id } = await params
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*, campaigns(count)')
    .eq('id', id)
    .single()
  if (error || !data) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })
  const client = {
    ...data,
    campaign_count: (data as Record<string, unknown> & { campaigns?: { count: number }[] }).campaigns?.[0]?.count ?? 0,
    campaigns: undefined,
  }
  return NextResponse.json({ client })
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const supabase = createServiceClient()
  const { data, error } = await supabase.from('clients').update({ ...body, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ client: data })
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
  const { id } = await params
  const supabase = createServiceClient()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
