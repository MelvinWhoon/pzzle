'use client'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Badge from '@/components/ui/Badge'
import DataTable, { Column } from '@/components/admin/DataTable'
import { Player, GameSession, MarketingConsent } from '@/lib/types'

export default function SpelerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [player, setPlayer] = useState<Player | null>(null)
  const [sessions, setSessions] = useState<GameSession[]>([])
  const [consents, setConsents] = useState<MarketingConsent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/spelers/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setPlayer(d.player)
        setSessions(d.sessions ?? [])
        setConsents(d.consents ?? [])
      })
      .finally(() => setLoading(false))
  }, [id])

  const sessionColumns: Column<GameSession>[] = [
    { key: 'campaign', header: 'Campagne', render: (r) => (r.campaign as { title: string })?.title ?? '–' },
    { key: 'completed', header: 'Voltooid', render: (r) => r.completed ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-gray-300" /> },
    { key: 'differences_found', header: 'Gevonden', render: (r) => `${r.differences_found}/${r.differences_total}` },
    { key: 'score', header: 'Score' },
    { key: 'started_at', header: 'Datum', render: (r) => new Date(r.started_at).toLocaleString('nl-NL') },
  ]

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
  if (!player) return <p>Speler niet gevonden.</p>

  const latestConsent = consents[0]

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/spelers"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-extrabold">{player.first_name} {player.last_name}</h1>
      </div>

      {/* Spelerinfo */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 grid grid-cols-2 gap-4">
        <div><p className="text-xs text-[var(--color-muted)]">E-mail</p><p className="font-medium">{player.email}</p></div>
        <div><p className="text-xs text-[var(--color-muted)]">Telefoon</p><p className="font-medium">{player.phone ?? '–'}</p></div>
        <div><p className="text-xs text-[var(--color-muted)]">Postcode</p><p className="font-medium">{player.postal_code ?? '–'}</p></div>
        <div><p className="text-xs text-[var(--color-muted)]">Stad</p><p className="font-medium">{player.city ?? '–'}</p></div>
        <div><p className="text-xs text-[var(--color-muted)]">Geregistreerd</p><p className="font-medium">{new Date(player.created_at).toLocaleString('nl-NL')}</p></div>
        <div>
          <p className="text-xs text-[var(--color-muted)]">Marketing toestemming</p>
          <div className="flex gap-2 mt-1">
            <Badge variant={latestConsent?.consent_marketing ? 'success' : 'default'}>
              E-mail: {latestConsent?.consent_marketing ? 'Ja' : 'Nee'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Sessies */}
      <div>
        <h2 className="text-lg font-bold mb-3">Deelnames ({sessions.length})</h2>
        <DataTable
          columns={sessionColumns}
          data={sessions}
          emptyText="Geen deelnames gevonden"
        />
      </div>
    </div>
  )
}
