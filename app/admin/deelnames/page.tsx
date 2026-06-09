'use client'
import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Download } from 'lucide-react'
import DataTable, { Column } from '@/components/admin/DataTable'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { GameSession, Campaign } from '@/lib/types'

export default function DeelnamesPage() {
  const [sessions, setSessions] = useState<GameSession[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [campaignFilter, setCampaignFilter] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/deelnames').then((r) => r.json()),
      fetch('/api/admin/campagnes').then((r) => r.json()),
    ]).then(([dd, cd]) => {
      setSessions(dd.sessions ?? [])
      setCampaigns(cd.campaigns ?? [])
    }).finally(() => setLoading(false))
  }, [])

  const filtered = campaignFilter
    ? sessions.filter((s) => s.campaign_id === campaignFilter)
    : sessions

  const exportCsv = () => {
    const header = ['Speler', 'E-mail', 'Campagne', 'Voltooid', 'Gevonden', 'Score', 'Tijd (s)', 'Datum']
    const rows = filtered.map((s) => {
      const p = s.player as { first_name: string; last_name: string; email: string } | null
      const c = s.campaign as { title: string } | null
      return [
        p ? `${p.first_name} ${p.last_name}` : '',
        p?.email ?? '',
        c?.title ?? '',
        s.completed ? 'Ja' : 'Nee',
        `${s.differences_found}/${s.differences_total}`,
        s.score ?? 0,
        s.time_spent_sec ?? '',
        new Date(s.started_at).toLocaleString('nl-NL'),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
    })
    const csv = [header.join(','), ...rows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'deelnames.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const campaignOptions = [
    { value: '', label: 'Alle campagnes' },
    ...campaigns.map((c) => ({ value: c.id, label: c.title })),
  ]

  const columns: Column<GameSession>[] = [
    { key: 'player', header: 'Speler', render: (r) => {
      const p = r.player as { first_name: string; last_name: string; email: string } | null
      return p ? (
        <div>
          <p className="font-semibold text-sm">{p.first_name} {p.last_name}</p>
          <p className="text-xs text-[var(--color-muted)]">{p.email}</p>
        </div>
      ) : '–'
    }},
    { key: 'campaign', header: 'Campagne', render: (r) => (r.campaign as { title: string })?.title ?? '–' },
    { key: 'completed', header: 'Voltooid', render: (r) => r.completed
      ? <CheckCircle className="h-4 w-4 text-green-500" />
      : <XCircle className="h-4 w-4 text-gray-300" /> },
    { key: 'differences_found', header: 'Gevonden', render: (r) => `${r.differences_found}/${r.differences_total}` },
    { key: 'score', header: 'Score', render: (r) => r.score > 0 ? r.score : '–' },
    { key: 'time_spent_sec', header: 'Tijd', render: (r) => r.time_spent_sec ? `${r.time_spent_sec}s` : '–' },
    { key: 'started_at', header: 'Datum', render: (r) => new Date(r.started_at).toLocaleString('nl-NL') },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold">Deelnames</h1>
          <p className="text-[var(--color-muted)] text-sm mt-0.5">{filtered.length} van {sessions.length} sessies</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-48">
            <Select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              options={campaignOptions}
            />
          </div>
          <Button variant="secondary" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
        </div>
      </div>
      <DataTable columns={columns} data={filtered} loading={loading} emptyText="Nog geen deelnames" />
    </div>
  )
}
