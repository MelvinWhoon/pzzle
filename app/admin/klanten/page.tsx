'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import DataTable, { Column } from '@/components/admin/DataTable'
import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { Client } from '@/lib/types'

export default function KlantenPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/klanten')
      .then((r) => r.json())
      .then((d) => setClients(d.clients ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    await fetch(`/api/admin/klanten/${deleteId}`, { method: 'DELETE' })
    setDeleteId(null)
    setDeleting(false)
    load()
  }

  const columns: Column<Client>[] = [
    { key: 'name', header: 'Bedrijf' },
    { key: 'contact_name', header: 'Contactpersoon', render: (r) => r.contact_name ?? '–' },
    { key: 'city', header: 'Stad', render: (r) => r.city ?? '–' },
    { key: 'active', header: 'Status', render: (r) => <Badge variant={r.active ? 'success' : 'default'}>{r.active ? 'Actief' : 'Inactief'}</Badge> },
    {
      key: 'actions', header: '',
      render: (r) => (
        <div className="flex items-center gap-2 justify-end">
          <Link href={`/admin/klanten/${r.id}`}>
            <Button size="sm" variant="ghost"><Pencil className="h-3.5 w-3.5" /></Button>
          </Link>
          <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => setDeleteId(r.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Klanten</h1>
          <p className="text-[var(--color-muted)] text-sm mt-0.5">{clients.length} klant{clients.length !== 1 ? 'en' : ''}</p>
        </div>
        <Link href="/admin/klanten/nieuw">
          <Button><Plus className="h-4 w-4" />Nieuw</Button>
        </Link>
      </div>

      <DataTable columns={columns} data={clients} loading={loading} emptyText="Nog geen klanten aangemaakt" />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Klant verwijderen"
        message="Weet je zeker dat je deze klant wilt verwijderen? Dit kan niet ongedaan worden gemaakt."
      />
    </div>
  )
}
