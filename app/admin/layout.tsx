import AdminNav from '@/components/admin/AdminNav'
import { ToastProvider } from '@/components/ui/Toast'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex h-dvh bg-[var(--color-surface)] overflow-hidden">
        <AdminNav />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  )
}
