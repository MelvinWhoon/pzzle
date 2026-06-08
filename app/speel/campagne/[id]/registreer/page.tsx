'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { use } from 'react'
import { Trophy } from 'lucide-react'
import RegistrationForm from '@/components/player/RegistrationForm'

export default function RegistreerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionToken = searchParams.get('session') ?? ''

  if (!sessionToken) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--color-muted)]">Geen geldig spelsessie.</p>
        <a href="/speel" className="text-[var(--color-primary)] underline mt-2 block">Opnieuw spelen</a>
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
        />
      </div>
    </div>
  )
}
