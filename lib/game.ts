import { Difference, PolygonPoint } from '@/lib/types'

function pointInPolygon(px: number, py: number, points: PolygonPoint[]): boolean {
  if (points.length < 3) return false
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x, yi = points[i].y
    const xj = points[j].x, yj = points[j].y
    if (((yi > py) !== (yj > py)) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

export function checkHit(
  relX: number,
  relY: number,
  differences: Difference[],
  found: string[]
): string | null {
  for (const d of differences) {
    if (found.includes(d.id)) continue
    if (d.type === 'polygon' && d.points && d.points.length >= 3) {
      if (pointInPolygon(relX, relY, d.points)) return d.id
    } else {
      const dist = Math.sqrt((relX - d.x) ** 2 + (relY - d.y) ** 2)
      if (dist <= d.radius) return d.id
    }
  }
  return null
}

export function calculateScore(
  differencesFound: number,
  differencesTotal: number,
  timeSpentSec: number,
  timeLimitSec: number
): number {
  if (differencesTotal === 0) return 0
  const completionRatio = differencesFound / differencesTotal
  const baseScore = Math.round(completionRatio * 1000)
  const timeBonus = timeLimitSec > 0
    ? Math.max(0, Math.round((timeLimitSec - timeSpentSec) * 5))
    : 0
  return Math.min(9999, baseScore + timeBonus)
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
