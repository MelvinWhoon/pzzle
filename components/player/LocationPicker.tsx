'use client'
import { useState } from 'react'
import { MapPin, Search, ChevronRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { LocationInput } from '@/lib/types'

interface LocationPickerProps {
  onLocation: (loc: LocationInput) => void
}

type Step = 'init' | 'gps-loading' | 'gps-denied' | 'postcode' | 'city'

const DUTCH_CITIES = [
  'Amsterdam', 'Rotterdam', 'Den Haag', 'Utrecht', 'Eindhoven',
  'Tilburg', 'Groningen', 'Almere', 'Breda', 'Nijmegen',
  'Enschede', 'Arnhem', 'Haarlem', 'Zaandam', 'Haarlemmermeer',
  'Amersfoort', 'Apeldoorn', 'Den Bosch', 'Hoofddorp', 'Maastricht',
]

export default function LocationPicker({ onLocation }: LocationPickerProps) {
  const [step, setStep] = useState<Step>('init')
  const [postcode, setPostcode] = useState('')
  const [city, setCity] = useState('')
  const [error, setError] = useState('')

  const requestGPS = () => {
    setStep('gps-loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        setStep('gps-denied')
      },
      { timeout: 10000 }
    )
  }

  const submitPostcode = () => {
    const clean = postcode.replace(/\s/g, '').toUpperCase()
    if (clean.length < 4) {
      setError('Vul minimaal 4 cijfers in van je postcode')
      return
    }
    onLocation({ postcode: clean })
  }

  const submitCity = () => {
    if (!city) {
      setError('Kies je stad')
      return
    }
    onLocation({ city })
  }

  if (step === 'init') {
    return (
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-3">
            <MapPin className="h-8 w-8 text-[var(--color-primary)]" />
          </div>
          <h2 className="text-xl font-bold mb-1">Waar speel je?</h2>
          <p className="text-[var(--color-muted)] text-sm">
            We laten je campagnes zien van bedrijven bij jou in de buurt
          </p>
        </div>

        <Button size="lg" className="w-full" onClick={requestGPS}>
          <MapPin className="h-5 w-5" />
          Gebruik mijn locatie
        </Button>

        <button
          onClick={() => setStep('postcode')}
          className="text-sm text-[var(--color-primary)] text-center hover:underline"
        >
          Liever postcode invoeren →
        </button>
      </div>
    )
  }

  if (step === 'gps-loading') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <LoadingSpinner size="lg" />
        <p className="text-[var(--color-muted)]">Locatie ophalen...</p>
      </div>
    )
  }

  if (step === 'gps-denied' || step === 'postcode') {
    return (
      <div className="flex flex-col gap-4">
        {step === 'gps-denied' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
            Locatietoegang geweigerd. Vul je postcode in om verder te gaan.
          </div>
        )}
        <Input
          label="Postcode"
          placeholder="bijv. 5061"
          value={postcode}
          onChange={(e) => { setPostcode(e.target.value); setError('') }}
          error={error}
          maxLength={7}
          inputMode="numeric"
          required
        />
        <Button className="w-full" onClick={submitPostcode}>
          <Search className="h-4 w-4" />
          Campagnes zoeken
        </Button>
        <button
          onClick={() => setStep('city')}
          className="text-sm text-[var(--color-primary)] text-center hover:underline"
        >
          Geen postcode? Kies een stad →
        </button>
      </div>
    )
  }

  if (step === 'city') {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium">Kies je stad:</p>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
          {DUTCH_CITIES.map((c) => (
            <button
              key={c}
              onClick={() => { setCity(c); setError('') }}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                city === c
                  ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]'
                  : 'border-[var(--color-border)] bg-white hover:border-blue-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <Button className="w-full" onClick={submitCity}>
          <ChevronRight className="h-4 w-4" />
          Verder
        </Button>
      </div>
    )
  }

  return null
}
