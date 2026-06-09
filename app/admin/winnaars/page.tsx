'use client'
import { useEffect, useState } from 'react'
import { Shuffle, Users, Trophy, ChevronDown, ChevronUp } from 'lucide-react'
import DataTable, { Column } from '@/components/admin/DataTable'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Winner, Campaign } from '@/lib/types'

interface DrawnWinner {
  player: { first_name: string; last_name: string; email: string; phone?: string }
  campaign?: { title: string }
  notes?: string
}

export default function WinnaaarsPage() {
  const [winners, setWinners] = useState<Winner[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  // Handmatige trekking state
  const [showDraw, setShowDraw] = useState(true)
  const [drawForm, setDrawForm] = useState({
    prize_title: '',
    prize_description: '',
    scope: 'all',
    time_filter: 'today',
    exclude_winners: true,
  })
  const [eligibleCount, setEligibleCount] = useState<number | null>(null)
  const [loadingCount, setLoadingCount] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const [drawnWinner, setDrawnWinner] = useState<DrawnWinner | null>(null)
  const [drawError, setDrawError] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/winnaars').then((r) => r.json()),
      fetch('/api/admin/campagnes').then((r) => r.json()),
    ]).then(([wd, cd]) => {
      setWinners(wd.winners ?? [])
      setCampaigns(cd.campaigns ?? [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // Herbereken aantal in aanmerking komende spelers
  useEffect(() => {
    setEligibleCount(null)
    setLoadingCount(true)
    const params = new URLSearchParams({
      scope: drawForm.scope,
      time_filter: drawForm.time_filter,
      exclude_winners: String(drawForm.exclude_winners),
    })
    fetch(`/api/admin/trekking?${params}`)
      .then((r) => r.json())
      .then((d) => setEligibleCount(d.count ?? 0))
      .finally(() => setLoadingCount(false))
  }, [drawForm.scope, drawForm.time_filter, drawForm.exclude_winners])

  const doDraw = async () => {
    if (!drawForm.prize_title.trim()) { setDrawError('Vul een prijs in'); return }
    setDrawing(true)
    setDrawError('')
    setDrawnWinner(null)
    const res = await fetch('/api/admin/trekking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prize_title: drawForm.prize_title,
        prize_description: drawForm.prize_description || null,
        scope: drawForm.scope,
        time_filter: drawForm.time_filter,
        exclude_winners: drawForm.exclude_winners,
      }),
    })
    const data = await res.json()
    setDrawing(false)
    if (!res.ok) { setDrawError(data.error || 'Trekking mislukt'); return }
    setDrawnWinner(data.winner)
    load() // refresh winnaars tabel
  }

  const markNotified = async (id: string) => {
    await fetch(`/api/admin/winnaars/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notified: true, notified_at: new Date().toISOString() }),
    })
    load()
  }

  const markClaimed = async (id: string) => {
    await fetch(`/api/admin/winnaars/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claimed: true, claimed_at: new Date().toISOString() }),
    })
    load()
  }

  const scopeOptions = [
    { value: 'all', label: 'Alle campagnes' },
    ...campaigns.map((c) => ({ value: c.id, label: c.title })),
  ]
  const timeOptions = [
    { value: 'today', label: 'Vandaag' },
    { value: 'week', label: 'Afgelopen week' },
    { value: 'all', label: 'Alle tijd' },
  ]

  const columns: Column<Winner>[] = [
    { key: 'player', header: 'Winnaar', render: (r) => {
      const p = r.player as { first_name: string; last_name: string; email: string } | null
      return p ? (
        <div>
          <p className="font-semibold">{p.first_name} {p.last_name}</p>
          <p className="text-xs text-[var(--color-muted)]">{p.email}</p>
        </div>
      ) : '–'
    }},
    { key: 'prize', header: 'Prijs', render: (r) => {
      const prize = r.prize as { title: string } | null
      return prize?.title ?? r.notes ?? '–'
    }},
    { key: 'campaign', header: 'Campagne', render: (r) => (r.campaign as { title: string } | null)?.title ?? '–' },
    {
      key: 'notified', header: 'Gecontacteerd',
      render: (r) => r.notified
        ? <Badge variant="success">Ja</Badge>
        : <Button size="sm" variant="secondary" onClick={() => markNotified(r.id)}>Markeer</Button>,
    },
    {
      key: 'claimed', header: 'Prijs geregeld',
      render: (r) => r.claimed
        ? <Badge variant="success">Ja</Badge>
        : <Button size="sm" variant="secondary" onClick={() => markClaimed(r.id)}>Markeer</Button>,
    },
    { key: 'created_at', header: 'Datum', render: (r) => new Date(r.created_at).toLocaleDateString('nl-NL') },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* ── Handmatige trekking ────────────────────── */}
      <div className="bg-white rounded-2xl border-2 border-[var(--color-primary)] overflow-hidden">
        <button
          onClick={() => setShowDraw((v) => !v)}
          className="w-full flex items-center gap-3 p-5 hover:bg-blue-50 transition-colors"
        >
          <div className="bg-[var(--color-primary)] rounded-xl p-2">
            <Shuffle className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-extrabold text-lg">Handmatige trekking</p>
            <p className="text-sm text-[var(--color-muted)]">Trek een willekeurige winnaar uit de deelnemers</p>
          </div>
          {showDraw ? <ChevronUp className="h-5 w-5 text-[var(--color-muted)]" /> : <ChevronDown className="h-5 w-5 text-[var(--color-muted)]" />}
        </button>

        {showDraw && (
          <div className="px-5 pb-5 flex flex-col gap-4 border-t border-[var(--color-border)]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {/* Prijs */}
              <div className="flex flex-col gap-3 sm:col-span-2">
                <p className="text-sm font-semibold">Prijs</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Prijs / cadeau"
                    placeholder="bijv. Kortingsbon €25"
                    value={drawForm.prize_title}
                    onChange={(e) => setDrawForm((p) => ({ ...p, prize_title: e.target.value }))}
                  />
                  <Input
                    label="Extra omschrijving (optioneel)"
                    placeholder="bijv. geldig t/m 31 december"
                    value={drawForm.prize_description}
                    onChange={(e) => setDrawForm((p) => ({ ...p, prize_description: e.target.value }))}
                  />
                </div>
              </div>

              {/* Scope + tijdfilter */}
              <Select
                label="Campagne"
                value={drawForm.scope}
                onChange={(e) => setDrawForm((p) => ({ ...p, scope: e.target.value }))}
                options={scopeOptions}
              />
              <Select
                label="Periode"
                value={drawForm.time_filter}
                onChange={(e) => setDrawForm((p) => ({ ...p, time_filter: e.target.value }))}
                options={timeOptions}
              />
            </div>

            {/* Eerdere winnaars uitsluiten */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={drawForm.exclude_winners}
                onChange={(e) => setDrawForm((p) => ({ ...p, exclude_winners: e.target.checked }))}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              <span className="text-sm font-medium">Eerdere winnaars uitsluiten</span>
            </label>

            {/* Aantal spelers indicator */}
            <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-4 py-3">
              <Users className="h-4 w-4 text-[var(--color-primary)] shrink-0" />
              <span className="text-sm font-medium">
                {loadingCount ? 'Tellen...' : `${eligibleCount ?? 0} deelnemers in aanmerking`}
              </span>
            </div>

            {drawError && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{drawError}</p>}

            <Button
              size="lg"
              className="w-full"
              loading={drawing}
              onClick={doDraw}
              disabled={!drawForm.prize_title.trim() || (eligibleCount ?? 0) === 0}
            >
              <Shuffle className="h-5 w-5" />
              Trek nu een winnaar!
            </Button>

            {/* Winnaar resultaat */}
            {drawnWinner && (
              <div className="bg-gradient-to-br from-amber-50 to-yellow-100 border border-yellow-300 rounded-2xl p-5 flex items-start gap-4">
                <div className="bg-yellow-400 rounded-xl p-2.5 shrink-0">
                  <Trophy className="h-6 w-6 text-yellow-900" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-1">🎉 Winnaar!</p>
                  <p className="font-extrabold text-lg">{drawnWinner.player.first_name} {drawnWinner.player.last_name}</p>
                  <p className="text-sm text-yellow-800">{drawnWinner.player.email}</p>
                  {drawnWinner.player.phone && <p className="text-sm text-yellow-800">{drawnWinner.player.phone}</p>}
                  {drawnWinner.campaign && <p className="text-xs text-yellow-700 mt-1">Campagne: {drawnWinner.campaign.title}</p>}
                  {drawnWinner.notes && <p className="text-xs font-semibold text-yellow-900 mt-1.5 bg-yellow-200 rounded-lg px-2 py-1">{drawnWinner.notes}</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Winnaarslijst ──────────────────────────── */}
      <div>
        <h1 className="text-2xl font-extrabold">Winnaars</h1>
        <p className="text-[var(--color-muted)] text-sm mt-0.5">{winners.length} winnaars</p>
      </div>
      <DataTable columns={columns} data={winners} loading={loading} emptyText="Nog geen winnaars" />
    </div>
  )
}
