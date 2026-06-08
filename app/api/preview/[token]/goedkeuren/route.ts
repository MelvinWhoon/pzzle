import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { variant_id, comment, approved } = await req.json()

  const supabase = createServiceClient()

  const { data: link, error } = await supabase
    .from('preview_links')
    .select('campaign_id')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !link) {
    return NextResponse.json({ error: 'Link ongeldig of verlopen' }, { status: 404 })
  }

  if (variant_id) {
    await supabase
      .from('campaign_variants')
      .update({
        client_approved: approved !== false,
        client_comment: comment ?? null,
        approved_at: new Date().toISOString(),
      })
      .eq('id', variant_id)
      .eq('campaign_id', link.campaign_id)
  }

  return NextResponse.json({ success: true })
}
