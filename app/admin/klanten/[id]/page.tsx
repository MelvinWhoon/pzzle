'use client'
import { useEffect, useState, FormEvent, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X, BarChart2, Copy, Check, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Client } from '@/lib/types'

export default function EditKlantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', contact_name: '', email: '', phone: '', city: '', postal_code: '',
    notes: '', active: true, logo_url: '', website: '',
  })
  const [campaignCount, setCampaignCount] = useState<number | null>(null)
  const [statsToken, setStatsToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
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
          logo_url: client.logo_url ?? '',
          website: client.website ?? '',
        })
        setCampaignCount(client.campaign_count ?? null)
        setStatsToken(client.stats_token ?? null)
      })
      .finally(() => setLoading(false))
  }, [id])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const uploadLogo = async (file: File) => {
    setUploadingLogo(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'logos')
    const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
    const { url } = await res.json()
    setForm((prev) => ({ ...prev, logo_url: url }))
    setUploadingLogo(false)
  }

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
        <h1 className="text-2xl font-extrabold flex-1">Klant bewerken</h1>
        {campaignCount !== null && (
          <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 rounded-xl px-3 py-1.5 text-sm font-semibold">
            <BarChart2 className="h-4 w-4" />
            {campaignCount} campagne{campaignCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[var(--color-border)] p-6 flex flex-col gap-4">
        {/* Logo upload */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Logo</label>
          <div className="flex items-center gap-3">
            {form.logo_url ? (
              <div className="relative">
                <img src={form.logo_url} alt="Logo" className="h-16 w-16 rounded-xl object-contain border border-[var(--color-border)] bg-gray-50 p-1" />
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, logo_url: '' }))}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : null}
            <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-[var(--color-border)] rounded-xl cursor-pointer hover:border-blue-300 transition-colors">
              <Upload className="h-4 w-4 text-[var(--color-muted)]" />
              <span className="text-sm text-[var(--color-muted)]">{uploadingLogo ? 'Uploaden...' : form.logo_url ? 'Vervangen' : 'Logo uploaden'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f) }}
              />
            </label>
          </div>
        </div>

        <Input label="Bedrijfsnaam" value={form.name} onChange={set('name')} required />
        <Input label="Website" type="url" placeholder="https://www.bedrijf.nl" value={form.website} onChange={set('website')} />
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
        {/* Stats-portal link */}
        {statsToken && (
          <div className="border border-blue-200 bg-blue-50 rounded-xl p-4 flex flex-col gap-2">
            <p className="text-sm font-semibold text-blue-800">📊 Klant statistieken-link</p>
            <p className="text-xs text-blue-600">Deel deze link met de klant — zij zien realtime statistieken zonder login.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white border border-blue-200 rounded-lg px-3 py-2 text-blue-700 truncate">
                {typeof window !== 'undefined' ? `${window.location.origin}/klant/${statsToken}/stats` : `/klant/${statsToken}/stats`}
              </code>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  const url = `${window.location.origin}/klant/${statsToken}/stats`
                  navigator.clipboard.writeText(url)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
              <a href={`/klant/${statsToken}/stats`} target="_blank" rel="noopener noreferrer">
                <Button type="button" size="sm" variant="secondary">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
            </div>
          </div>
        )}

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
