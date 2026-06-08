'use client'
import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Client } from '@/lib/types'

export default function NieuweCampagnePage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [form, setForm] = useState({
    client_id: '',
    title: '',
    description: '',
    city: '',
    postal_codes_raw: '',
    radius_km: '',
    num_differences: '5',
    time_limit_sec: '120',
    starts_at: '',
    ends_at: '',
    status: 'draft',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/klanten').then((r) => r.json()).then((d) => setClients(d.clients ?? []))
  }, [])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Campagnenaam is verplicht'); return }
    setLoading(true)
    const postal_codes = form.postal_codes_raw.split(',').map((s) => s.trim()).filter(Boolean)
    const res = await fetch('/api/admin/campagnes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: form.client_id || null,
        title: form.title,
        description: form.description || null,
        city: form.city || null,
        postal_codes,
        radius_km: form.radius_km ? parseFloat(form.radius_km) : null,
        num_differences: parseInt(form.num_differences),
        time_limit_sec: parseInt(form.time_limit_sec),
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
        status: form.status,
      }),
    })
    setLoading(false)
    if (res.ok) {
      const d = await res.json()
      router.push(`/admin/campagnes/${d.campaign.id}/varianten`)
    } else {
      setError('Kon campagne niet opslaan')
    }
  }

  const statusOptions = [
    { value: 'draft', label: 'Concept' },
    { value: 'active', label: 'Actief' },
    { value: 'paused', label: 'Gepauzeerd' },
    { value: 'archived', label: 'Gearchiveerd' },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/campagnes"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-extrabold">Nieuwe campagne</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[var(--color-border)] p-6 flex flex-col gap-5">
        <Select
          label="Klant"
          value={form.client_id}
          onChange={(e) => setForm((p) => ({ ...p, client_id: e.target.value }))}
          options={clients.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Kies een klant..."
        />
        <Input label="Campagnenaam" value={form.title} onChange={set('title')} required />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Omschrijving</label>
          <textarea
            value={form.description}
            onChange={set('description')}
            rows={2}
            className="w-full px-4 py-3 border border-[var(--color-border)] rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        <div className="border-t border-[var(--color-border)] pt-4">
          <p className="text-sm font-semibold mb-3">Locatie-instellingen</p>
          <div className="flex flex-col gap-3">
            <Input label="Stad" value={form.city} onChange={set('city')} placeholder="bijv. Tilburg" />
            <Input
              label="Postcodegebieden (komma-gescheiden)"
              value={form.postal_codes_raw}
              onChange={set('postal_codes_raw')}
              placeholder="bijv. 5061, 5062, 5063"
            />
            <Input label="Radius in km" type="number" value={form.radius_km} onChange={set('radius_km')} placeholder="bijv. 10" />
          </div>
        </div>

        <div className="border-t border-[var(--color-border)] pt-4">
          <p className="text-sm font-semibold mb-3">Spelinstellingen</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Aantal verschillen" type="number" min="1" max="20" value={form.num_differences} onChange={set('num_differences')} />
            <Input label="Tijdslimiet (seconden)" type="number" min="0" value={form.time_limit_sec} onChange={set('time_limit_sec')} hint="0 = geen limiet" />
          </div>
        </div>

        <div className="border-t border-[var(--color-border)] pt-4">
          <p className="text-sm font-semibold mb-3">Planning & status</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Startdatum" type="datetime-local" value={form.starts_at} onChange={set('starts_at')} />
            <Input label="Einddatum" type="datetime-local" value={form.ends_at} onChange={set('ends_at')} />
          </div>
          <div className="mt-3">
            <Select label="Status" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} options={statusOptions} />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3 pt-2">
          <Link href="/admin/campagnes" className="flex-1">
            <Button variant="secondary" className="w-full">Annuleren</Button>
          </Link>
          <Button type="submit" className="flex-1" loading={loading}>Opslaan & varianten toevoegen</Button>
        </div>
      </form>
    </div>
  )
}
