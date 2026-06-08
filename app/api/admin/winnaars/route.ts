import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('winners')
    .select('*, player:players(first_name, last_name, email, phone), prize:prizes(title, value_eur), campaign:campaigns(title)')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ winners: data })
}
