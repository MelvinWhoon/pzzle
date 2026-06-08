'use client'
import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Campaign } from '@/lib/types'

export default function NieuwePrijsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [form, setForm] = useState({ campaign_id: '', title: '', description: '', value_eur: '', quantity: '1', win_condition: 'random_draw' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/campagnes').then((r) => r.json()).then((d) => setCampaigns(d.campaigns ?? []))
  }, [])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/admin/prijzen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaign_id: form.campaign_id,
        title: form.title,
        description: form.description || null,
        value_eur: form.value_eur ? parseFloat(form.value_eur) : null,
        quantity: parseInt(form.quantity),
        win_condition: form.win_condition,
      }),
    })
    setLoading(false)
    if (res.ok) router.push('/admin/prijzen')
  }

  const winConditions = [
    { value: 'random_draw', label: 'Loting (iedereen die meedoet)' },
    { value: 'all_found', label: 'Alle verschillen gevonden' },
    { value: 'any_complete', label: 'Elk voltooid spel' },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/prijzen"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-extrabold">Nieuwe prijs</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[var(--color-border)] p-6 flex flex-col gap-4">
        <Select label="Campagne" value={form.campaign_id} onChange={(e) => setForm((p) => ({ ...p, campaign_id: e.target.value }))}
          options={campaigns.map((c) => ({ value: c.id, label: c.title }))} placeholder="Kies campagne..." required />
        <Input label="Prijs omschrijving" value={form.title} onChange={set('title')} required placeholder="bijv. VVV-bon ter waarde van €50" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Waarde (€)" type="number" step="0.01" value={form.value_eur} onChange={set('value_eur')} />
          <Input label="Aantal" type="number" min="1" value={form.quantity} onChange={set('quantity')} required />
        </div>
        <Select label="Winconditie" value={form.win_condition} onChange={(e) => setForm((p) => ({ ...p, win_condition: e.target.value }))} options={winConditions} />
        <div className="flex gap-3 pt-2">
          <Link href="/admin/prijzen" className="flex-1"><Button variant="secondary" className="w-full">Annuleren</Button></Link>
          <Button type="submit" className="flex-1" loading={loading}>Opslaan</Button>
        </div>
      </form>
    </div>
  )
}
