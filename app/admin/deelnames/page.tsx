'use client'
import { useEffect, useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import DataTable, { Column } from '@/components/admin/DataTable'
import { GameSession } from '@/lib/types'

export default function DeelnamesPage() {
  const [sessions, setSessions] = useState<GameSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/deelnames')
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions ?? []))
      .finally(() => setLoading(false))
  }, [])

  const columns: Column<GameSession>[] = [
    { key: 'player', header: 'Speler', render: (r) => {
      const p = r.player as { first_name: string; last_name: string; email: string } | null
      return p ? `${p.first_name} ${p.last_name}` : '–'
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
      <div>
        <h1 className="text-2xl font-extrabold">Deelnames</h1>
        <p className="text-[var(--color-muted)] text-sm mt-0.5">{sessions.length} sessies geladen (max. 200)</p>
      </div>
      <DataTable columns={columns} data={sessions} loading={loading} emptyText="Nog geen deelnames" />
    </div>
  )
}
