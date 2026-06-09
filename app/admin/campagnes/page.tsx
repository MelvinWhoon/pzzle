'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Image } from 'lucide-react'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import DataTable, { Column } from '@/components/admin/DataTable'
import Badge, { statusToBadge } from '@/components/ui/Badge'
import { Campaign } from '@/lib/types'

const STATUS_OPTIONS = [
  { value: '', label: 'Alle statussen' },
  { value: 'active', label: 'Actief' },
  { value: 'draft', label: 'Concept' },
  { value: 'paused', label: 'Gepauzeerd' },
  { value: 'archived', label: 'Gearchiveerd' },
]

export default function CampagnesPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetch('/api/admin/campagnes')
      .then((r) => r.json())
      .then((d) => setCampaigns(d.campaigns ?? []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = statusFilter
    ? campaigns.filter((c) => c.status === statusFilter)
    : campaigns

  function formatDate(dt: string | null | undefined) {
    if (!dt) return '–'
    return new Date(dt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: '2-digit' })
  }

  const columns: Column<Campaign>[] = [
    { key: 'title', header: 'Naam' },
    { key: 'client', header: 'Klant', render: (r) => (r.client as { name: string })?.name ?? '–' },
    { key: 'city', header: 'Stad', render: (r) => r.city ?? '–' },
    {
      key: 'status', header: 'Status',
      render: (r) => { const b = statusToBadge(r.status); return <Badge variant={b.variant}>{b.label}</Badge> },
    },
    {
      key: 'dates', header: 'Looptijd',
      render: (r) => (
        <span className="text-xs text-[var(--color-muted)] whitespace-nowrap">
          {formatDate(r.starts_at)} – {formatDate(r.ends_at)}
        </span>
      ),
    },
    {
      key: 'variants', header: 'Var.',
      render: (r) => <span className="text-sm text-[var(--color-muted)]">{(r.variants as unknown[])?.length ?? 0}</span>,
    },
    {
      key: 'actions', header: '',
      render: (r) => (
        <div className="flex items-center gap-1 justify-end">
          <Link href={`/admin/campagnes/${r.id}`}>
            <Button size="sm" variant="ghost"><Pencil className="h-3.5 w-3.5" /></Button>
          </Link>
          <Link href={`/admin/campagnes/${r.id}/varianten`}>
            <Button size="sm" variant="ghost"><Image className="h-3.5 w-3.5" /></Button>
          </Link>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold">Campagnes</h1>
          <p className="text-[var(--color-muted)] text-sm mt-0.5">{filtered.length} van {campaigns.length} campagnes</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-44">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={STATUS_OPTIONS}
            />
          </div>
          <Link href="/admin/campagnes/nieuw">
            <Button><Plus className="h-4 w-4" />Nieuw</Button>
          </Link>
        </div>
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} emptyText="Geen campagnes gevonden" />
    </div>
  )
}
