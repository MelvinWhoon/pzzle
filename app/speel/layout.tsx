export default function SpeelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[var(--color-surface)] flex flex-col">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-[var(--color-border)]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="w-7 h-7 bg-[var(--color-primary)] rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">ZD</span>
          </div>
          <span className="font-bold text-sm">Zoek de Verschillen</span>
        </div>
      </header>
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">
        {children}
      </main>
      <footer className="text-center text-xs text-[var(--color-muted)] py-4 border-t border-[var(--color-border)]">
        © {new Date().getFullYear()} Zoek de Verschillen · <a href="#" className="hover:underline">Privacyverklaring</a>
      </footer>
    </div>
  )
}
