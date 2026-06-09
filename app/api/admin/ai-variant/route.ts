import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`

const VARIANT_PROMPTS = [
  `Je krijgt een afbeelding van een lokaal bedrijf. Maak een vrijwel identieke variant voor een "zoek de verschillen" spel.
   Voer exact 5 subtiele maar vindbare aanpassingen door, zoals:
   - Verander de kleur van één object (bijv. een lamp, een stoel, een logo-kleur)
   - Voeg een klein detail toe of verwijder het (bijv. een plant, een schilderij, een klok)
   - Wijzig een getal of tekst in de afbeelding (prijskaartje, openingstijden)
   - Verplaats een klein object iets
   - Verander een patroon of textuur op één element
   Houd de rest van de afbeelding pixel-perfect gelijk. Variatie A.`,

  `Je krijgt een afbeelding van een lokaal bedrijf. Maak een vrijwel identieke variant voor een "zoek de verschillen" spel.
   Voer exact 5 subtiele maar vindbare aanpassingen door, anders dan de standaard variant:
   - Pas een kleur aan van een achtergrond-element
   - Voeg iets toe wat er normaal niet is (een extra object)
   - Verwijder een klein maar zichtbaar element
   - Wijzig de tekst of een getal ergens in beeld
   - Verander een detail van een product of decoratie
   Houd de rest identiek aan het origineel. Variatie B.`,
]

export async function POST(req: NextRequest) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
  }

  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY niet geconfigureerd' }, { status: 500 })
  }

  const { image_url, campaign_id } = await req.json()

  if (!image_url || !campaign_id) {
    return NextResponse.json({ error: 'image_url en campaign_id zijn verplicht' }, { status: 400 })
  }

  // Fetch the original image
  let base64Image: string
  let mimeType: string
  try {
    const imageRes = await fetch(image_url)
    if (!imageRes.ok) throw new Error(`Afbeelding ophalen mislukt: ${imageRes.status}`)
    const buffer = await imageRes.arrayBuffer()
    base64Image = Buffer.from(buffer).toString('base64')
    mimeType = imageRes.headers.get('content-type')?.split(';')[0] || 'image/jpeg'
  } catch (err) {
    return NextResponse.json({ error: `Afbeelding kon niet worden geladen: ${err}` }, { status: 400 })
  }

  const supabase = createServiceClient()
  const results: { url: string; label: string }[] = []

  for (let i = 0; i < 2; i++) {
    try {
      const geminiRes = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: VARIANT_PROMPTS[i] },
              { inlineData: { mimeType, data: base64Image } },
            ],
          }],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
          },
        }),
      })

      if (!geminiRes.ok) {
        const errJson = await geminiRes.json().catch(() => ({}))
        const msg = errJson?.error?.message || `HTTP ${geminiRes.status}`
        console.error(`Gemini fout variant ${i + 1}:`, msg)
        if (results.length === 0 && i === 1) {
          return NextResponse.json({ error: `Gemini API fout: ${msg}` }, { status: 502 })
        }
        continue
      }

      const geminiData = await geminiRes.json()
      const parts = geminiData.candidates?.[0]?.content?.parts ?? []
      const imagePart = parts.find((p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData?.data)

      if (!imagePart?.inlineData) {
        const reason = geminiData.candidates?.[0]?.finishReason || 'onbekend'
        console.error(`Geen afbeelding in Gemini response voor variant ${i + 1}, reden: ${reason}`)
        if (results.length === 0 && i === 1) {
          return NextResponse.json({ error: `Gemini genereerde geen afbeelding (reden: ${reason})` }, { status: 502 })
        }
        continue
      }

      const ext = imagePart.inlineData.mimeType.split('/')[1] || 'png'
      const filename = `variants/ai-${campaign_id}-${Date.now()}-${i}.${ext}`
      const imgBuffer = Buffer.from(imagePart.inlineData.data, 'base64')

      const { error: uploadError } = await supabase.storage
        .from('campaign-images')
        .upload(filename, imgBuffer, { contentType: imagePart.inlineData.mimeType })

      if (uploadError) {
        console.error('Supabase upload fout:', uploadError.message)
        continue
      }

      const { data: { publicUrl } } = supabase.storage.from('campaign-images').getPublicUrl(filename)
      results.push({ url: publicUrl, label: `AI Variant ${i === 0 ? 'A' : 'B'}` })
    } catch (err) {
      console.error(`Fout bij genereren variant ${i + 1}:`, err)
    }
  }

  if (results.length === 0) {
    return NextResponse.json({ error: 'Gemini kon geen varianten genereren. Controleer de API-sleutel en de afbeelding.' }, { status: 500 })
  }

  return NextResponse.json({ variants: results })
}
