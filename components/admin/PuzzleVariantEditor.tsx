'use client'
import { useState } from 'react'
import { Upload } from 'lucide-react'
import { PuzzleConfig } from '@/lib/types'

interface PuzzleVariantEditorProps {
  puzzleConfig: PuzzleConfig | null
  onSave: (config: PuzzleConfig) => Promise<void>
  saving?: boolean
}

const GRID_OPTIONS: { size: 3 | 4 | 5; label: string; desc: string }[] = [
  { size: 3, label: '3×3', desc: '9 stukjes — makkelijk' },
  { size: 4, label: '4×4', desc: '16 stukjes — gemiddeld' },
  { size: 5, label: '5×5', desc: '25 stukjes — moeilijk' },
]

const PREVIEW_PX = 192   // w-48

export default function PuzzleVariantEditor({ puzzleConfig, onSave, saving }: PuzzleVariantEditorProps) {
  const [logoUrl, setLogoUrl] = useState(puzzleConfig?.logo_url ?? '')
  const [gridSize, setGridSize] = useState<3 | 4 | 5>(puzzleConfig?.grid_size ?? 3)
  const [uploading, setUploading] = useState(false)
  const [dirty, setDirty] = useState(false)

  const uploadLogo = async (file: File) => {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', 'logos')
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const { url } = await res.json()
    setLogoUrl(url)
    setDirty(true)
    setUploading(false)
  }

  const handleSave = async () => {
    if (!logoUrl) return
    await onSave({ grid_size: gridSize, logo_url: logoUrl })
    setDirty(false)
  }

  const pieceSize = Math.floor(PREVIEW_PX / gridSize)

  return (
    <div className="flex flex-col gap-5">
      {/* Logo upload */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">Bedrijfslogo</label>
        <div className="flex items-center gap-4 flex-wrap">
          {logoUrl ? (
            <div className="relative">
              <img
                src={logoUrl}
                alt="Logo"
                className="h-20 w-20 object-contain rounded-xl border border-[var(--color-border)] bg-white p-1"
              />
            </div>
          ) : null}
          <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-[var(--color-border)] rounded-xl cursor-pointer hover:border-blue-300 transition-colors">
            <Upload className="h-4 w-4 text-[var(--color-muted)]" />
            <span className="text-sm text-[var(--color-muted)]">
              {uploading ? 'Uploaden...' : logoUrl ? 'Ander logo' : 'Logo uploaden'}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f) }}
            />
          </label>
        </div>
        <p className="text-xs text-[var(--color-muted)]">Gebruik een logo met transparante achtergrond (PNG) voor het beste resultaat.</p>
      </div>

      {/* Grid-grootte keuze */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">Aantal puzzelstukjes</label>
        <div className="flex gap-2 flex-wrap">
          {GRID_OPTIONS.map((opt) => (
            <button
              key={opt.size}
              type="button"
              onClick={() => { setGridSize(opt.size); setDirty(true) }}
              className={`flex flex-col items-center px-4 py-3 rounded-xl border-2 transition-all text-sm font-semibold ${
                gridSize === opt.size
                  ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]'
                  : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-blue-200'
              }`}
            >
              <span className="text-lg font-extrabold">{opt.label}</span>
              <span className="text-xs font-normal">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Live preview */}
      {logoUrl && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">Preview — zo ziet de speler het</label>
          <div className="flex gap-6 flex-wrap items-start">
            {/* Compleet logo */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-[var(--color-muted)]">Onthoud het logo!</span>
              <div
                className="rounded-xl overflow-hidden border-4 border-blue-400 bg-white"
                style={{ width: PREVIEW_PX, height: PREVIEW_PX }}
              >
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            {/* Gesplitst als puzzel */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-[var(--color-muted)]">Na scramble</span>
              <div
                className="rounded-xl overflow-hidden border-2 border-[var(--color-border)] bg-slate-100"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${gridSize}, ${pieceSize}px)`,
                  gap: 2,
                  padding: 2,
                }}
              >
                {Array.from({ length: gridSize * gridSize }, (_, i) => {
                  // Toon de stukjes in willekeurige volgorde
                  const shuffledIdx = [2, 5, 0, 7, 4, 1, 8, 3, 6][i % 9] % (gridSize * gridSize)
                  const col = shuffledIdx % gridSize
                  const row = Math.floor(shuffledIdx / gridSize)
                  return (
                    <div
                      key={i}
                      style={{
                        width: pieceSize,
                        height: pieceSize,
                        backgroundImage: `url(${logoUrl})`,
                        backgroundSize: `${PREVIEW_PX}px ${PREVIEW_PX}px`,
                        backgroundPosition: `-${col * pieceSize}px -${row * pieceSize}px`,
                        backgroundRepeat: 'no-repeat',
                      }}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Opslaan */}
      <button
        type="button"
        disabled={!logoUrl || !dirty || saving}
        onClick={handleSave}
        className="self-start px-5 py-2.5 bg-[var(--color-primary)] text-white font-semibold rounded-xl disabled:opacity-40 hover:bg-[var(--color-primary-dark)] transition-colors text-sm"
      >
        {saving ? 'Opslaan...' : 'Variant opslaan'}
      </button>
    </div>
  )
}
