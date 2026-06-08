interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

const variantClasses = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
}

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

export function statusToBadge(status: string) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    draft: { label: 'Concept', variant: 'default' },
    active: { label: 'Actief', variant: 'success' },
    paused: { label: 'Gepauzeerd', variant: 'warning' },
    archived: { label: 'Gearchiveerd', variant: 'default' },
  }
  return map[status] ?? { label: status, variant: 'default' }
}
