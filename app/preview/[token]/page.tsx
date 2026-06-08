'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { CheckCircle, XCircle, Send } from 'lucide-react'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { CampaignVariant } from '@/lib/types'

export default function PreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState('')
  const [data, setData] = useState<{
    campaign: { title: string; client?: { name: string }; variants?: CampaignVariant[] }
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [approved, setApproved] = useState<boolean | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    params.then(({ token: t }) => {
      setToken(t)
      fetch(`/api/preview/${t}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.error) { setError(d.error); return }
          setData(d.link)
        })
        .catch(() => setError('Kan de previewpagina niet laden.'))
        .finally(() => setLoading(false))
    })
  }, [params])

  const handleSubmit = async () => {
    if (!token) return
    setSubmitting(true)
    try {
      await fetch(`/api/preview/${token}/goedkeuren`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variant_id: selectedVariant, comment, approved }),
      })
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-dvh flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )

  if (error) return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Link ongeldig of verlopen</h1>
        <p className="text-[var(--color-muted)]">{error}</p>
      </div>
    </div>
  )

  if (submitted) return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <CheckCircle className="h-16 w-16 text-[var(--color-success)] mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Bedankt voor je reactie!</h1>
        <p className="text-[var(--color-muted)]">We verwerken je keuze en nemen contact op.</p>
      </div>
    </div>
  )

  const campaign = data?.campaign
  const variants: CampaignVariant[] = (campaign?.variants ?? [])
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  return (
    <div className="min-h-dvh bg-[var(--color-surface)]">
      <header className="bg-white border-b border-[var(--color-border)] px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-[var(--color-muted)] uppercase tracking-wide">Campagnepreview</p>
          <h1 className="text-xl font-bold">{campaign?.title}</h1>
          {campaign?.client && <p className="text-sm text-[var(--color-muted)]">{campaign.client.name}</p>}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8">
        <p className="text-[var(--color-muted)]">
          Bekijk de varianten hieronder en laat weten welke je voorkeur heeft.
        </p>

        {/* Varianten */}
        <div className="flex flex-col gap-8">
          {variants.map((v, i) => {
            const origUrl = v.image_original.startsWith('http') ? v.image_original :
              `${supabaseUrl}/storage/v1/object/public/campaign-images/${v.image_original}`
            const modUrl = v.image_modified.startsWith('http') ? v.image_modified :
              `${supabaseUrl}/storage/v1/object/public/campaign-images/${v.image_modified}`

            return (
              <div
                key={v.id}
                className={`bg-white rounded-2xl border-2 p-6 cursor-pointer transition-all ${
                  selectedVariant === v.id ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)] hover:border-blue-200'
                }`}
                onClick={() => setSelectedVariant(v.id)}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedVariant === v.id ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-gray-300'
                  }`}>
                    {selectedVariant === v.id && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <h3 className="font-bold">{v.label ?? `Variant ${i + 1}`}</h3>
                  <span className="text-xs text-[var(--color-muted)] ml-auto">{v.differences?.length ?? 0} verschillen</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-center text-[var(--color-muted)] mb-2 font-medium uppercase tracking-wide">Origineel</p>
                    <div className="rounded-xl overflow-hidden bg-gray-100">
                      <Image src={origUrl} alt="Origineel" width={600} height={400} className="w-full h-auto" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-center text-[var(--color-muted)] mb-2 font-medium uppercase tracking-wide">Gewijzigd</p>
                    <div className="rounded-xl overflow-hidden bg-gray-100">
                      <Image src={modUrl} alt="Gewijzigd" width={600} height={400} className="w-full h-auto" />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Goedkeuring */}
        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 flex flex-col gap-4">
          <h2 className="font-bold">Jouw reactie</h2>

          <div className="flex gap-3">
            <button
              onClick={() => setApproved(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold transition-all ${
                approved === true ? 'border-green-500 bg-green-50 text-green-700' : 'border-[var(--color-border)] hover:border-green-200'
              }`}
            >
              <CheckCircle className="h-5 w-5" /> Goedkeuren
            </button>
            <button
              onClick={() => setApproved(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold transition-all ${
                approved === false ? 'border-red-400 bg-red-50 text-red-700' : 'border-[var(--color-border)] hover:border-red-200'
              }`}
            >
              <XCircle className="h-5 w-5" /> Wijzigingen nodig
            </button>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optioneel: opmerkingen of gewenste wijzigingen..."
            rows={3}
            className="w-full px-4 py-3 border border-[var(--color-border)] rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />

          <Button
            className="w-full"
            onClick={handleSubmit}
            loading={submitting}
            disabled={!selectedVariant || approved === null}
          >
            <Send className="h-4 w-4" />
            Reactie versturen
          </Button>
        </div>
      </main>
    </div>
  )
}
