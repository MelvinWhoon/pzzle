'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Prize } from '@/lib/types'

export default function EditPrijsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [form, setForm] = useState({ title: '', value_eur: '', quantity: '1', active: true })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/prijzen').then((r) => r.json()).then(({ prizes }: { prizes: Prize[] }) => {
      const p = prizes.find((x) => x.id === id)
      if (p) setForm({ title: p.title, value_eur: p.value_eur?.toString() ?? '', quantity: p.quantity.toString(), active: p.active })
    }).finally(() => setLoading(false))
  }, [id])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    await fetch(`/api/admin/prijzen/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: form.title, value_eur: form.value_eur ? parseFloat(form.value_eur) : null, quantity: parseInt(form.quantity), active: form.active }),
    })
    setSaving(false)
    router.push('/admin/prijzen')
  }

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/prijzen"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-extrabold">Prijs bewerken</h1>
      </div>
      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 flex flex-col gap-4">
        <Input label="Prijs omschrijving" value={form.title} onChange={set('title')} required />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Waarde (€)" type="number" step="0.01" value={form.value_eur} onChange={set('value_eur')} />
          <Input label="Aantal" type="number" min="1" value={form.quantity} onChange={set('quantity')} />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} className="h-4 w-4 accent-[var(--color-primary)]" />
          <span className="text-sm font-medium">Actief</span>
        </label>
        <div className="flex gap-3 pt-2">
          <Link href="/admin/prijzen" className="flex-1"><Button variant="secondary" className="w-full">Annuleren</Button></Link>
          <Button className="flex-1" loading={saving} onClick={handleSave}>Opslaan</Button>
        </div>
      </div>
    </div>
  )
}
