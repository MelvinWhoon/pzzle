'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Megaphone, Image, Gamepad2,
  ListChecks, Gift, Trophy, Settings, LogOut, ChevronRight,
} from 'lucide-react'

const nav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/klanten', label: 'Klanten', icon: Users },
  { href: '/admin/campagnes', label: 'Campagnes', icon: Megaphone },
  { href: '/admin/spelers', label: 'Spelers', icon: Gamepad2 },
  { href: '/admin/deelnames', label: 'Deelnames', icon: ListChecks },
  { href: '/admin/prijzen', label: 'Prijzen', icon: Gift },
  { href: '/admin/winnaars', label: 'Winnaars', icon: Trophy },
  { href: '/admin/instellingen', label: 'Instellingen', icon: Settings },
]

export default function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-[var(--color-border)] flex flex-col h-full">
      <div className="p-5 border-b border-[var(--color-border)]">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[var(--color-primary)] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">ZD</span>
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Zoek de</p>
            <p className="font-bold text-sm leading-tight text-[var(--color-primary)]">Verschillen</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-0.5">
        {nav.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-blue-50 text-[var(--color-primary)]'
                  : 'text-[var(--color-muted)] hover:bg-gray-50 hover:text-[var(--color-text)]'
              }`}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-[var(--color-border)]">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--color-muted)] hover:bg-red-50 hover:text-red-600 transition-all w-full"
        >
          <LogOut className="h-4.5 w-4.5" />
          Uitloggen
        </button>
      </div>
    </aside>
  )
}
