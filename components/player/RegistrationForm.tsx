'use client'
import { useState, FormEvent } from 'react'
import { User, Mail, Phone, MapPin } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const CONSENT_TEXT = `Door dit formulier in te sturen ga je akkoord met onze deelnamevoorwaarden en privacy­verklaring. Je gegevens worden gebruikt om de winnaar te bepalen en te informeren. Je kunt je toestemming voor marketing altijd intrekken.`

interface RegistrationFormProps {
  sessionToken: string
  campaignId: string
  onSuccess: () => void
}

export default function RegistrationForm({ sessionToken, campaignId, onSuccess }: RegistrationFormProps) {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    postal_code: '',
    city: '',
  })
  const [consents, setConsents] = useState({
    terms: false,
    privacy: false,
    marketing: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.first_name.trim()) errs.first_name = 'Vereist'
    if (!form.last_name.trim()) errs.last_name = 'Vereist'
    if (!form.email.trim() || !form.email.includes('@')) errs.email = 'Geldig e-mailadres vereist'
    if (!consents.terms) errs.terms = 'Je moet akkoord gaan met de voorwaarden'
    if (!consents.privacy) errs.privacy = 'Je moet akkoord gaan met de privacyverklaring'
    return errs
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    try {
      const res = await fetch('/api/spelers/registreer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_token: sessionToken,
          ...form,
          consent_marketing: consents.marketing,
          consent_terms: consents.terms,
          consent_privacy: consents.privacy,
          consent_text_shown: CONSENT_TEXT,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setErrors({ submit: data.error ?? 'Er ging iets mis, probeer opnieuw.' })
        return
      }
      // Track game count voor PWA prompt
      const count = parseInt(localStorage.getItem('pwa_game_count') ?? '0', 10)
      localStorage.setItem('pwa_game_count', String(count + 1))
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Voornaam" value={form.first_name} onChange={set('first_name')} error={errors.first_name} required />
        <Input label="Achternaam" value={form.last_name} onChange={set('last_name')} error={errors.last_name} required />
      </div>
      <Input label="E-mailadres" type="email" value={form.email} onChange={set('email')} error={errors.email} required />
      <Input label="Telefoonnummer" type="tel" value={form.phone} onChange={set('phone')} placeholder="Optioneel" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Postcode" value={form.postal_code} onChange={set('postal_code')} placeholder="Optioneel" />
        <Input label="Woonplaats" value={form.city} onChange={set('city')} placeholder="Optioneel" />
      </div>

      <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3">
        <p className="text-xs text-[var(--color-muted)]">{CONSENT_TEXT}</p>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded accent-[var(--color-primary)]"
            checked={consents.terms}
            onChange={(e) => setConsents((p) => ({ ...p, terms: e.target.checked }))}
          />
          <span className="text-sm font-medium">
            Ik ga akkoord met de <a href="#" className="text-[var(--color-primary)] underline">deelnamevoorwaarden</a> *
          </span>
        </label>
        {errors.terms && <p className="text-xs text-red-500 -mt-2">{errors.terms}</p>}

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded accent-[var(--color-primary)]"
            checked={consents.privacy}
            onChange={(e) => setConsents((p) => ({ ...p, privacy: e.target.checked }))}
          />
          <span className="text-sm font-medium">
            Ik ga akkoord met de <a href="#" className="text-[var(--color-primary)] underline">privacyverklaring</a> *
          </span>
        </label>
        {errors.privacy && <p className="text-xs text-red-500 -mt-2">{errors.privacy}</p>}

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded accent-[var(--color-primary)]"
            checked={consents.marketing}
            onChange={(e) => setConsents((p) => ({ ...p, marketing: e.target.checked }))}
          />
          <span className="text-sm font-medium text-[var(--color-muted)]">
            Ik ontvang graag aanbiedingen via e-mail en WhatsApp (optioneel)
          </span>
        </label>
      </div>

      {errors.submit && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{errors.submit}</p>
      )}

      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Deelnemen aan de prijs!
      </Button>
    </form>
  )
}
