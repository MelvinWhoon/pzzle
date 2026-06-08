'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gamepad2 } from 'lucide-react'
import LocationPicker from '@/components/player/LocationPicker'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { LocationInput, Campaign } from '@/lib/types'

export default function SpeelPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLocation = async (loc: LocationInput) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/campagnes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loc),
      })
      const data = await res.json()
      const campaigns: Campaign[] = data.campaigns ?? []

      if (campaigns.length === 0) {
        setError('Geen actieve campagne gevonden voor jouw locatie. Kom later terug!')
        return
      }

      const campaign = campaigns[0]
      const activeVariant = campaign.variants?.find((v) => v.is_active) ?? campaign.variants?.[0]
      if (!activeVariant) {
        setError('Deze campagne heeft nog geen actieve afbeelding.')
        return
      }

      // Sla locatie op in sessionStorage voor de spelflow
      sessionStorage.setItem('player_location', JSON.stringify(loc))
      router.push(`/speel/campagne/${campaign.id}`)
    } catch {
      setError('Er ging iets mis. Probeer het opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <div className="text-center pt-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl shadow-lg mb-4">
          <Gamepad2 className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-[var(--color-text)] leading-tight">
          Zoek de Verschillen
        </h1>
        <p className="text-[var(--color-muted)] mt-2 text-base">
          Vind alle verschillen, win een prijs!
        </p>
      </div>

      {/* Locatie picker */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--color-border)]">
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <LoadingSpinner size="lg" />
            <p className="text-[var(--color-muted)]">Campagne zoeken...</p>
          </div>
        ) : (
          <LocationPicker onLocation={handleLocation} />
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Uitleg */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: '📍', title: 'Lokaal', desc: 'Campagnes bij jou in de buurt' },
          { icon: '🎯', title: 'Speel', desc: 'Zoek alle verschillen' },
          { icon: '🎁', title: 'Win', desc: 'Maak kans op een prijs' },
        ].map((item) => (
          <div key={item.title} className="bg-white rounded-xl p-3 text-center border border-[var(--color-border)]">
            <div className="text-2xl mb-1">{item.icon}</div>
            <p className="text-xs font-bold">{item.title}</p>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
