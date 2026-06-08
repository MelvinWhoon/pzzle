export default function InstellingenPage() {
  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <h1 className="text-2xl font-extrabold">Instellingen</h1>
      <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
        <p className="text-[var(--color-muted)] text-sm">
          Platform instellingen komen hier. In de eerste versie worden alle instellingen per campagne beheerd.
        </p>
        <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
          <p className="text-sm font-medium mb-1">Versie</p>
          <p className="text-sm text-[var(--color-muted)]">{process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0'}</p>
        </div>
      </div>
    </div>
  )
}
