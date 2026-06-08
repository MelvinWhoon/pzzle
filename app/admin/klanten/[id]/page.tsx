'use client'
import { useEffect, useState, FormEvent, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Client } from '@/lib/types'

export default function EditKlantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [form, setForm] = useState({ name: '', contact_name: '', email: '', phone: '', city: '', postal_code: '', notes: '', active: true })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/admin/klanten/${id}`)
      .then((r) => r.json())
      .then(({ client }: { client: Client }) => {
        setForm({
          name: client.name,
          contact_name: client.contact_name ?? '',
          email: client.email ?? '',
          phone: client.phone ?? '',
          city: client.city ?? '',
          postal_code: client.postal_code ?? '',
          notes: client.notes ?? '',
          active: client.active,
        })
      })
      .finally(() => setLoading(false))
  }, [id])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/admin/klanten/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) router.push('/admin/klanten')
    else setError('Opslaan mislukt')
  }

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/klanten"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-extrabold">Klant bewerken</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[var(--color-border)] p-6 flex flex-col gap-4">
        <Input label="Bedrijfsnaam" value={form.name} onChange={set('name')} required />
        <Input label="Contactpersoon" value={form.contact_name} onChange={set('contact_name')} />
        <Input label="E-mailadres" type="email" value={form.email} onChange={set('email')} />
        <Input label="Telefoonnummer" type="tel" value={form.phone} onChange={set('phone')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Stad" value={form.city} onChange={set('city')} />
          <Input label="Postcode" value={form.postal_code} onChange={set('postal_code')} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Notities</label>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            rows={3}
            className="w-full px-4 py-3 border border-[var(--color-border)] rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
            className="h-4 w-4 accent-[var(--color-primary)]"
          />
          <span className="text-sm font-medium">Actief</span>
        </label>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3 pt-2">
          <Link href="/admin/klanten" className="flex-1">
            <Button variant="secondary" className="w-full">Annuleren</Button>
          </Link>
          <Button type="submit" className="flex-1" loading={saving}>Opslaan</Button>
        </div>
      </form>
    </div>
  )
}
