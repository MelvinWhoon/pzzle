import Link from 'next/link'
import { CheckCircle, Mail, Calendar } from 'lucide-react'
import PwaInstallBanner from '@/components/player/PwaInstallBanner'

export default function BedanktPage() {
  return (
    <div className="flex flex-col items-center gap-8 py-6 text-center">
      <div>
        <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-3xl mb-4">
          <CheckCircle className="h-14 w-14 text-[var(--color-success)]" />
        </div>
        <h1 className="text-3xl font-extrabold">Bedankt!</h1>
        <p className="text-[var(--color-muted)] mt-2">Je doet mee aan de trekking.</p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)] w-full max-w-sm space-y-4">
        <div className="flex items-start gap-3 text-left">
          <div className="bg-blue-50 rounded-lg p-1.5 shrink-0">
            <Mail className="h-5 w-5 text-[var(--color-primary)]" />
          </div>
          <div>
            <p className="font-semibold text-sm">Je hoort het per e-mail</p>
            <p className="text-xs text-[var(--color-muted)]">Als je wint, sturen we je een bericht op het opgegeven e-mailadres.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 text-left">
          <div className="bg-blue-50 rounded-lg p-1.5 shrink-0">
            <Calendar className="h-5 w-5 text-[var(--color-primary)]" />
          </div>
          <div>
            <p className="font-semibold text-sm">Kom morgen terug</p>
            <p className="text-xs text-[var(--color-muted)]">Er is elke dag een nieuwe kans om te winnen.</p>
          </div>
        </div>
      </div>

      <Link
        href="/speel"
        className="text-sm text-[var(--color-primary)] font-semibold hover:underline"
      >
        Keer terug naar het speelscherm →
      </Link>

      {/* PWA installatiebanner — client component, getoond na eerste spel */}
      <PwaInstallBanner />
    </div>
  )
}
