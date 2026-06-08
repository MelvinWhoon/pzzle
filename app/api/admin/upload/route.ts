import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  const folder = (form.get('folder') as string) ?? 'images'

  if (!file) return NextResponse.json({ error: 'Geen bestand' }, { status: 400 })

  const ext = file.name.split('.').pop()
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const supabase = createServiceClient()
  const { error } = await supabase.storage.from('campaign-images').upload(filename, buffer, {
    contentType: file.type,
    upsert: false,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('campaign-images').getPublicUrl(filename)
  return NextResponse.json({ path: filename, url: publicUrl })
}
