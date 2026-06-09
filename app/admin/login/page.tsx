'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Inloggen mislukt')
        return
      }
      router.push('/admin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--color-surface)] p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-[var(--color-border)] w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[var(--color-primary)] rounded-2xl mb-4">
            <span className="text-white font-extrabold text-lg">Pz</span>
          </div>
          <h1 className="text-2xl font-extrabold">Admin inloggen</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">Pzzle Beheer</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="E-mailadres"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Wachtwoord"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          <Button type="submit" size="lg" className="w-full mt-2" loading={loading}>
            <LogIn className="h-5 w-5" />
            Inloggen
          </Button>
        </form>
      </div>
    </div>
  )
}
