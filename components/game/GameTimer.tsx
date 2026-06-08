'use client'
import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { formatTime } from '@/lib/game'

interface GameTimerProps {
  timeLimitSec: number
  running: boolean
  onTimeUp: () => void
  onTick: (elapsed: number) => void
}

export default function GameTimer({ timeLimitSec, running, onTimeUp, onTick }: GameTimerProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1
        onTick(next)
        if (timeLimitSec > 0 && next >= timeLimitSec) {
          clearInterval(interval)
          onTimeUp()
        }
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [running, timeLimitSec, onTimeUp, onTick])

  const remaining = timeLimitSec > 0 ? timeLimitSec - elapsed : elapsed
  const isUrgent = timeLimitSec > 0 && remaining <= 10

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${
        isUrgent ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-white/80 text-[var(--color-text)]'
      }`}
    >
      <Clock className="h-4 w-4" />
      <span>{timeLimitSec > 0 ? formatTime(remaining) : formatTime(elapsed)}</span>
    </div>
  )
}
