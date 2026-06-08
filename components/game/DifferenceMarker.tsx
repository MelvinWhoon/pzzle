'use client'
import { Difference } from '@/lib/types'

interface DifferenceMarkerProps {
  difference: Difference
  imageWidth: number
  imageHeight: number
}

export default function DifferenceMarker({ difference, imageWidth, imageHeight }: DifferenceMarkerProps) {
  const cx = difference.x * imageWidth
  const cy = difference.y * imageHeight
  const r = difference.radius * imageWidth

  return (
    <g className="pop-in">
      {/* Pulse ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#10b981"
        strokeWidth="3"
        opacity="0.5"
        className="pulse-ring"
      />
      {/* Solid circle */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="rgba(16, 185, 129, 0.2)"
        stroke="#10b981"
        strokeWidth="2.5"
      />
      {/* Checkmark */}
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={r * 0.9}
        fill="#10b981"
        fontWeight="bold"
      >
        ✓
      </text>
    </g>
  )
}
