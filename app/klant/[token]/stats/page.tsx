'use client'
import { useEffect, useState, use } from 'react'
import { Users, TrendingUp, Star, CheckCircle, Zap, Clock, Target } from 'lucide-react'

interface ClientStats {
  total_players: number
  total_leads: number
  completion_rate: number
  avg_score: number
  active_campaigns: number
  this_week_leads: number
}

interface Campaign {
  id: string
  title: string
  status: string
  starts_at: string | null
  ends_at: string | null
}

interface RecentLead {
  registered_at: string
  campaign_id: string
  player: { first_name: string; city: string | null } | null
}

interface ClientData {
  id: string
  name: string
  logo_url: string | null
  website: string | null
  city: string | null
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  active: { label: 'Actief', color: 'bg-green-100 text-green-700' },
  draft: { label: 'Concept', color: 'bg-gray-100 text-gray-600' },
  paused: { label: 'Gepauzeerd', color: 'bg-yellow-100 text-yellow-700' },
  archived: { label: 'Gearchiveerd', color: 'bg-red-100 text-red-600' },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'zojuist'
  if (mins < 60) return `${mins}m geleden`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}u geleden`
  return `${Math.floor(hrs / 24)}d geleden`
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-extrabold">{value}</p>
        {sub && <p className="text-xs text-[var(--color-muted)]">{sub}</p>}
      </div>
    </div>
  )
}

export default function KlantStatsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [client, setClient] = useState<ClientData | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [stats, setStats] = useState<ClientStats | null>(null)
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/klant/${token}/stats`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null }
        return r.json()
      })
      .then((d) => {
        if (!d) return
        setClient(d.client)
        setCampaigns(d.campaigns)
        setStats(d.stats)
        setRecentLeads(d.recent_leads ?? [])
      })
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--color-muted)] text-sm">Statistieken laden...</p>
        </div>
      </div>
    )
  }

  if (notFound || !client || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center p-8">
          <p className="text-4xl mb-4">🔍</p>
          <h1 className="text-xl font-bold mb-2">Statistieken niet gevonden</h1>
          <p className="text-[var(--color-muted)] text-sm">Controleer de link of neem contact op met Pzzle.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            {client.logo_url ? (
              <img src={client.logo_url} alt={client.name} className="h-16 w-16 rounded-2xl object-contain bg-white p-2 shrink-0" />
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-extrabold shrink-0">
                {client.name.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-blue-200 text-sm font-medium">Statistieken voor</p>
              <h1 className="text-3xl font-extrabold">{client.name}</h1>
              {client.city && <p className="text-blue-200 text-sm">{client.city}</p>}
            </div>
          </div>
          <p className="text-blue-200 text-xs mt-4">
            🔒 Privé link — deel dit niet publiek · Powered by Pzzle
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">
        {/* Statistieken grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            icon={<Users className="h-6 w-6 text-blue-600" />}
            label="Totaal spelers"
            value={stats.total_players.toLocaleString('nl-NL')}
            color="bg-blue-50"
          />
          <StatCard
            icon={<Target className="h-6 w-6 text-green-600" />}
            label="Leads totaal"
            value={stats.total_leads.toLocaleString('nl-NL')}
            sub="Geregistreerde deelnemers"
            color="bg-green-50"
          />
          <StatCard
            icon={<Zap className="h-6 w-6 text-yellow-600" />}
            label="Leads deze week"
            value={stats.this_week_leads.toLocaleString('nl-NL')}
            color="bg-yellow-50"
          />
          <StatCard
            icon={<TrendingUp className="h-6 w-6 text-purple-600" />}
            label="Voltooiingsratio"
            value={`${stats.completion_rate}%`}
            sub="Van gestart naar klaar"
            color="bg-purple-50"
          />
          <StatCard
            icon={<Star className="h-6 w-6 text-orange-500" />}
            label="Gem. score"
            value={stats.avg_score.toLocaleString('nl-NL')}
            sub="Punten per speler"
            color="bg-orange-50"
          />
          <StatCard
            icon={<CheckCircle className="h-6 w-6 text-emerald-600" />}
            label="Actieve campagnes"
            value={stats.active_campaigns}
            color="bg-emerald-50"
          />
        </div>

        {/* Recente leads */}
        {recentLeads.length > 0 && (
          <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--color-border)]">
              <h2 className="font-bold">Recente deelnemers</h2>
              <p className="text-xs text-[var(--color-muted)]">Laatste 5 registraties</p>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {recentLeads.map((lead, i) => {
                const player = (Array.isArray(lead.player) ? lead.player[0] : lead.player) as { first_name: string; city: string | null } | null
                return (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 shrink-0">
                      {player?.first_name?.charAt(0) ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{player?.first_name ?? 'Anoniem'}</p>
                      {player?.city && <p className="text-xs text-[var(--color-muted)]">{player.city}</p>}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
                      <Clock className="h-3 w-3" />
                      {timeAgo(lead.registered_at)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Campagnes */}
        {campaigns.length > 0 && (
          <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--color-border)]">
              <h2 className="font-bold">Jouw campagnes</h2>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {campaigns.map((c) => {
                const s = STATUS_LABEL[c.status] ?? { label: c.status, color: 'bg-gray-100 text-gray-600' }
                return (
                  <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{c.title}</p>
                      {(c.starts_at || c.ends_at) && (
                        <p className="text-xs text-[var(--color-muted)]">
                          {c.starts_at ? new Date(c.starts_at).toLocaleDateString('nl-NL') : '?'}
                          {' – '}
                          {c.ends_at ? new Date(c.ends_at).toLocaleDateString('nl-NL') : 'doorlopend'}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-[var(--color-muted)] pb-4">
          © Pzzle — Zoek de Verschillen Platform · Statistieken bijgewerkt in real-time
        </p>
      </div>
    </div>
  )
}
