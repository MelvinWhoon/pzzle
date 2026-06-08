import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createServiceClient()

  const { data: link, error } = await supabase
    .from('preview_links')
    .select('*, campaign:campaigns(*, variants:campaign_variants(*))')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !link) {
    return NextResponse.json({ error: 'Link ongeldig of verlopen' }, { status: 404 })
  }

  // Registreer eerste bezoek
  if (!link.used_at) {
    await supabase
      .from('preview_links')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token)
  }

  return NextResponse.json({ link })
}
