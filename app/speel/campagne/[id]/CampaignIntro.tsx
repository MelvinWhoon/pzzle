'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Gift, Clock } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Campaign, CampaignVariant, Prize } from '@/lib/types'

interface Props {
  campaign: Campaign & { prizes?: Prize[] }
  variant: CampaignVariant
}

export default function CampaignIntro({ campaign, variant }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const prize = campaign.prizes?.[0]
  const timeLimitMin = campaign.time_limit_sec > 0 ? Math.ceil(campaign.time_limit_sec / 60) : null

  const startGame = async () => {
    setLoading(true)
    const loc = JSON.parse(sessionStorage.getItem('player_location') ?? '{}')
    try {
      const res = await fetch('/api/spel/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaign.id,
          variant_id: variant.id,
          player_postcode: loc.postcode ?? null,
          player_city: loc.city ?? null,
          player_lat: loc.lat ?? null,
          player_lng: loc.lng ?? null,
        }),
      })
      const data = await res.json()
      router.push(`/speel/campagne/${campaign.id}/spelen?session=${data.session_token}`)
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Campagne header */}
      <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)] shadow-sm text-center">
        {campaign.client && (
          <p className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-widest mb-1">
            {campaign.client.name}
          </p>
        )}
        <h1 className="text-2xl font-extrabold">{campaign.title}</h1>
        {campaign.description && (
          <p className="text-[var(--color-muted)] mt-2 text-sm">{campaign.description}</p>
        )}
      </div>

      {/* Prijs */}
      {prize && (
        <div className="bg-gradient-to-br from-amber-50 to-yellow-100 border border-yellow-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="bg-yellow-400 rounded-xl p-2.5 shrink-0">
            <Gift className="h-6 w-6 text-yellow-900" />
          </div>
          <div>
            <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-0.5">Te winnen</p>
            <p className="font-bold text-lg">{prize.title}</p>
            {prize.value_eur && (
              <p className="text-sm text-yellow-700">Waarde: €{prize.value_eur.toFixed(2)}</p>
            )}
          </div>
        </div>
      )}

      {/* Spelinfo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 border border-[var(--color-border)] text-center">
          <p className="text-2xl font-bold text-[var(--color-primary)]">{campaign.num_differences}</p>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">te zoeken verschillen</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[var(--color-border)] text-center">
          <div className="flex items-center justify-center gap-1.5">
            <Clock className="h-5 w-5 text-[var(--color-muted)]" />
            <p className="text-2xl font-bold text-[var(--color-text)]">
              {timeLimitMin ? `${timeLimitMin} min` : '∞'}
            </p>
          </div>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">tijdslimiet</p>
        </div>
      </div>

      {/* Start knop */}
      <Button size="lg" className="w-full text-xl py-5" onClick={startGame} loading={loading}>
        <Play className="h-6 w-6" />
        Spelen!
      </Button>

      <p className="text-center text-xs text-[var(--color-muted)]">
        Na het spel vul je je gegevens in om mee te doen aan de trekking.
      </p>
    </div>
  )
}
