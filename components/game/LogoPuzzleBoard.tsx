'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Puzzle, CheckCircle } from 'lucide-react'
import GameTimer from './GameTimer'
import GameProgress from './GameProgress'
import { CampaignVariant } from '@/lib/types'

interface LogoPuzzleBoardProps {
  variant: CampaignVariant
  timeLimitSec: number
  onComplete: (timeSpent: number, foundIds: string[]) => void
}

type Phase = 'preview' | 'scrambling' | 'playing' | 'done'

const PIECE_CONTAINER_PX = 300  // vierkante puzzel-grid breedte (css-px)

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Confetti burst (puur DOM, geen lib nodig)
function launchConfetti(container: HTMLElement) {
  const COLORS = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899']
  for (let i = 0; i < 28; i++) {
    const el = document.createElement('div')
    const size = 6 + Math.random() * 8
    el.style.cssText = `
      position:absolute;
      width:${size}px;height:${size}px;
      background:${COLORS[i % COLORS.length]};
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      left:${20 + Math.random() * 60}%;
      top:20%;
      --fall-dur:${0.8 + Math.random() * 0.7}s;
      pointer-events:none;
      z-index:50;
    `
    el.className = 'confetti-piece'
    container.appendChild(el)
    setTimeout(() => el.remove(), 1600)
  }
}

export default function LogoPuzzleBoard({ variant, timeLimitSec, onComplete }: LogoPuzzleBoardProps) {
  const puzzleConfig = variant.puzzle_config
  const logoUrl = puzzleConfig?.logo_url ?? variant.image_original
  const gridSize = puzzleConfig?.grid_size ?? 3
  const total = gridSize * gridSize
  const pieceSize = Math.floor(PIECE_CONTAINER_PX / gridSize)

  const [phase, setPhase] = useState<Phase>('preview')
  // slots[slotIndex] = piece index die erin zit (of null = leeg)
  const [slots, setSlots] = useState<(number | null)[]>(() => Array(total).fill(null))
  // tray: indexen van stukjes die nog niet geplaatst zijn
  const [tray, setTray] = useState<number[]>(() => shuffle(Array.from({ length: total }, (_, i) => i)))
  const [selected, setSelected] = useState<{ idx: number; from: 'tray' | 'slot'; slotIdx?: number } | null>(null)
  const [snapSlot, setSnapSlot] = useState<number | null>(null)
  const [timerRunning, setTimerRunning] = useState(false)
  const elapsedRef = useRef(0)
  const boardRef = useRef<HTMLDivElement>(null)
  const [previewCountdown, setPreviewCountdown] = useState(2)

  // Preview countdown 2..1
  useEffect(() => {
    if (phase !== 'preview') return
    const t = setInterval(() => {
      setPreviewCountdown((n) => {
        if (n <= 1) { clearInterval(t); return 0 }
        return n - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [phase])

  // Preview → scrambling → playing
  useEffect(() => {
    if (phase !== 'preview') return
    const t = setTimeout(() => {
      setPhase('scrambling')
      setTimeout(() => {
        setPhase('playing')
        setTimerRunning(true)
      }, 600)
    }, 2200)
    return () => clearTimeout(t)
  }, [phase])

  const handleTimeUp = useCallback(() => {
    if (phase === 'playing') {
      setPhase('done')
      onComplete(timeLimitSec, [])
    }
  }, [phase, timeLimitSec, onComplete])

  // Tik op stukje in de tray
  const handleTrayPieceClick = (pieceIdx: number) => {
    if (phase !== 'playing') return
    if (selected?.idx === pieceIdx && selected.from === 'tray') {
      setSelected(null)
    } else {
      setSelected({ idx: pieceIdx, from: 'tray' })
    }
  }

  // Tik op slot in het grid
  const handleSlotClick = (slotIdx: number) => {
    if (phase !== 'playing') return

    const currentPieceInSlot = slots[slotIdx]

    if (!selected) {
      // Geen stukje geselecteerd: als slot bezet is → selecteer dat stukje
      if (currentPieceInSlot !== null) {
        setSelected({ idx: currentPieceInSlot, from: 'slot', slotIdx })
      }
      return
    }

    // Een stukje is geselecteerd
    if (selected.from === 'slot' && selected.slotIdx === slotIdx) {
      // Tap op hetzelfde slot → deselecteer
      setSelected(null)
      return
    }

    setSlots((prev) => {
      const next = [...prev]

      if (currentPieceInSlot !== null) {
        // Slot is bezet → wissel
        if (selected.from === 'slot' && selected.slotIdx !== undefined) {
          // Wissel twee slots
          next[selected.slotIdx] = currentPieceInSlot
          next[slotIdx] = selected.idx
        } else {
          // Tray-stukje naar bezet slot: wissel → oud stukje terug naar tray
          setTray((t) => [...t, currentPieceInSlot])
          setTray((t) => t.filter((p) => p !== selected.idx))
          next[slotIdx] = selected.idx
        }
      } else {
        // Leeg slot
        if (selected.from === 'slot' && selected.slotIdx !== undefined) {
          next[selected.slotIdx] = null
        } else {
          // Uit tray
          setTray((t) => t.filter((p) => p !== selected.idx))
        }
        next[slotIdx] = selected.idx
      }

      return next
    })

    setSnapSlot(slotIdx)
    setTimeout(() => setSnapSlot(null), 250)
    setSelected(null)

    // Completion check (na state-update via microtask)
    setTimeout(() => {
      setSlots((latest) => {
        const correct = latest.every((piece, idx) => piece === idx)
        if (correct && phase === 'playing') {
          setPhase('done')
          setTimerRunning(false)
          if (boardRef.current) launchConfetti(boardRef.current)
          setTimeout(() => {
            onComplete(elapsedRef.current, Array.from({ length: total }, (_, i) => String(i)))
          }, 900)
        }
        return latest
      })
    }, 10)
  }

  const placedCount = slots.filter((s) => s !== null).length

  // Stuk-rendering (CSS background-position)
  const pieceStyle = (pieceIdx: number): React.CSSProperties => {
    const col = pieceIdx % gridSize
    const row = Math.floor(pieceIdx / gridSize)
    return {
      width: pieceSize,
      height: pieceSize,
      backgroundImage: `url(${logoUrl})`,
      backgroundSize: `${pieceSize * gridSize}px ${pieceSize * gridSize}px`,
      backgroundPosition: `-${col * pieceSize}px -${row * pieceSize}px`,
      backgroundRepeat: 'no-repeat',
    }
  }

  // Vlieg-animatie variabelen per stukje
  const flyStyle = (i: number): React.CSSProperties => ({
    '--fly-x': `${(Math.random() * 80 - 40).toFixed(0)}px`,
    '--fly-y': `${(Math.random() * 60 - 30).toFixed(0)}px`,
    '--fly-r': `${(Math.random() * 60 - 30).toFixed(0)}deg`,
  } as React.CSSProperties)

  return (
    <div ref={boardRef} className="flex flex-col gap-4 relative select-none" style={{ userSelect: 'none' }}>
      {/* HUD */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Puzzle className="h-5 w-5 text-[var(--color-primary)]" />
          <span className="font-bold text-sm">Logo Legpuzzel</span>
        </div>
        <GameTimer
          timeLimitSec={timeLimitSec}
          running={timerRunning}
          onTimeUp={handleTimeUp}
          onTick={(elapsed) => { elapsedRef.current = elapsed }}
        />
      </div>

      <GameProgress found={placedCount} total={total} label="stukjes" />

      {/* ── PREVIEW fase ───────────────────────────────────── */}
      {phase === 'preview' && (
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="text-center">
            <p className="text-lg font-extrabold text-[var(--color-primary)]">Onthoud het logo!</p>
            <p className="text-3xl font-black text-[var(--color-primary)]">{previewCountdown}</p>
          </div>
          <div
            className="rounded-2xl overflow-hidden border-4 border-[var(--color-primary)] shadow-lg"
            style={{ width: PIECE_CONTAINER_PX, height: PIECE_CONTAINER_PX }}
          >
            <img
              src={logoUrl}
              alt="Logo"
              className="w-full h-full object-contain bg-white"
            />
          </div>
          <p className="text-sm text-[var(--color-muted)]">Dan valt het uit elkaar… zet het terug!</p>
        </div>
      )}

      {/* ── SCRAMBLING fase ────────────────────────────────── */}
      {phase === 'scrambling' && (
        <div className="flex flex-col items-center gap-4 py-2">
          <div
            className="rounded-2xl overflow-hidden border-2 border-[var(--color-border)]"
            style={{ width: PIECE_CONTAINER_PX, height: PIECE_CONTAINER_PX, display: 'grid', gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gap: 2, background: '#f1f5f9' }}
          >
            {Array.from({ length: total }, (_, i) => (
              <div
                key={i}
                className="piece-fly-out"
                style={{ ...pieceStyle(i), ...flyStyle(i) }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── PLAYING fase ───────────────────────────────────── */}
      {phase === 'playing' && (
        <div className="flex flex-col gap-5">
          {/* Puzzle-grid (target) */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Leg het logo</p>
            <div
              className="rounded-2xl border-2 border-[var(--color-border)] overflow-hidden bg-slate-100"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${gridSize}, ${pieceSize}px)`,
                gap: 2,
                padding: 2,
                width: PIECE_CONTAINER_PX + 4,
              }}
            >
              {slots.map((piece, slotIdx) => {
                const isCorrect = piece === slotIdx
                return (
                  <button
                    key={slotIdx}
                    onClick={() => handleSlotClick(slotIdx)}
                    className={`relative transition-all rounded-sm outline-none
                      ${piece === null ? 'border-2 border-dashed border-slate-300 hover:border-blue-300' : ''}
                      ${snapSlot === slotIdx ? 'piece-snap' : ''}
                      ${isCorrect && piece !== null ? 'ring-2 ring-green-400' : ''}
                    `}
                    style={{ width: pieceSize, height: pieceSize }}
                  >
                    {piece !== null ? (
                      <div style={pieceStyle(piece)} className="rounded-sm" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-bold">
                        {slotIdx + 1}
                      </div>
                    )}
                    {isCorrect && piece !== null && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <CheckCircle className="h-4 w-4 text-green-500 drop-shadow" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Stukjes tray */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">
              {tray.length > 0 ? `${tray.length} stukjes over` : '✓ Alles geplaatst!'}
            </p>
            {tray.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 p-3 bg-slate-50 rounded-2xl border border-[var(--color-border)] w-full max-w-xs">
                {tray.map((pieceIdx) => {
                  const isSelected = selected?.idx === pieceIdx && selected.from === 'tray'
                  return (
                    <button
                      key={pieceIdx}
                      onClick={() => handleTrayPieceClick(pieceIdx)}
                      className={`rounded-md transition-all outline-none shrink-0
                        ${isSelected ? 'piece-selected ring-4 ring-[var(--color-primary)] shadow-xl z-10 scale-105' : 'hover:scale-105 hover:shadow-md'}
                      `}
                      style={{ ...pieceStyle(pieceIdx), border: isSelected ? '2px solid var(--color-primary)' : '2px solid #e2e8f0' }}
                    />
                  )
                })}
              </div>
            )}
          </div>

          {/* Instructie */}
          {selected && (
            <p className="text-center text-sm font-semibold text-[var(--color-primary)] animate-pulse">
              Tik een vakje in het grid om het stukje te plaatsen
            </p>
          )}
          {!selected && tray.length > 0 && (
            <p className="text-center text-xs text-[var(--color-muted)]">
              Tik een stukje aan, dan een vakje in het logo
            </p>
          )}
        </div>
      )}

      {/* ── DONE fase ──────────────────────────────────────── */}
      {phase === 'done' && (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="text-4xl">🎉</div>
          <p className="text-2xl font-extrabold text-[var(--color-primary)]">Logo compleet!</p>
          <div
            className="puzzle-complete rounded-2xl overflow-hidden border-4 border-green-400 shadow-xl"
            style={{ width: PIECE_CONTAINER_PX, height: PIECE_CONTAINER_PX }}
          >
            <img src={logoUrl} alt="Compleet logo" className="w-full h-full object-contain bg-white" />
          </div>
          <p className="text-sm text-[var(--color-muted)]">Doorgaan naar registratie…</p>
        </div>
      )}
    </div>
  )
}
