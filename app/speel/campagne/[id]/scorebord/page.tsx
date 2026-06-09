'use client'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { Trophy, Clock, Target, ArrowLeft, Medal } from 'lucide-react'

interface ScoreEntry {
  rank: number
  name: string
  score: number
  time_spent_sec: number | null
  differences_found: number
  differences_total: number
}

const RANK_COLORS: Record<number, string> = {
  1: 'bg-yellow-400 text-yellow-900',
  2: 'bg-gray-300 text-gray-800',
  3: 'bg-amber-600 text-white',
}

function formatTime(sec: number | null) {
  if (sec == null) return '–'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export default function ScoreboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [entries, setEntries] = useState<ScoreEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [myRank, setMyRank] = useState<number | null>(null)
  const [myScore, setMyScore] = useState<number | null>(null)

  useEffect(() => {
    // Lees eigen score uit sessionStorage
    let score: number | null = null
    let time: number | null = null
    try {
      const raw = sessionStorage.getItem('pzzle_last_result')
      if (raw) {
        const result = JSON.parse(raw)
        if (result.campaign_id === id) {
          score = result.score
          time = result.time_spent_sec
          setMyScore(result.score)
        }
      }
    } catch { /* ignore */ }

    const qs = score !== null
      ? `?score=${score}${time !== null ? `&time=${time}` : ''}`
      : ''

    fetch(`/api/campagnes/${id}/scorebord${qs}`)
      .then((r) => r.json())
      .then((d) => {
        setEntries(d.entries ?? [])
        if (d.my_rank) setMyRank(d.my_rank)
      })
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div className="flex flex-col items-center gap-6 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-3xl mb-4">
          <Trophy className="h-12 w-12 text-yellow-500" />
        </div>
        <h1 className="text-3xl font-extrabold">Scorebord</h1>
        <p className="text-[var(--color-muted)] text-sm mt-1">De beste spelers van vandaag</p>
      </div>

      {/* Mijn rang */}
      {myRank !== null && myScore !== null && (
        <div className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-4 text-white text-center shadow-lg">
          <p className="text-sm font-semibold opacity-80">Jouw positie</p>
          <p className="text-4xl font-extrabold">#{myRank}</p>
          <p className="text-sm opacity-80">{myScore.toLocaleString('nl-NL')} punten</p>
        </div>
      )}

      {/* Scorebord lijst */}
      <div className="w-full flex flex-col gap-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
          ))
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-muted)]">
            <Medal className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Nog geen scores</p>
            <p className="text-sm">Wees de eerste op het scorebord!</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center gap-4 px-4 py-3 rounded-2xl border ${
                entry.rank <= 3
                  ? 'bg-white border-yellow-200 shadow-sm'
                  : 'bg-white border-[var(--color-border)]'
              }`}
            >
              {/* Rang badge */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold shrink-0 ${
                RANK_COLORS[entry.rank] ?? 'bg-gray-100 text-gray-600'
              }`}>
                {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
              </div>

              {/* Naam */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{entry.name}</p>
                <div className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
                  <span className="flex items-center gap-0.5">
                    <Target className="h-3 w-3" />
                    {entry.differences_found}/{entry.differences_total}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    {formatTime(entry.time_spent_sec)}
                  </span>
                </div>
              </div>

              {/* Score */}
              <div className="text-right shrink-0">
                <p className="font-extrabold text-[var(--color-primary)]">{entry.score.toLocaleString('nl-NL')}</p>
                <p className="text-xs text-[var(--color-muted)]">punten</p>
              </div>
            </div>
          ))
        )}
      </div>

      <Link href={`/speel/campagne/${id}`} className="flex items-center gap-2 text-sm text-[var(--color-primary)] font-semibold hover:underline">
        <ArrowLeft className="h-4 w-4" /> Terug naar campagne
      </Link>
    </div>
  )
}
