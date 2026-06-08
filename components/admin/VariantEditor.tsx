'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import { Difference } from '@/lib/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface VariantEditorProps {
  imageModifiedUrl: string
  imageOriginalUrl: string
  differences: Difference[]
  onChange: (diffs: Difference[]) => void
}

export default function VariantEditor({
  imageModifiedUrl,
  imageOriginalUrl,
  differences,
  onChange,
}: VariantEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })
  const [showOriginal, setShowOriginal] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const updateSize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setImgSize({ w: rect.width, h: rect.height })
    }
  }, [])

  useEffect(() => {
    updateSize()
    const obs = new ResizeObserver(updateSize)
    if (containerRef.current) obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [updateSize])

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width
    const relY = (e.clientY - rect.top) / rect.height
    const id = `d${Date.now()}`
    const newDiff: Difference = { id, x: relX, y: relY, radius: 0.05, label: `Verschil ${differences.length + 1}` }
    onChange([...differences, newDiff])
    setSelectedId(id)
  }

  const removeDiff = (id: string) => {
    onChange(differences.filter((d) => d.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const updateDiff = (id: string, field: keyof Difference, value: string | number) => {
    onChange(differences.map((d) => d.id === id ? { ...d, [field]: value } : d))
  }

  const activeUrl = showOriginal ? imageOriginalUrl : imageModifiedUrl

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium flex-1">
          Klik op de <strong>gewijzigde afbeelding</strong> om een verschil te plaatsen
        </p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setShowOriginal((v) => !v)}
        >
          {showOriginal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showOriginal ? 'Gewijzigd' : 'Origineel'} tonen
        </Button>
      </div>

      {/* Afbeelding met klikbare SVG overlay */}
      <div
        ref={containerRef}
        className="relative w-full rounded-xl overflow-hidden bg-gray-100 cursor-crosshair"
        onClick={handleImageClick}
      >
        {activeUrl && (
          <Image
            src={activeUrl}
            alt="Afbeelding"
            width={1200}
            height={800}
            className="w-full h-auto block pointer-events-none"
            onLoad={updateSize}
          />
        )}
        {imgSize.w > 0 && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${imgSize.w} ${imgSize.h}`}
          >
            {differences.map((d) => {
              const cx = d.x * imgSize.w
              const cy = d.y * imgSize.h
              const r = d.radius * imgSize.w
              const isSelected = d.id === selectedId
              return (
                <g key={d.id}>
                  <circle
                    cx={cx} cy={cy} r={r}
                    fill={isSelected ? 'rgba(37,99,235,0.2)' : 'rgba(239,68,68,0.2)'}
                    stroke={isSelected ? '#2563eb' : '#ef4444'}
                    strokeWidth="2"
                    strokeDasharray={isSelected ? 'none' : '4 2'}
                  />
                  <text
                    x={cx} y={cy + 1}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={Math.max(10, r * 0.6)} fill={isSelected ? '#2563eb' : '#ef4444'}
                    fontWeight="bold"
                  >
                    {differences.indexOf(d) + 1}
                  </text>
                </g>
              )
            })}
          </svg>
        )}
      </div>

      {/* Lijst van verschillen */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">{differences.length} verschil{differences.length !== 1 ? 'len' : ''} geplaatst</p>
        {differences.map((d, i) => (
          <div
            key={d.id}
            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              selectedId === d.id ? 'border-[var(--color-primary)] bg-blue-50' : 'border-[var(--color-border)] bg-white hover:border-blue-200'
            }`}
            onClick={() => setSelectedId(d.id)}
          >
            <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={d.label ?? ''}
                onChange={(e) => { e.stopPropagation(); updateDiff(d.id, 'label', e.target.value) }}
                className="w-full text-sm font-medium bg-transparent border-none outline-none"
                placeholder={`Verschil ${i + 1}`}
                onClick={(e) => e.stopPropagation()}
              />
              <p className="text-xs text-[var(--color-muted)]">
                x:{d.x.toFixed(3)} y:{d.y.toFixed(3)} r:{d.radius.toFixed(3)}
              </p>
            </div>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-1">
                <label className="text-xs text-[var(--color-muted)] whitespace-nowrap">Radius:</label>
                <input
                  type="number"
                  min="0.02"
                  max="0.2"
                  step="0.01"
                  value={d.radius}
                  onChange={(e) => updateDiff(d.id, 'radius', parseFloat(e.target.value))}
                  className="w-16 text-xs border border-[var(--color-border)] rounded px-1.5 py-1"
                />
              </div>
              <button
                onClick={() => removeDiff(d.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--color-muted)] hover:text-red-600 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
