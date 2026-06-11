'use client'
import { useEffect, useState, use } from 'react'
import { ArrowLeft, Plus, Save, Trash2, Upload, Sparkles, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import VariantEditor from '@/components/admin/VariantEditor'
import PuzzleVariantEditor from '@/components/admin/PuzzleVariantEditor'
import Badge from '@/components/ui/Badge'
import { CampaignVariant, Difference, PuzzleConfig } from '@/lib/types'

interface VariantWithEdit extends CampaignVariant {
  _uploading?: boolean
  _saving?: boolean
}

interface AiVariantOption {
  url: string
  label: string
}

export default function VariantenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = use(params)
  const [variants, setVariants] = useState<VariantWithEdit[]>([])
  const [gameType, setGameType] = useState<'spot_diff' | 'logo_puzzle'>('spot_diff')
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  // AI variant generation state (per variant)
  const [aiLoading, setAiLoading] = useState<string | null>(null) // variantId or null
  const [aiOptions, setAiOptions] = useState<Record<string, AiVariantOption[]>>({}) // variantId → options
  const [aiSelected, setAiSelected] = useState<Record<string, string>>({}) // variantId → chosen url
  const [aiError, setAiError] = useState<string | null>(null)

  const loadVariants = () => {
    fetch(`/api/admin/campagnes/${campaignId}`)
      .then((r) => r.json())
      .then((d) => {
        setVariants(d.campaign?.variants ?? [])
        setGameType(d.campaign?.game_type ?? 'spot_diff')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadVariants() }, [campaignId])

  const createVariant = async () => {
    setCreating(true)
    const res = await fetch('/api/admin/varianten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaign_id: campaignId,
        label: `Variant ${variants.length + 1}`,
        image_original: '',
        image_modified: '',
        differences: [],
      }),
    })
    setCreating(false)
    if (res.ok) {
      const d = await res.json()
      setVariants((prev) => [...prev, d.variant])
      setExpandedId(d.variant.id)
    }
  }

  const uploadImage = async (variantId: string, field: 'image_original' | 'image_modified', file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'variants')
    const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
    const { url } = await res.json()
    setVariants((prev) => prev.map((v) => v.id === variantId ? { ...v, [field]: url } : v))
    // Clear AI options when original changes
    if (field === 'image_original') {
      setAiOptions((prev) => { const n = { ...prev }; delete n[variantId]; return n })
      setAiSelected((prev) => { const n = { ...prev }; delete n[variantId]; return n })
    }
  }

  const generateAiVariants = async (variantId: string, imageUrl: string) => {
    setAiLoading(variantId)
    setAiError(null)
    setAiOptions((prev) => { const n = { ...prev }; delete n[variantId]; return n })
    try {
      const res = await fetch('/api/admin/ai-variant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl, campaign_id: campaignId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Genereren mislukt')
      setAiOptions((prev) => ({ ...prev, [variantId]: data.variants }))
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Onbekende fout')
    } finally {
      setAiLoading(null)
    }
  }

  const selectAiVariant = (variantId: string, url: string) => {
    setAiSelected((prev) => ({ ...prev, [variantId]: url }))
    setVariants((prev) => prev.map((v) => v.id === variantId ? { ...v, image_modified: url } : v))
  }

  const saveVariant = async (variant: VariantWithEdit) => {
    setVariants((prev) => prev.map((v) => v.id === variant.id ? { ...v, _saving: true } : v))
    await fetch(`/api/admin/varianten/${variant.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: variant.label,
        image_original: variant.image_original,
        image_modified: variant.image_modified,
        differences: variant.differences,
        is_active: variant.is_active,
        puzzle_config: variant.puzzle_config ?? null,
      }),
    })
    setVariants((prev) => prev.map((v) => v.id === variant.id ? { ...v, _saving: false } : v))
  }

  const deleteVariant = async (id: string) => {
    await fetch(`/api/admin/varianten/${id}`, { method: 'DELETE' })
    setVariants((prev) => prev.filter((v) => v.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  const updateDiffs = (variantId: string, diffs: Difference[]) => {
    setVariants((prev) => prev.map((v) => v.id === variantId ? { ...v, differences: diffs } : v))
  }

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href={`/admin/campagnes/${campaignId}`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-2xl font-extrabold flex-1">Afbeeldingsvarianten</h1>
        <Button onClick={createVariant} loading={creating}>
          <Plus className="h-4 w-4" />Nieuwe variant
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {variants.map((v) => (
          <div key={v.id} className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
            {/* Variant header */}
            <div
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
            >
              <input
                type="text"
                value={v.label}
                onChange={(e) => { e.stopPropagation(); setVariants((prev) => prev.map((x) => x.id === v.id ? { ...x, label: e.target.value } : x)) }}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 font-bold text-sm bg-transparent border-none outline-none"
              />
              <Badge variant={v.client_approved ? 'success' : v.client_approved === false ? 'danger' : 'default'}>
                {v.client_approved ? 'Goedgekeurd' : v.client_approved === false ? 'Afgekeurd' : 'In afwachting'}
              </Badge>
              <Badge variant={v.is_active ? 'info' : 'default'}>{v.is_active ? 'Actief' : 'Inactief'}</Badge>
              <span className="text-xs text-[var(--color-muted)]">
                {gameType === 'logo_puzzle'
                  ? (v.puzzle_config?.grid_size ? `${v.puzzle_config.grid_size}×${v.puzzle_config.grid_size} puzzel` : '🧩 Logo puzzel')
                  : `${v.differences?.length ?? 0} verschillen`}
              </span>
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="ghost" onClick={() => saveVariant(v)} loading={v._saving}>
                  <Save className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => deleteVariant(v.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Expanded editor */}
            {expandedId === v.id && (
              <div className="border-t border-[var(--color-border)] p-6 flex flex-col gap-6">
                {gameType === 'logo_puzzle' ? (
                  <>
                    <PuzzleVariantEditor
                      puzzleConfig={v.puzzle_config ?? null}
                      saving={v._saving}
                      onSave={async (config) => {
                        const updated = { ...v, puzzle_config: config, image_original: config.logo_url, image_modified: config.logo_url }
                        setVariants((prev) => prev.map((x) => x.id === v.id ? updated : x))
                        await saveVariant(updated)
                      }}
                    />
                    {/* Actief toggle */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={v.is_active}
                        onChange={(e) => setVariants((prev) => prev.map((x) => x.id === v.id ? { ...x, is_active: e.target.checked } : x))}
                        className="h-4 w-4 accent-[var(--color-primary)]"
                      />
                      <span className="text-sm font-medium">Actieve variant (gebruikt in het spel)</span>
                    </label>
                    <Button onClick={() => saveVariant(v)} loading={v._saving} className="self-end">
                      <Save className="h-4 w-4" />Opslaan
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Afbeelding upload */}
                    <div className="flex flex-col gap-3">
                      <p className="text-sm font-semibold">Originele afbeelding</p>
                      <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-[var(--color-border)] rounded-xl cursor-pointer hover:border-blue-300 transition-colors w-fit">
                        <Upload className="h-4 w-4 text-[var(--color-muted)]" />
                        <span className="text-sm text-[var(--color-muted)]">{v.image_original ? 'Vervangen' : 'Uploaden'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) uploadImage(v.id, 'image_original', file)
                          }}
                        />
                      </label>
                      {v.image_original && (
                        <img src={v.image_original} alt="Origineel" className="h-32 w-auto rounded-xl object-cover border border-[var(--color-border)]" />
                      )}
                    </div>

                    {/* AI variant generatie */}
                    {v.image_original && (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">Gewijzigde afbeelding (voor het spel)</p>
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={aiLoading === v.id}
                            onClick={() => generateAiVariants(v.id, v.image_original)}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            {aiLoading === v.id ? 'AI genereert...' : 'Genereer met AI'}
                          </Button>
                        </div>

                        {aiError && aiLoading !== v.id && (
                          <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{aiError}</p>
                        )}

                        {/* AI gegenereerde opties */}
                        {aiOptions[v.id]?.length > 0 && (
                          <div className="flex flex-col gap-2">
                            <p className="text-xs text-[var(--color-muted)]">Kies welke variant je wilt gebruiken in het spel:</p>
                            <div className="grid grid-cols-2 gap-3">
                              {aiOptions[v.id].map((opt) => {
                                const isSelected = aiSelected[v.id] === opt.url || v.image_modified === opt.url
                                return (
                                  <button
                                    key={opt.url}
                                    onClick={() => selectAiVariant(v.id, opt.url)}
                                    className={`relative rounded-xl overflow-hidden border-2 transition-all ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-[var(--color-border)] hover:border-blue-300'}`}
                                  >
                                    <img src={opt.url} alt={opt.label} className="w-full h-36 object-cover" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 flex items-center justify-between">
                                      <span>{opt.label}</span>
                                      {isSelected && <CheckCircle className="h-3.5 w-3.5 text-blue-300" />}
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                            {aiSelected[v.id] && (
                              <p className="text-xs text-green-600">✓ Variant geselecteerd — vergeet niet op te slaan</p>
                            )}
                          </div>
                        )}

                        {/* Of handmatig uploaden */}
                        <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                          <div className="flex-1 border-t border-[var(--color-border)]" />
                          <span>of handmatig uploaden</span>
                          <div className="flex-1 border-t border-[var(--color-border)]" />
                        </div>
                        <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-[var(--color-border)] rounded-xl cursor-pointer hover:border-blue-300 transition-colors w-fit">
                          <Upload className="h-4 w-4 text-[var(--color-muted)]" />
                          <span className="text-sm text-[var(--color-muted)]">{v.image_modified ? 'Vervangen' : 'Uploaden'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) uploadImage(v.id, 'image_modified', file)
                            }}
                          />
                        </label>
                        {v.image_modified && !aiOptions[v.id]?.some(o => o.url === v.image_modified) && (
                          <img src={v.image_modified} alt="Gewijzigd" className="h-32 w-auto rounded-xl object-cover border border-[var(--color-border)]" />
                        )}
                      </div>
                    )}

                    {!v.image_original && (
                      <p className="text-sm text-[var(--color-muted)] bg-gray-50 rounded-xl p-4">
                        Upload eerst de originele afbeelding om AI-varianten te genereren.
                      </p>
                    )}

                    {/* Actief toggle */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={v.is_active}
                        onChange={(e) => setVariants((prev) => prev.map((x) => x.id === v.id ? { ...x, is_active: e.target.checked } : x))}
                        className="h-4 w-4 accent-[var(--color-primary)]"
                      />
                      <span className="text-sm font-medium">Actieve variant (gebruikt in het spel)</span>
                    </label>

                    {/* Verschil-editor */}
                    {v.image_modified ? (
                      <VariantEditor
                        imageModifiedUrl={v.image_modified}
                        imageOriginalUrl={v.image_original}
                        differences={v.differences ?? []}
                        onChange={(diffs) => updateDiffs(v.id, diffs)}
                      />
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-6 text-center text-[var(--color-muted)] text-sm">
                        Genereer een AI-variant of upload een gewijzigde afbeelding om verschillen te markeren.
                      </div>
                    )}

                    <Button onClick={() => saveVariant(v)} loading={v._saving} className="self-end">
                      <Save className="h-4 w-4" />Opslaan
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}

        {variants.length === 0 && (
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-12 text-center">
            <p className="text-[var(--color-muted)]">Nog geen varianten. Klik op &ldquo;Nieuwe variant&rdquo; om te beginnen.</p>
          </div>
        )}
      </div>
    </div>
  )
}
