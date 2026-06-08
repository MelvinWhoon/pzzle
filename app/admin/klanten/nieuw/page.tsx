'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function NieuweKlantPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', contact_name: '', email: '', phone: '', city: '', postal_code: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Bedrijfsnaam is verplicht'); return }
    setLoading(true)
    const res = await fetch('/api/admin/klanten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (res.ok) router.push('/admin/klanten')
    else setError('Kon klant niet opslaan')
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/klanten"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-extrabold">Nieuwe klant</h1>
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
            placeholder="Interne notities..."
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3 pt-2">
          <Link href="/admin/klanten" className="flex-1">
            <Button variant="secondary" className="w-full">Annuleren</Button>
          </Link>
          <Button type="submit" className="flex-1" loading={loading}>Opslaan</Button>
        </div>
      </form>
    </div>
  )
}
