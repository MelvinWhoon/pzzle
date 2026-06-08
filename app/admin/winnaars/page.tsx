'use client'
import { useEffect, useState } from 'react'
import DataTable, { Column } from '@/components/admin/DataTable'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Winner } from '@/lib/types'

export default function WinnaaarsPage() {
  const [winners, setWinners] = useState<Winner[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/winnaars').then((r) => r.json()).then((d) => setWinners(d.winners ?? [])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

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

  const columns: Column<Winner>[] = [
    { key: 'player', header: 'Winnaar', render: (r) => {
      const p = r.player as { first_name: string; last_name: string; email: string } | null
      return p ? `${p.first_name} ${p.last_name} (${p.email})` : '–'
    }},
    { key: 'prize', header: 'Prijs', render: (r) => (r.prize as { title: string } | null)?.title ?? '–' },
    { key: 'campaign', header: 'Campagne', render: (r) => (r.campaign as { title: string } | null)?.title ?? '–' },
    {
      key: 'notified',
      header: 'Gecontacteerd',
      render: (r) => r.notified
        ? <Badge variant="success">Ja</Badge>
        : <Button size="sm" variant="secondary" onClick={() => markNotified(r.id)}>Markeer</Button>,
    },
    {
      key: 'claimed',
      header: 'Prijs geregeld',
      render: (r) => r.claimed
        ? <Badge variant="success">Ja</Badge>
        : <Button size="sm" variant="secondary" onClick={() => markClaimed(r.id)}>Markeer</Button>,
    },
    { key: 'created_at', header: 'Datum', render: (r) => new Date(r.created_at).toLocaleDateString('nl-NL') },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold">Winnaars</h1>
        <p className="text-[var(--color-muted)] text-sm mt-0.5">{winners.length} winnaars</p>
      </div>
      <DataTable columns={columns} data={winners} loading={loading} emptyText="Nog geen winnaars" />
    </div>
  )
}
