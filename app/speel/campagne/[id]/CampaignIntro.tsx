'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Gift, Clock, Users, CalendarX } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Campaign, CampaignVariant, Prize } from '@/lib/types'

interface Props {
  campaign: Campaign & { prizes?: Prize[]; client?: { name: string; logo_url?: string | null } | null }
  variant: CampaignVariant
  playerCount: number
}

export default function CampaignIntro({ campaign, variant, playerCount }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [alreadyPlayed, setAlreadyPlayed] = useState(false)

  const prize = campaign.prizes?.[0]
  const timeLimitMin = campaign.time_limit_sec > 0 ? Math.ceil(campaign.time_limit_sec / 60) : null
  const clientName = campaign.client?.name
  const clientLogo = campaign.client?.logo_url

  // Check localStorage of speler deze campagne al gespeeld heeft
  useEffect(() => {
    try {
      const played: string[] = JSON.parse(localStorage.getItem('pzzle_played') ?? '[]')
      if (played.includes(campaign.id)) setAlreadyPlayed(true)
    } catch {
      // ignore parse errors
    }
  }, [campaign.id])

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

  // ── Al gespeeld scherm ──────────────────────────────────────────
  if (alreadyPlayed) {
    const availableIds: string[] = (() => {
      try { return JSON.parse(sessionStorage.getItem('available_campaigns') ?? '[]') } catch { return [] }
    })()
    const otherIds = availableIds.filter((id) => id !== campaign.id)

    return (
      <div className="flex flex-col items-center gap-6 py-4 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-3xl">
          <CalendarX className="h-10 w-10 text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">Al gespeeld!</h1>
          <p className="text-[var(--color-muted)] mt-2 max-w-xs mx-auto">
            Je hebt deze campagne al eerder gespeeld. Kom morgen terug voor een nieuwe kans!
          </p>
        </div>

        {clientName && (
          <div className="bg-blue-50 rounded-xl px-4 py-3">
            <p className="text-sm font-semibold text-blue-700">{clientName}</p>
            <p className="text-xs text-blue-500">{campaign.title}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 w-full max-w-xs">
          {otherIds.length > 0 && (
            <Button size="lg" className="w-full" onClick={() => router.push('/speel')}>
              <Play className="h-5 w-5" />Andere campagne spelen
            </Button>
          )}
          <Button variant="secondary" size="lg" className="w-full" onClick={() => router.push('/speel')}>
            ← Terug naar het speelscherm
          </Button>
        </div>
      </div>
    )
  }

  // ── Normale campagne intro ──────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* Campagne header */}
      <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)] shadow-sm text-center">
        {/* Logo */}
        {clientLogo ? (
          <img src={clientLogo} alt={clientName ?? ''} className="h-12 w-auto object-contain mx-auto mb-3 rounded-lg" />
        ) : clientName ? (
          <p className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-widest mb-1">
            {clientName}
          </p>
        ) : null}
        <h1 className="text-2xl font-extrabold">{campaign.title}</h1>
        {campaign.description && (
          <p className="text-[var(--color-muted)] mt-2 text-sm">{campaign.description}</p>
        )}
        {/* Spelersteller */}
        {playerCount > 0 && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <Users className="h-3.5 w-3.5 text-[var(--color-muted)]" />
            <p className="text-xs text-[var(--color-muted)]">{playerCount.toLocaleString('nl-NL')} spelers gingen je voor</p>
          </div>
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
