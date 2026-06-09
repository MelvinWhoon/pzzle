'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye, Search } from 'lucide-react'
import DataTable, { Column } from '@/components/admin/DataTable'
import Button from '@/components/ui/Button'
import { Player } from '@/lib/types'

export default function SpelersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/spelers')
      .then((r) => r.json())
      .then((d) => setPlayers(d.players ?? []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = search.trim()
    ? players.filter((p) => {
        const q = search.toLowerCase()
        return (
          p.first_name.toLowerCase().includes(q) ||
          p.last_name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          (p.city ?? '').toLowerCase().includes(q)
        )
      })
    : players

  const columns: Column<Player>[] = [
    { key: 'name', header: 'Naam', render: (r) => `${r.first_name} ${r.last_name}` },
    { key: 'email', header: 'E-mail' },
    { key: 'city', header: 'Stad', render: (r) => r.city ?? '–' },
    { key: 'created_at', header: 'Geregistreerd', render: (r) => new Date(r.created_at).toLocaleDateString('nl-NL') },
    {
      key: 'actions', header: '',
      render: (r) => (
        <Link href={`/admin/spelers/${r.id}`}>
          <Button size="sm" variant="ghost"><Eye className="h-3.5 w-3.5" /></Button>
        </Link>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold">Spelers</h1>
          <p className="text-[var(--color-muted)] text-sm mt-0.5">
            {filtered.length} van {players.length} geregistreerde spelers
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted)]" />
          <input
            type="text"
            placeholder="Zoek op naam of e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
          />
        </div>
      </div>
      <DataTable columns={columns} data={filtered} loading={loading} emptyText="Geen spelers gevonden" />
    </div>
  )
}
