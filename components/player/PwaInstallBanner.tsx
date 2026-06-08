'use client'
import { useState, useEffect } from 'react'
import { Smartphone, X } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function PwaInstallBanner() {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const gameCount = parseInt(localStorage.getItem('pwa_game_count') ?? '0', 10)
    const dismissed = localStorage.getItem('pwa_dismissed') === '1'
    const installed = localStorage.getItem('pwa_installed') === '1'
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches

    if (dismissed || installed || isStandalone) return
    if (gameCount < 1) return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)
    setShow(true)
  }, [])

  const handleInstall = async () => {
    const prompt = (window as Window & { __pwaPrompt?: { prompt: () => void; userChoice: Promise<{ outcome: string }> } }).__pwaPrompt
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      localStorage.setItem('pwa_installed', '1')
      setShow(false)
    }
  }

  const dismiss = () => {
    localStorage.setItem('pwa_dismissed', '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 bg-white rounded-2xl shadow-xl border border-[var(--color-border)] p-4">
      <div className="flex items-start gap-3">
        <div className="bg-blue-100 rounded-xl p-2 shrink-0">
          <Smartphone className="h-6 w-6 text-[var(--color-primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">Sneller openen?</p>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            Zet de app op je beginscherm voor directe toegang
          </p>

          {isIOS ? (
            <div className="mt-2 text-xs text-[var(--color-muted)] bg-gray-50 rounded-lg p-2.5 space-y-1">
              <p>📱 Tik op het <strong>deel-icoon</strong> in Safari</p>
              <p>➕ Kies <strong>&ldquo;Zet op beginscherm&rdquo;</strong></p>
              <p>✅ Tik op <strong>&ldquo;Voeg toe&rdquo;</strong></p>
            </div>
          ) : (
            <Button size="sm" className="mt-2" onClick={handleInstall}>
              App installeren
            </Button>
          )}
        </div>
        <button
          onClick={dismiss}
          className="p-1 rounded-lg hover:bg-gray-100 shrink-0"
          aria-label="Sluiten"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </div>
  )
}
