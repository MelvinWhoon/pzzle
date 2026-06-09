'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { notFound } from 'next/navigation'
import GameBoard from '@/components/game/GameBoard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Campaign, CampaignVariant } from '@/lib/types'

export default function SpelenPage({ params }: { params: Promise<{ id: string }> }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionToken = searchParams.get('session')
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [variant, setVariant] = useState<CampaignVariant | null>(null)
  const [loading, setLoading] = useState(true)
  const [campaignId, setCampaignId] = useState<string>('')

  useEffect(() => {
    params.then(({ id }) => {
      setCampaignId(id)
      fetch(`/api/campagnes/${id}`)
        .then((r) => r.json())
        .then(({ campaign }) => {
          setCampaign(campaign)
          const active = campaign?.variants?.find((v: CampaignVariant) => v.is_active) ?? campaign?.variants?.[0]
          setVariant(active ?? null)
        })
        .finally(() => setLoading(false))
    })
  }, [params])

  const handleComplete = async (timeSpent: number, foundIds: string[]) => {
    if (!sessionToken) return
    const res = await fetch(`/api/spel/${sessionToken}/afronden`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        differences_found: foundIds.length,
        time_spent_sec: timeSpent,
      }),
    })
    const data = await res.json()
    // Sla score op in sessionStorage voor het bedankt-scherm
    if (data.score != null) {
      sessionStorage.setItem('pzzle_last_result', JSON.stringify({
        score: data.score,
        campaign_id: campaignId,
        differences_found: foundIds.length,
        time_spent_sec: timeSpent,
        instant_win: data.instant_win ?? false,
        instant_win_prize: data.instant_win_prize ?? null,
      }))
    }
    router.push(`/speel/campagne/${campaignId}/registreer?session=${sessionToken}`)
  }

  if (!sessionToken) return <p className="text-center py-8 text-[var(--color-muted)]">Ongeldige spellink. <a href="/speel" className="text-[var(--color-primary)] underline">Start opnieuw</a></p>
  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
  if (!campaign || !variant) return <p className="text-center py-8">Campagne niet gevonden.</p>

  return (
    <GameBoard
      variant={variant}
      timeLimitSec={campaign.time_limit_sec ?? 120}
      onComplete={handleComplete}
    />
  )
}
