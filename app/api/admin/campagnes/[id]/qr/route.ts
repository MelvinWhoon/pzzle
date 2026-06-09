import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import QRCode from 'qrcode'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
  const { id } = await params

  // Haal campagnenaam op voor bestandsnaam
  const supabase = createServiceClient()
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('title, client:clients(name)')
    .eq('id', id)
    .single()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://zoek-de-verschillen.vercel.app'
  const targetUrl = `${appUrl}/speel/campagne/${id}`

  const buffer: Buffer = await QRCode.toBuffer(targetUrl, {
    type: 'png',
    width: 600,
    margin: 3,
    color: { dark: '#1e293b', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  })

  const clientName = (Array.isArray(campaign?.client) ? campaign?.client[0] : campaign?.client) as { name: string } | null
  const safeName = (campaign?.title ?? clientName?.name ?? id.slice(0, 8))
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()

  return new Response(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="qr-pzzle-${safeName}.png"`,
      'Cache-Control': 'no-store',
    },
  })
}
