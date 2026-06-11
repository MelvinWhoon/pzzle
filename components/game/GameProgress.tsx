interface GameProgressProps {
  found: number
  total: number
  label?: string
}

export default function GameProgress({ found, total, label = 'verschillen gevonden' }: GameProgressProps) {
  const pct = total > 0 ? (found / total) * 100 : 0

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center text-sm">
        <span className="font-semibold text-[var(--color-text)]">
          {found} van {total} {label}
        </span>
        <span className="text-[var(--color-muted)]">{Math.round(pct)}%</span>
      </div>
      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--color-success)] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
