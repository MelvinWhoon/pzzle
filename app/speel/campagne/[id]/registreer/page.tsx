'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { use, useState } from 'react'
import { Trophy, CalendarX } from 'lucide-react'
import RegistrationForm from '@/components/player/RegistrationForm'
import Button from '@/components/ui/Button'

export default function RegistreerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionToken = searchParams.get('session') ?? ''
  const [alreadyPlayed, setAlreadyPlayed] = useState(false)

  if (!sessionToken) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--color-muted)]">Geen geldig spelsessie.</p>
        <a href="/speel" className="text-[var(--color-primary)] underline mt-2 block">Opnieuw spelen</a>
      </div>
    )
  }

  if (alreadyPlayed) {
    return (
      <div className="flex flex-col items-center gap-6 py-4 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-3xl">
          <CalendarX className="h-10 w-10 text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">Je doet al mee!</h1>
          <p className="text-[var(--color-muted)] mt-2 max-w-xs mx-auto">
            Je hebt al eerder meegedaan aan deze campagne. Kom morgen terug voor een nieuwe kans op de prijs!
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button size="lg" className="w-full" onClick={() => router.push('/speel')}>
            🎮 Speel een andere campagne
          </Button>
          <Button variant="secondary" size="lg" className="w-full" onClick={() => router.push(`/speel/campagne/${campaignId}/bedankt`)}>
            Ga naar bedankt-pagina →
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-2xl mb-3">
          <Trophy className="h-8 w-8 text-yellow-500" />
        </div>
        <h1 className="text-2xl font-extrabold">Gefeliciteerd!</h1>
        <p className="text-[var(--color-muted)] mt-1">
          Vul je gegevens in om mee te doen aan de trekking.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)] shadow-sm">
        <RegistrationForm
          sessionToken={sessionToken}
          campaignId={campaignId}
          onSuccess={() => router.push(`/speel/campagne/${campaignId}/bedankt`)}
          onAlreadyPlayed={() => setAlreadyPlayed(true)}
        />
      </div>
    </div>
  )
}
