'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gamepad2, Gift, Clock, Play, ChevronRight } from 'lucide-react'
import LocationPicker from '@/components/player/LocationPicker'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Button from '@/components/ui/Button'
import { LocationInput, Campaign } from '@/lib/types'

export default function SpeelPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [showSelection, setShowSelection] = useState(false)

  const handleLocation = async (loc: LocationInput) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/campagnes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loc),
      })
      const data = await res.json()
      const found: Campaign[] = data.campaigns ?? []

      if (found.length === 0) {
        setError('Geen actieve campagne gevonden voor jouw locatie. Kom later terug!')
        return
      }

      // Sla locatie + beschikbare campagnes op voor de flow
      sessionStorage.setItem('player_location', JSON.stringify(loc))
      sessionStorage.setItem('available_campaigns', JSON.stringify(found.map((c) => c.id)))

      if (found.length === 1) {
        // Direct doorsturen
        router.push(`/speel/campagne/${found[0].id}`)
        return
      }

      // Meerdere campagnes: toon keuzescherm
      setCampaigns(found)
      setShowSelection(true)
    } catch {
      setError('Er ging iets mis. Probeer het opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  const pickCampaign = (campaign: Campaign) => {
    const activeVariant = campaign.variants?.find((v) => v.is_active) ?? campaign.variants?.[0]
    if (!activeVariant) {
      setError('Deze campagne heeft nog geen actieve afbeelding.')
      return
    }
    router.push(`/speel/campagne/${campaign.id}`)
  }

  // ── Keuzescherm ────────────────────────────────────────────────
  if (showSelection) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center pt-2">
          <h1 className="text-2xl font-extrabold">Kies jouw campagne</h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">
            Er zijn {campaigns.length} campagnes beschikbaar bij jou in de buurt. Je kunt ze allemaal spelen!
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {campaigns.map((campaign) => {
            const prize = (campaign as Campaign & { prizes?: { title: string; value_eur?: number }[] }).prizes?.[0]
            const clientName = (campaign.client as { name: string } | undefined)?.name
            const flyer = campaign.flyer_image
            const tagline = campaign.flyer_tagline

            return (
              <button
                key={campaign.id}
                onClick={() => pickCampaign(campaign)}
                className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden text-left shadow-sm hover:shadow-md hover:border-blue-300 transition-all active:scale-[0.98] group"
              >
                {/* Flyer afbeelding */}
                {flyer ? (
                  <div className="relative h-40 w-full overflow-hidden">
                    <img src={flyer} alt={campaign.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {clientName && (
                      <span className="absolute bottom-3 left-4 text-white text-xs font-bold uppercase tracking-widest opacity-90">
                        {clientName}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="h-24 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                    {clientName && (
                      <p className="text-white font-extrabold text-xl">{clientName}</p>
                    )}
                  </div>
                )}

                <div className="p-4 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-base leading-snug">{campaign.title}</p>
                    {tagline ? (
                      <p className="text-sm text-[var(--color-primary)] font-semibold mt-1 flex items-center gap-1">
                        <Gift className="h-3.5 w-3.5 shrink-0" />{tagline}
                      </p>
                    ) : prize ? (
                      <p className="text-sm text-amber-600 font-semibold mt-1 flex items-center gap-1">
                        <Gift className="h-3.5 w-3.5 shrink-0" />Win: {prize.title}{prize.value_eur ? ` (€${prize.value_eur})` : ''}
                      </p>
                    ) : null}
                    <div className="flex items-center gap-3 mt-2 text-xs text-[var(--color-muted)]">
                      <span>{campaign.num_differences} verschillen</span>
                      {campaign.time_limit_sec > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {Math.ceil(campaign.time_limit_sec / 60)} min
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-[var(--color-primary)] text-white rounded-xl px-3 py-2 flex items-center gap-1 text-sm font-bold shrink-0 group-hover:bg-blue-600 transition-colors">
                    <Play className="h-3.5 w-3.5" /> Speel
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <button
          onClick={() => { setShowSelection(false); setError('') }}
          className="text-sm text-[var(--color-muted)] underline text-center"
        >
          ← Andere locatie invoeren
        </button>
      </div>
    )
  }

  // ── Locatiepicker ──────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8">
      <div className="text-center pt-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl shadow-lg mb-4">
          <Gamepad2 className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-[var(--color-text)] leading-tight">Pzzle</h1>
        <p className="text-[var(--color-muted)] mt-2 text-base">Vind alle verschillen, win een prijs!</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--color-border)]">
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <LoadingSpinner size="lg" />
            <p className="text-[var(--color-muted)]">Campagnes zoeken...</p>
          </div>
        ) : (
          <LocationPicker onLocation={handleLocation} />
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: '📍', title: 'Lokaal', desc: 'Campagnes bij jou in de buurt' },
          { icon: '🎯', title: 'Speel', desc: 'Zoek alle verschillen' },
          { icon: '🎁', title: 'Win', desc: 'Maak kans op een prijs' },
        ].map((item) => (
          <div key={item.title} className="bg-white rounded-xl p-3 text-center border border-[var(--color-border)]">
            <div className="text-2xl mb-1">{item.icon}</div>
            <p className="text-xs font-bold">{item.title}</p>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
