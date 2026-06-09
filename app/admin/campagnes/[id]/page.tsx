'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Image, Upload, X } from 'lucide-react'
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
    client_id: '', title: '', description: '', flyer_tagline: '', flyer_image: '',
    city: '', postal_codes_raw: '',
    radius_km: '', num_differences: '5', time_limit_sec: '120',
    starts_at: '', ends_at: '', status: 'draft',
    instant_win_enabled: false, instant_win_slots: '0', instant_win_time_sec: '',
  })
  const [uploadingFlyer, setUploadingFlyer] = useState(false)
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
        flyer_tagline: c.flyer_tagline ?? '',
        flyer_image: c.flyer_image ?? '',
        city: c.city ?? '',
        postal_codes_raw: c.postal_codes?.join(', ') ?? '',
        radius_km: c.radius_km?.toString() ?? '',
        num_differences: c.num_differences.toString(),
        time_limit_sec: c.time_limit_sec.toString(),
        starts_at: c.starts_at ? c.starts_at.slice(0, 16) : '',
        ends_at: c.ends_at ? c.ends_at.slice(0, 16) : '',
        status: c.status,
        instant_win_enabled: c.instant_win_enabled ?? false,
        instant_win_slots: (c.instant_win_slots ?? 0).toString(),
        instant_win_time_sec: c.instant_win_time_sec?.toString() ?? '',
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
        flyer_tagline: form.flyer_tagline || null, flyer_image: form.flyer_image || null,
        city: form.city || null, postal_codes, radius_km: form.radius_km ? parseFloat(form.radius_km) : null,
        num_differences: parseInt(form.num_differences), time_limit_sec: parseInt(form.time_limit_sec),
        starts_at: form.starts_at || null, ends_at: form.ends_at || null, status: form.status,
        instant_win_enabled: form.instant_win_enabled,
        instant_win_slots: parseInt(form.instant_win_slots) || 0,
        instant_win_time_sec: form.instant_win_time_sec ? parseInt(form.instant_win_time_sec) : null,
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

        <div className="border-t border-[var(--color-border)] pt-4 flex flex-col gap-3">
          <p className="text-sm font-semibold">Flyer (zichtbaar bij campagnekeuze)</p>
          <Input label="Flyertekst — wat is er te winnen?" placeholder="bijv. Win een dinercheque t.w.v. €50!" value={form.flyer_tagline} onChange={set('flyer_tagline')} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Flyerafbeelding</label>
            <div className="flex items-center gap-3">
              {form.flyer_image && (
                <div className="relative">
                  <img src={form.flyer_image} alt="Flyer" className="h-20 w-32 rounded-xl object-cover border border-[var(--color-border)]" />
                  <button type="button" onClick={() => setForm((p) => ({ ...p, flyer_image: '' }))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
                </div>
              )}
              <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-[var(--color-border)] rounded-xl cursor-pointer hover:border-blue-300 transition-colors">
                <Upload className="h-4 w-4 text-[var(--color-muted)]" />
                <span className="text-sm text-[var(--color-muted)]">{uploadingFlyer ? 'Uploaden...' : form.flyer_image ? 'Vervangen' : 'Afbeelding uploaden'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const f = e.target.files?.[0]; if (!f) return
                  setUploadingFlyer(true)
                  const fd = new FormData(); fd.append('file', f); fd.append('folder', 'flyers')
                  const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
                  const { url } = await res.json()
                  setForm((p) => ({ ...p, flyer_image: url }))
                  setUploadingFlyer(false)
                }} />
              </label>
            </div>
          </div>
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

        {/* Instant Win */}
        <div className="border-t border-[var(--color-border)] pt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">⚡ Instant Win modus</p>
              <p className="text-xs text-[var(--color-muted)]">Eerste X spelers die alle verschillen vinden winnen direct</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={form.instant_win_enabled}
                onChange={(e) => setForm((p) => ({ ...p, instant_win_enabled: e.target.checked }))}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-[var(--color-primary)] transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>
          {form.instant_win_enabled && (
            <div className="grid grid-cols-2 gap-3 pl-2">
              <Input
                label="Winnende slots (max. X spelers)"
                type="number"
                min="1"
                placeholder="bijv. 3"
                value={form.instant_win_slots}
                onChange={set('instant_win_slots')}
              />
              <Input
                label="Max. tijd (sec, leeg = geen limiet)"
                type="number"
                min="1"
                placeholder="bijv. 60"
                value={form.instant_win_time_sec}
                onChange={set('instant_win_time_sec')}
              />
            </div>
          )}
        </div>

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
