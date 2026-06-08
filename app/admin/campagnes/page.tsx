'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Image, ExternalLink } from 'lucide-react'
import Button from '@/components/ui/Button'
import DataTable, { Column } from '@/components/admin/DataTable'
import Badge, { statusToBadge } from '@/components/ui/Badge'
import { Campaign } from '@/lib/types'

export default function CampagnesPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/campagnes')
      .then((r) => r.json())
      .then((d) => setCampaigns(d.campaigns ?? []))
      .finally(() => setLoading(false))
  }, [])

  const columns: Column<Campaign>[] = [
    { key: 'title', header: 'Naam' },
    { key: 'client', header: 'Klant', render: (r) => (r.client as { name: string })?.name ?? '–' },
    { key: 'city', header: 'Stad', render: (r) => r.city ?? '–' },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        const b = statusToBadge(r.status)
        return <Badge variant={b.variant}>{b.label}</Badge>
      },
    },
    {
      key: 'variants',
      header: 'Varianten',
      render: (r) => (
        <span className="text-sm text-[var(--color-muted)]">
          {(r.variants as unknown[])?.length ?? 0}
        </span>
      ),
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Campagnes</h1>
          <p className="text-[var(--color-muted)] text-sm mt-0.5">{campaigns.length} campagnes</p>
        </div>
        <Link href="/admin/campagnes/nieuw">
          <Button><Plus className="h-4 w-4" />Nieuw</Button>
        </Link>
      </div>

      <DataTable columns={columns} data={campaigns} loading={loading} emptyText="Nog geen campagnes aangemaakt" />
    </div>
  )
}
