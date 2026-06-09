'use client'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { CheckCircle, Mail, Calendar, Play, ArrowRight } from 'lucide-react'
import PwaInstallBanner from '@/components/player/PwaInstallBanner'
import { Campaign } from '@/lib/types'

export default function BedanktPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: currentCampaignId } = use(params)
  const [moreCampaigns, setMoreCampaigns] = useState<Campaign[]>([])

  useEffect(() => {
    // Haal de overige campagnes op uit sessionStorage
    const availableIds: string[] = JSON.parse(sessionStorage.getItem('available_campaigns') ?? '[]')
    const remaining = availableIds.filter((cid) => cid !== currentCampaignId)
    if (remaining.length === 0) return

    // Laad campagne-info voor de overige ID's
    Promise.all(
      remaining.map((cid) =>
        fetch(`/api/campagnes/${cid}`)
          .then((r) => r.json())
          .then((d) => d.campaign as Campaign)
          .catch(() => null)
      )
    ).then((results) => {
      setMoreCampaigns(results.filter(Boolean) as Campaign[])
    })
  }, [currentCampaignId])

  return (
    <div className="flex flex-col items-center gap-8 py-6 text-center">
      <div>
        <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-3xl mb-4">
          <CheckCircle className="h-14 w-14 text-[var(--color-success)]" />
        </div>
        <h1 className="text-3xl font-extrabold">Bedankt!</h1>
        <p className="text-[var(--color-muted)] mt-2">Je doet mee aan de trekking.</p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)] w-full max-w-sm space-y-4">
        <div className="flex items-start gap-3 text-left">
          <div className="bg-blue-50 rounded-lg p-1.5 shrink-0">
            <Mail className="h-5 w-5 text-[var(--color-primary)]" />
          </div>
          <div>
            <p className="font-semibold text-sm">Je hoort het per e-mail</p>
            <p className="text-xs text-[var(--color-muted)]">Als je wint, sturen we je een bericht op het opgegeven e-mailadres.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 text-left">
          <div className="bg-blue-50 rounded-lg p-1.5 shrink-0">
            <Calendar className="h-5 w-5 text-[var(--color-primary)]" />
          </div>
          <div>
            <p className="font-semibold text-sm">Kom morgen terug</p>
            <p className="text-xs text-[var(--color-muted)]">Er is elke dag een nieuwe kans om te winnen.</p>
          </div>
        </div>
      </div>

      {/* Meer campagnes */}
      {moreCampaigns.length > 0 && (
        <div className="w-full max-w-sm flex flex-col gap-3">
          <p className="font-bold text-base">
            🎉 Speel ook mee bij {moreCampaigns.length > 1 ? 'deze campagnes' : 'deze campagne'}!
          </p>
          {moreCampaigns.map((c) => {
            const clientName = (c.client as { name: string } | undefined)?.name
            return (
              <Link
                key={c.id}
                href={`/speel/campagne/${c.id}`}
                className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-4 hover:border-blue-400 transition-colors"
              >
                {c.flyer_image && (
                  <img src={c.flyer_image} alt={c.title} className="h-12 w-16 rounded-xl object-cover shrink-0" />
                )}
                <div className="flex-1 text-left min-w-0">
                  {clientName && <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{clientName}</p>}
                  <p className="font-bold text-sm">{c.title}</p>
                  {c.flyer_tagline && <p className="text-xs text-[var(--color-muted)] truncate">{c.flyer_tagline}</p>}
                </div>
                <div className="bg-[var(--color-primary)] text-white rounded-xl px-2.5 py-1.5 flex items-center gap-1 text-xs font-bold shrink-0">
                  <Play className="h-3 w-3" /> Speel
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <Link href="/speel" className="text-sm text-[var(--color-primary)] font-semibold hover:underline flex items-center gap-1">
        Keer terug naar het speelscherm <ArrowRight className="h-4 w-4" />
      </Link>

      <PwaInstallBanner />
    </div>
  )
}
