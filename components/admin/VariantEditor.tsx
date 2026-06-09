'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Trash2, Eye, EyeOff, Circle, PenLine } from 'lucide-react'
import { Difference, PolygonPoint } from '@/lib/types'
import Button from '@/components/ui/Button'

interface VariantEditorProps {
  imageModifiedUrl: string
  imageOriginalUrl: string
  differences: Difference[]
  onChange: (diffs: Difference[]) => void
}

const MIN_DRAW_DISTANCE = 0.008 // minimum afstand (relatief) tussen punten bij tekenen

function centroid(points: PolygonPoint[]): PolygonPoint {
  const x = points.reduce((s, p) => s + p.x, 0) / points.length
  const y = points.reduce((s, p) => s + p.y, 0) / points.length
  return { x, y }
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
  const [drawMode, setDrawMode] = useState<'circle' | 'freehand'>('circle')

  // Vrij-teken state
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<PolygonPoint[]>([])
  const lastPointRef = useRef<PolygonPoint | null>(null)

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

  const toRel = (clientX: number, clientY: number): PolygonPoint | null => {
    if (!containerRef.current) return null
    const rect = containerRef.current.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
    }
  }

  // ── Cirkel-modus ──────────────────────────────────────────────
  const handleCircleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (drawMode !== 'circle') return
    const rel = toRel(e.clientX, e.clientY)
    if (!rel) return
    const id = `d${Date.now()}`
    const newDiff: Difference = {
      id, type: 'circle', x: rel.x, y: rel.y,
      radius: 0.05, label: `Verschil ${differences.length + 1}`,
    }
    onChange([...differences, newDiff])
    setSelectedId(id)
  }

  // ── Vrij-teken modus ──────────────────────────────────────────
  const startDraw = (clientX: number, clientY: number) => {
    if (drawMode !== 'freehand') return
    const rel = toRel(clientX, clientY)
    if (!rel) return
    setIsDrawing(true)
    setCurrentPath([rel])
    lastPointRef.current = rel
  }

  const continueDraw = (clientX: number, clientY: number) => {
    if (!isDrawing || drawMode !== 'freehand') return
    const rel = toRel(clientX, clientY)
    if (!rel || !lastPointRef.current) return
    const dx = rel.x - lastPointRef.current.x
    const dy = rel.y - lastPointRef.current.y
    if (Math.sqrt(dx * dx + dy * dy) < MIN_DRAW_DISTANCE) return
    lastPointRef.current = rel
    setCurrentPath((prev) => [...prev, rel])
  }

  const endDraw = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    if (currentPath.length >= 5) {
      const c = centroid(currentPath)
      const id = `d${Date.now()}`
      const newDiff: Difference = {
        id, type: 'polygon', x: c.x, y: c.y,
        radius: 0.05, // fallback
        points: currentPath,
        label: `Verschil ${differences.length + 1}`,
      }
      onChange([...differences, newDiff])
      setSelectedId(id)
    }
    setCurrentPath([])
    lastPointRef.current = null
  }

  // Mouse handlers
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (drawMode === 'freehand') { e.preventDefault(); startDraw(e.clientX, e.clientY) }
  }
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => continueDraw(e.clientX, e.clientY)
  const onMouseUp = () => endDraw()

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (drawMode === 'freehand') { e.preventDefault(); const t = e.touches[0]; startDraw(t.clientX, t.clientY) }
  }
  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (drawMode === 'freehand') { e.preventDefault(); const t = e.touches[0]; continueDraw(t.clientX, t.clientY) }
  }
  const onTouchEnd = () => endDraw()

  const removeDiff = (id: string) => {
    onChange(differences.filter((d) => d.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const updateDiff = (id: string, field: keyof Difference, value: string | number) => {
    onChange(differences.map((d) => d.id === id ? { ...d, [field]: value } : d))
  }

  const activeUrl = showOriginal ? imageOriginalUrl : imageModifiedUrl

  // SVG helpers
  const polyPoints = (points: PolygonPoint[]) =>
    points.map((p) => `${p.x * imgSize.w},${p.y * imgSize.h}`).join(' ')

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex rounded-xl border border-[var(--color-border)] overflow-hidden">
          <button
            onClick={() => setDrawMode('circle')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${drawMode === 'circle' ? 'bg-[var(--color-primary)] text-white' : 'bg-white hover:bg-gray-50'}`}
          >
            <Circle className="h-3.5 w-3.5" /> Cirkel
          </button>
          <button
            onClick={() => setDrawMode('freehand')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-l border-[var(--color-border)] transition-colors ${drawMode === 'freehand' ? 'bg-[var(--color-primary)] text-white' : 'bg-white hover:bg-gray-50'}`}
          >
            <PenLine className="h-3.5 w-3.5" /> Vrij tekenen
          </button>
        </div>
        <p className="text-sm text-[var(--color-muted)] flex-1">
          {drawMode === 'circle'
            ? 'Klik op de afbeelding om een cirkel te plaatsen'
            : 'Houd ingedrukt en teken een omtrek rond het verschil'}
        </p>
        <Button size="sm" variant="secondary" onClick={() => setShowOriginal((v) => !v)}>
          {showOriginal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showOriginal ? 'Gewijzigd' : 'Origineel'}
        </Button>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className={`relative w-full rounded-xl overflow-hidden bg-gray-100 select-none ${
          drawMode === 'circle' ? 'cursor-crosshair' : isDrawing ? 'cursor-cell' : 'cursor-pen'
        }`}
        onClick={handleCircleClick}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
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
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${imgSize.w} ${imgSize.h}`}>
            {/* Bestaande verschillen */}
            {differences.map((d, i) => {
              const isSelected = d.id === selectedId
              const color = isSelected ? '#2563eb' : '#ef4444'
              const fill = isSelected ? 'rgba(37,99,235,0.15)' : 'rgba(239,68,68,0.15)'

              if (d.type === 'polygon' && d.points && d.points.length >= 3) {
                const cx = d.x * imgSize.w
                const cy = d.y * imgSize.h
                return (
                  <g key={d.id}>
                    <polygon
                      points={polyPoints(d.points)}
                      fill={fill}
                      stroke={color}
                      strokeWidth="2"
                      strokeDasharray={isSelected ? 'none' : '5 3'}
                    />
                    <circle cx={cx} cy={cy} r={12} fill={color} opacity={0.85} />
                    <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
                      fontSize={11} fill="white" fontWeight="bold">{i + 1}</text>
                  </g>
                )
              }

              // Cirkel
              const cx = d.x * imgSize.w
              const cy = d.y * imgSize.h
              const r = d.radius * imgSize.w
              return (
                <g key={d.id}>
                  <circle cx={cx} cy={cy} r={r} fill={fill} stroke={color}
                    strokeWidth="2" strokeDasharray={isSelected ? 'none' : '4 2'} />
                  <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
                    fontSize={Math.max(10, r * 0.6)} fill={color} fontWeight="bold">{i + 1}</text>
                </g>
              )
            })}

            {/* Actief getekend pad */}
            {currentPath.length >= 2 && (
              <polyline
                points={polyPoints(currentPath)}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={0.8}
              />
            )}
            {currentPath.length >= 3 && (
              <line
                x1={currentPath[currentPath.length - 1].x * imgSize.w}
                y1={currentPath[currentPath.length - 1].y * imgSize.h}
                x2={currentPath[0].x * imgSize.w}
                y2={currentPath[0].y * imgSize.h}
                stroke="#2563eb"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                opacity={0.5}
              />
            )}
          </svg>
        )}
      </div>

      {/* Lijst */}
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
            <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
              d.type === 'polygon' ? 'bg-purple-100 text-purple-600' : 'bg-red-100 text-red-600'
            }`}>
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
                {d.type === 'polygon' ? `Vrij getekend · ${d.points?.length ?? 0} punten` : `Cirkel · r:${d.radius.toFixed(3)}`}
              </p>
            </div>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {(!d.type || d.type === 'circle') && (
                <div className="flex items-center gap-1">
                  <label className="text-xs text-[var(--color-muted)] whitespace-nowrap">Radius:</label>
                  <input
                    type="number" min="0.02" max="0.3" step="0.01"
                    value={d.radius}
                    onChange={(e) => updateDiff(d.id, 'radius', parseFloat(e.target.value))}
                    className="w-16 text-xs border border-[var(--color-border)] rounded px-1.5 py-1"
                  />
                </div>
              )}
              <button
                onClick={() => removeDiff(d.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--color-muted)] hover:text-red-600 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {differences.length === 0 && (
          <p className="text-xs text-[var(--color-muted)] bg-gray-50 rounded-xl p-3">
            Nog geen verschillen geplaatst. Kies een tekenmodus en klik/teken op de afbeelding.
          </p>
        )}
      </div>
    </div>
  )
}
