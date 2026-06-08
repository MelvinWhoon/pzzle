'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Image } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import PreviewLinkGenerator from '@/components/admin/PreviewLinkGenerator'
import { Campaign, Client } from '@/lib/types'

export default function EditCampagnePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [form, setForm] = useState({
    client_id: '', title: '', description: '', city: '', postal_codes_raw: '',
    radius_km: '', num_differences: '5', time_limit_sec: '120',
    starts_at: '', ends_at: '', status: 'draft',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/campagnes/${id}`).then((r) => r.json()),
      fetch('/api/admin/klanten').then((r) => r.json()),
    ]).then(([cd, kd]) => {
      const c: Campaign = cd.campaign
      setCampaign(c)
      setClients(kd.clients ?? [])
      setForm({
        client_id: c.client_id ?? '',
        title: c.title,
        description: c.description ?? '',
        city: c.city ?? '',
        postal_codes_raw: c.postal_codes?.join(', ') ?? '',
        radius_km: c.radius_km?.toString() ?? '',
        num_differences: c.num_differences.toString(),
        time_limit_sec: c.time_limit_sec.toString(),
        starts_at: c.starts_at ? c.starts_at.slice(0, 16) : '',
        ends_at: c.ends_at ? c.ends_at.slice(0, 16) : '',
        status: c.status,
      })
    }).finally(() => setLoading(false))
  }, [id])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    const postal_codes = form.postal_codes_raw.split(',').map((s) => s.trim()).filter(Boolean)
    await fetch(`/api/admin/campagnes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: form.client_id || null, title: form.title, description: form.description || null,
        city: form.city || null, postal_codes, radius_km: form.radius_km ? parseFloat(form.radius_km) : null,
        num_differences: parseInt(form.num_differences), time_limit_sec: parseInt(form.time_limit_sec),
        starts_at: form.starts_at || null, ends_at: form.ends_at || null, status: form.status,
      }),
    })
    setSaving(false)
    router.push('/admin/campagnes')
  }

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>

  const statusOptions = [
    { value: 'draft', label: 'Concept' },
    { value: 'active', label: 'Actief' },
    { value: 'paused', label: 'Gepauzeerd' },
    { value: 'archived', label: 'Gearchiveerd' },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/admin/campagnes"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-extrabold flex-1">{campaign?.title}</h1>
        <Link href={`/admin/campagnes/${id}/varianten`}>
          <Button variant="secondary" size="sm"><Image className="h-4 w-4" />Varianten</Button>
        </Link>
        <PreviewLinkGenerator campaignId={id} />
      </div>

      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 flex flex-col gap-5">
        <Select label="Klant" value={form.client_id} onChange={(e) => setForm((p) => ({ ...p, client_id: e.target.value }))}
          options={clients.map((c) => ({ value: c.id, label: c.name }))} placeholder="Kies een klant..." />
        <Input label="Campagnenaam" value={form.title} onChange={set('title')} required />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Omschrijving</label>
          <textarea value={form.description} onChange={set('description')} rows={2}
            className="w-full px-4 py-3 border border-[var(--color-border)] rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
        </div>
        <Input label="Stad" value={form.city} onChange={set('city')} />
        <Input label="Postcodegebieden" value={form.postal_codes_raw} onChange={set('postal_codes_raw')} placeholder="5061, 5062" />
        <Input label="Radius in km" type="number" value={form.radius_km} onChange={set('radius_km')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Aantal verschillen" type="number" min="1" max="20" value={form.num_differences} onChange={set('num_differences')} />
          <Input label="Tijdslimiet (sec)" type="number" min="0" value={form.time_limit_sec} onChange={set('time_limit_sec')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Startdatum" type="datetime-local" value={form.starts_at} onChange={set('starts_at')} />
          <Input label="Einddatum" type="datetime-local" value={form.ends_at} onChange={set('ends_at')} />
        </div>
        <Select label="Status" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} options={statusOptions} />
        <div className="flex gap-3 pt-2">
          <Link href="/admin/campagnes" className="flex-1">
            <Button variant="secondary" className="w-full">Annuleren</Button>
          </Link>
          <Button className="flex-1" loading={saving} onClick={handleSave}>Opslaan</Button>
        </div>
      </div>
    </div>
  )
}
