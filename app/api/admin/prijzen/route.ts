import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
  const supabase = createServiceClient()
  const { data, error } = await supabase.from('prizes').select('*, campaign:campaigns(title)').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ prizes: data })
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
  const body = await req.json()
  const supabase = createServiceClient()
  const { remaining, ...rest } = body
  const { data, error } = await supabase.from('prizes').insert({ ...rest, remaining: remaining ?? rest.quantity }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ prize: data }, { status: 201 })
}
