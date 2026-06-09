import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { sendWinnerNotification } from '@/lib/mailer'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const supabase = createServiceClient()

  // Speciale actie: stuur winnaar e-mail opnieuw
  if (body.action === 'send_email') {
    const { data: winner } = await supabase
      .from('winners')
      .select('*, player:players(first_name, last_name, email), campaign:campaigns(title, client:clients(name))')
      .eq('id', id)
      .single()

    if (!winner) return NextResponse.json({ error: 'Winnaar niet gevonden' }, { status: 404 })

    const player = winner.player as { first_name: string; last_name: string; email: string } | null
    const campaign = winner.campaign as { title: string; client?: { name: string } | null } | null

    if (player && campaign) {
      await sendWinnerNotification(
        player,
        campaign.title,
        (campaign.client as { name: string } | null)?.name ?? campaign.title,
        winner.notes ?? 'Prijs',
      )
    }

    // Markeer als notified
    const { data, error } = await supabase
      .from('winners')
      .update({ notified: true, notified_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ winner: data, email_sent: true })
  }

  // Normale PATCH (notified, claimed, etc.)
  const { data, error } = await supabase.from('winners').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ winner: data })
}
