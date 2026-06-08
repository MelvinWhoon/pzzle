import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color?: string
  sub?: string
}

export default function StatCard({ label, value, icon: Icon, color = '#2563eb', sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[var(--color-border)] flex items-start gap-4">
      <div className="rounded-xl p-2.5 shrink-0" style={{ backgroundColor: `${color}15` }}>
        <Icon className="h-6 w-6" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-[var(--color-text)] leading-tight">{value}</p>
        <p className="text-sm text-[var(--color-muted)] mt-0.5">{label}</p>
        {sub && <p className="text-xs text-[var(--color-muted)] mt-1">{sub}</p>}
      </div>
    </div>
  )
}
