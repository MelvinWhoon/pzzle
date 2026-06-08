'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import DataTable, { Column } from '@/components/admin/DataTable'
import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { Prize } from '@/lib/types'

export default function PrijzenPage() {
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/prijzen').then((r) => r.json()).then((d) => setPrizes(d.prizes ?? [])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    await fetch(`/api/admin/prijzen/${deleteId}`, { method: 'DELETE' })
    setDeleteId(null)
    setDeleting(false)
    load()
  }

  const columns: Column<Prize>[] = [
    { key: 'title', header: 'Prijs' },
    { key: 'campaign', header: 'Campagne', render: (r) => (r as unknown as { campaign?: { title: string } }).campaign?.title ?? '–' },
    { key: 'value_eur', header: 'Waarde', render: (r) => r.value_eur ? `€${r.value_eur}` : '–' },
    { key: 'remaining', header: 'Resterend', render: (r) => `${r.remaining}/${r.quantity}` },
    { key: 'active', header: 'Status', render: (r) => <Badge variant={r.active ? 'success' : 'default'}>{r.active ? 'Actief' : 'Inactief'}</Badge> },
    {
      key: 'actions', header: '',
      render: (r) => (
        <div className="flex gap-1 justify-end">
          <Link href={`/admin/prijzen/${r.id}`}><Button size="sm" variant="ghost"><Pencil className="h-3.5 w-3.5" /></Button></Link>
          <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => setDeleteId(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Prijzen</h1>
          <p className="text-[var(--color-muted)] text-sm mt-0.5">{prizes.length} prijzen</p>
        </div>
        <Link href="/admin/prijzen/nieuw"><Button><Plus className="h-4 w-4" />Nieuwe prijs</Button></Link>
      </div>
      <DataTable columns={columns} data={prizes} loading={loading} emptyText="Nog geen prijzen aangemaakt" />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Prijs verwijderen" message="Weet je zeker dat je deze prijs wilt verwijderen?" />
    </div>
  )
}
