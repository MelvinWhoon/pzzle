'use client'
import { useState } from 'react'
import { Share2, MessageCircle, Copy, Check, Trophy } from 'lucide-react'

interface ShareCardProps {
  score: number
  campaignTitle: string
  clientName?: string | null
  differencesFound: number
  timeSpentSec: number
  campaignId: string
}

export default function ShareCard({
  score, campaignTitle, clientName, differencesFound, timeSpentSec, campaignId,
}: ShareCardProps) {
  const [copied, setCopied] = useState(false)

  const displayName = clientName ?? campaignTitle
  const timeStr = timeSpentSec < 60
    ? `${timeSpentSec}s`
    : `${Math.floor(timeSpentSec / 60)}m${timeSpentSec % 60 > 0 ? ` ${timeSpentSec % 60}s` : ''}`

  const shareText = `🎯 Ik speelde Zoek de Verschillen bij ${displayName} en haalde ${score.toLocaleString('nl-NL')} punten in ${timeStr}! Kun jij het ook?`
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/speel/campagne/${campaignId}`

  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Pzzle — Zoek de Verschillen', text: shareText, url: shareUrl })
      } catch { /* ignore */ }
    } else {
      shareWhatsApp()
    }
  }

  return (
    <div className="w-full max-w-sm flex flex-col gap-3">
      {/* Deelkaart visual */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-white/20 rounded-xl p-2">
            <Trophy className="h-6 w-6 text-yellow-300" />
          </div>
          <div>
            <p className="text-xs font-semibold text-indigo-200 uppercase tracking-wide">Pzzle</p>
            <p className="font-bold text-sm truncate">{displayName}</p>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-4xl font-extrabold">{score.toLocaleString('nl-NL')}</p>
            <p className="text-sm text-indigo-200">punten</p>
          </div>
          <div className="text-right text-sm text-indigo-200">
            <p>🎯 {differencesFound} verschillen</p>
            <p>⏱ {timeStr}</p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-white/20">
          <p className="text-xs text-indigo-200">Kun jij het ook? Speel via:</p>
          <p className="text-xs font-mono text-white/80 truncate">{shareUrl}</p>
        </div>
      </div>

      {/* Deelknoppen */}
      <p className="text-center text-sm font-semibold text-[var(--color-muted)]">Deel jouw score!</p>
      <div className="flex gap-2">
        <button
          onClick={shareWhatsApp}
          className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm py-3 rounded-xl transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </button>
        <button
          onClick={shareNative}
          className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm px-4 py-3 rounded-xl transition-colors"
          title="Meer opties"
        >
          <Share2 className="h-4 w-4" />
        </button>
        <button
          onClick={copyLink}
          className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm px-4 py-3 rounded-xl transition-colors"
          title="Link kopiëren"
        >
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
