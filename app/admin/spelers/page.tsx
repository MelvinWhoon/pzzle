'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye } from 'lucide-react'
import DataTable, { Column } from '@/components/admin/DataTable'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { Player } from '@/lib/types'

export default function SpelersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/spelers')
      .then((r) => r.json())
      .then((d) => setPlayers(d.players ?? []))
      .finally(() => setLoading(false))
  }, [])

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
      <div>
        <h1 className="text-2xl font-extrabold">Spelers</h1>
        <p className="text-[var(--color-muted)] text-sm mt-0.5">{players.length} geregistreerde spelers</p>
      </div>
      <DataTable columns={columns} data={players} loading={loading} emptyText="Nog geen spelers geregistreerd" />
    </div>
  )
}
