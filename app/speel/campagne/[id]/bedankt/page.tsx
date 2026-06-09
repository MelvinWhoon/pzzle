'use client'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { CheckCircle, Mail, Calendar, Play, ArrowRight, Star, Trophy, Medal, Zap } from 'lucide-react'
import PwaInstallBanner from '@/components/player/PwaInstallBanner'
import ShareCard from '@/components/player/ShareCard'
import { Campaign } from '@/lib/types'

interface LastResult {
  score: number
  campaign_id: string
  differences_found: number
  time_spent_sec: number
  instant_win?: boolean
  instant_win_prize?: string | null
}

export default function BedanktPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: currentCampaignId } = use(params)
  const [moreCampaigns, setMoreCampaigns] = useState<Campaign[]>([])
  const [lastResult, setLastResult] = useState<LastResult | null>(null)
  const [myRank, setMyRank] = useState<number | null>(null)
  const [campaignTitle, setCampaignTitle] = useState('')
  const [clientName, setClientName] = useState<string | null>(null)

  useEffect(() => {
    // Score ophalen uit sessionStorage
    let result: LastResult | null = null
    try {
      const raw = sessionStorage.getItem('pzzle_last_result')
      if (raw) {
        result = JSON.parse(raw)
        if (result?.campaign_id === currentCampaignId) setLastResult(result)
      }
    } catch { /* ignore */ }

    // Campagne markeren als gespeeld in localStorage
    try {
      const played: string[] = JSON.parse(localStorage.getItem('pzzle_played') ?? '[]')
      if (!played.includes(currentCampaignId)) {
        played.push(currentCampaignId)
        localStorage.setItem('pzzle_played', JSON.stringify(played))
      }
    } catch { /* ignore */ }

    // Campagne ophalen voor naam/klant
    fetch(`/api/campagnes/${currentCampaignId}`)
      .then((r) => r.json())
      .then(({ campaign }) => {
        if (campaign) {
          setCampaignTitle(campaign.title)
          const client = campaign.client as { name: string } | undefined
          setClientName(client?.name ?? null)
        }
      }).catch(() => {})

    // Scorebord rang ophalen
    if (result?.score != null) {
      const qs = `?score=${result.score}&time=${result.time_spent_sec ?? 0}`
      fetch(`/api/campagnes/${currentCampaignId}/scorebord${qs}`)
        .then((r) => r.json())
        .then((d) => { if (d.my_rank) setMyRank(d.my_rank) })
        .catch(() => {})
    }

    // Overige campagnes ophalen
    const availableIds: string[] = (() => {
      try { return JSON.parse(sessionStorage.getItem('available_campaigns') ?? '[]') } catch { return [] }
    })()
    const remaining = availableIds.filter((cid) => cid !== currentCampaignId)
    if (remaining.length === 0) return

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

  const isInstantWin = lastResult?.instant_win === true

  return (
    <div className="flex flex-col items-center gap-8 py-6 text-center">
      {/* ── Instant Win celebration ─────────────────────────────────── */}
      {isInstantWin ? (
        <div className="w-full max-w-sm">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-6 text-white shadow-xl">
            <div className="text-5xl mb-3">🎉</div>
            <h1 className="text-3xl font-extrabold mb-1">Je hebt gewonnen!</h1>
            <div className="flex items-center justify-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="font-semibold text-sm">Instant Win!</span>
            </div>
            {lastResult?.instant_win_prize && (
              <div className="mt-4 bg-white/20 rounded-2xl p-4">
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Jouw prijs</p>
                <p className="text-xl font-extrabold mt-1">{lastResult.instant_win_prize}</p>
              </div>
            )}
            <p className="text-sm opacity-80 mt-4">
              We sturen je een bevestiging op je e-mailadres. Gefeliciteerd!
            </p>
          </div>
        </div>
      ) : (
        <div>
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-3xl mb-4">
            <CheckCircle className="h-14 w-14 text-[var(--color-success)]" />
          </div>
          <h1 className="text-3xl font-extrabold">Bedankt!</h1>
          <p className="text-[var(--color-muted)] mt-2">Je doet mee aan de trekking.</p>
        </div>
      )}

      {/* ── Score kaart ─────────────────────────────────────────────── */}
      {lastResult && lastResult.score > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-100 border border-purple-200 rounded-2xl p-5 w-full max-w-sm flex items-center gap-4">
          <div className="bg-purple-500 rounded-xl p-2.5 shrink-0">
            <Star className="h-6 w-6 text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Jouw score</p>
            <p className="text-3xl font-extrabold text-purple-900">{lastResult.score.toLocaleString('nl-NL')}</p>
            <p className="text-xs text-purple-600">
              {lastResult.differences_found} gevonden · {lastResult.time_spent_sec}s
            </p>
          </div>
          {/* Scorebord rang */}
          {myRank !== null && (
            <div className="text-right shrink-0">
              <div className="inline-flex flex-col items-center bg-purple-500 rounded-xl px-3 py-2">
                {myRank <= 3
                  ? <span className="text-2xl">{['🥇', '🥈', '🥉'][myRank - 1]}</span>
                  : <><Medal className="h-5 w-5 text-yellow-300" /><span className="text-white font-extrabold text-sm">#{myRank}</span></>
                }
                <span className="text-xs text-purple-200">plek</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Scorebord link ───────────────────────────────────────────── */}
      {myRank !== null && (
        <Link
          href={`/speel/campagne/${currentCampaignId}/scorebord`}
          className="flex items-center gap-2 text-sm text-[var(--color-primary)] font-semibold bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 hover:bg-blue-100 transition-colors"
        >
          <Trophy className="h-4 w-4" />
          Bekijk het volledige scorebord
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}

      {/* ── Info blok ────────────────────────────────────────────────── */}
      {!isInstantWin && (
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
      )}

      {/* ── Sociale deelkaart ────────────────────────────────────────── */}
      {lastResult && lastResult.score > 0 && (
        <ShareCard
          score={lastResult.score}
          campaignTitle={campaignTitle}
          clientName={clientName}
          differencesFound={lastResult.differences_found}
          timeSpentSec={lastResult.time_spent_sec}
          campaignId={currentCampaignId}
        />
      )}

      {/* ── Meer campagnes ──────────────────────────────────────────── */}
      {moreCampaigns.length > 0 && (
        <div className="w-full max-w-sm flex flex-col gap-3">
          <p className="font-bold text-base">
            🎉 Speel ook mee bij {moreCampaigns.length > 1 ? 'deze campagnes' : 'deze campagne'}!
          </p>
          {moreCampaigns.map((c) => {
            const clientNameMap = (c.client as { name: string } | undefined)?.name
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
                  {clientNameMap && <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{clientNameMap}</p>}
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
