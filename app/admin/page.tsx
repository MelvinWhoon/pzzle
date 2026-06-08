'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Megaphone, Users, Gamepad2, UserCheck, Clock, AlertCircle } from 'lucide-react'
import StatCard from '@/components/admin/StatCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface Stats {
  total_campaigns: number
  active_campaigns: number
  sessions_today: number
  players_today: number
  completed_today: number
  leads_today: number
  pending_approval: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => {
        if (!r.ok) router.push('/admin/login')
        return r.json()
      })
      .then((d) => {
        if (!d.user) router.push('/admin/login')
      })

    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false))
  }, [router])

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold">Dashboard</h1>
        <p className="text-[var(--color-muted)] text-sm mt-0.5">Overzicht van vandaag</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Actieve campagnes" value={stats?.active_campaigns ?? 0} icon={Megaphone} color="#2563eb" sub={`${stats?.total_campaigns ?? 0} totaal`} />
        <StatCard label="Spelers vandaag" value={stats?.players_today ?? 0} icon={Users} color="#10b981" />
        <StatCard label="Gespeeld vandaag" value={stats?.sessions_today ?? 0} icon={Gamepad2} color="#8b5cf6" sub={`${stats?.completed_today ?? 0} voltooid`} />
        <StatCard label="Nieuwe leads" value={stats?.leads_today ?? 0} icon={UserCheck} color="#f59e0b" />
        <StatCard label="Wacht op goedkeuring" value={stats?.pending_approval ?? 0} icon={Clock} color="#ef4444" />
        <StatCard label="Voltooiingspercentage" value={stats && stats.sessions_today > 0 ? `${Math.round((stats.completed_today / stats.sessions_today) * 100)}%` : '–'} icon={AlertCircle} color="#64748b" />
      </div>

      {stats?.pending_approval ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-yellow-600 shrink-0" />
          <div>
            <p className="font-semibold text-sm text-yellow-800">
              {stats.pending_approval} variant{stats.pending_approval !== 1 ? 'en wachten' : ' wacht'} op klantgoedkeuring
            </p>
            <a href="/admin/campagnes" className="text-xs text-yellow-700 hover:underline">Bekijk campagnes →</a>
          </div>
        </div>
      ) : null}
    </div>
  )
}
