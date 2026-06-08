'use client'
import { useState, useCallback, useRef } from 'react'
import { CampaignVariant } from '@/lib/types'
import { checkHit } from '@/lib/game'
import GameImage from './GameImage'
import GameTimer from './GameTimer'
import GameProgress from './GameProgress'

interface GameBoardProps {
  variant: CampaignVariant
  timeLimitSec: number
  onComplete: (timeSpent: number, foundIds: string[]) => void
}

interface MissMarker {
  x: number
  y: number
  id: string
}

export default function GameBoard({ variant, timeLimitSec, onComplete }: GameBoardProps) {
  const [foundIds, setFoundIds] = useState<string[]>([])
  const [missMarker, setMissMarker] = useState<MissMarker | null>(null)
  const [gameOver, setGameOver] = useState(false)
  const [timerRunning, setTimerRunning] = useState(true)
  const elapsedRef = useRef(0)
  const debounceRef = useRef(false)
  const clickLogRef = useRef<Array<{ x: number; y: number; hit: boolean; ts: number }>>([])

  const handleTick = useCallback((elapsed: number) => {
    elapsedRef.current = elapsed
  }, [])

  const handleTimeUp = useCallback(() => {
    setTimerRunning(false)
    setGameOver(true)
    onComplete(elapsedRef.current, foundIds)
  }, [foundIds, onComplete])

  const handleClick = useCallback(
    (relX: number, relY: number) => {
      if (gameOver || debounceRef.current) return

      const hit = checkHit(relX, relY, variant.differences, foundIds)
      clickLogRef.current.push({ x: relX, y: relY, hit: !!hit, ts: elapsedRef.current })

      if (hit) {
        const newFound = [...foundIds, hit]
        setFoundIds(newFound)
        setMissMarker(null)

        if (newFound.length === variant.differences.length) {
          setTimerRunning(false)
          setGameOver(true)
          setTimeout(() => onComplete(elapsedRef.current, newFound), 600)
        }
      } else {
        // Miss: debounce + visuele feedback
        debounceRef.current = true
        const missId = `${relX}-${relY}`
        setMissMarker({ x: relX, y: relY, id: missId })
        setTimeout(() => {
          setMissMarker(null)
          debounceRef.current = false
        }, 500)
      }
    },
    [gameOver, foundIds, variant.differences, onComplete]
  )

  const imageOriginalUrl = variant.image_original.startsWith('http')
    ? variant.image_original
    : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/campaign-images/${variant.image_original}`

  const imageModifiedUrl = variant.image_modified.startsWith('http')
    ? variant.image_modified
    : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/campaign-images/${variant.image_modified}`

  return (
    <div className="flex flex-col gap-4">
      {/* HUD: timer + voortgang */}
      <div className="flex flex-col gap-2 px-1">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Zoek de verschillen!</h2>
          <GameTimer
            timeLimitSec={timeLimitSec}
            running={timerRunning && !gameOver}
            onTimeUp={handleTimeUp}
            onTick={handleTick}
          />
        </div>
        <GameProgress found={foundIds.length} total={variant.differences.length} />
      </div>

      {/* Afbeeldingen: naast elkaar op desktop, gestapeld op mobiel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-center text-[var(--color-muted)] mb-1 font-medium uppercase tracking-wide">Origineel</p>
          <GameImage
            src={imageOriginalUrl}
            alt="Originele afbeelding"
            differences={variant.differences}
            foundIds={foundIds}
            onClickRelative={handleClick}
            disabled={gameOver}
            showMiss={missMarker}
          />
        </div>
        <div>
          <p className="text-xs text-center text-[var(--color-muted)] mb-1 font-medium uppercase tracking-wide">Gewijzigd</p>
          <GameImage
            src={imageModifiedUrl}
            alt="Gewijzigde afbeelding"
            differences={variant.differences}
            foundIds={foundIds}
            onClickRelative={handleClick}
            disabled={gameOver}
            showMiss={missMarker}
          />
        </div>
      </div>

      {/* Tip */}
      <p className="text-center text-sm text-[var(--color-muted)]">
        Tik op een verschil om het te markeren
      </p>
    </div>
  )
}
