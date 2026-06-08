'use client'
import { useState } from 'react'
import { Link2, Copy, Check } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface PreviewLinkGeneratorProps {
  campaignId: string
}

export default function PreviewLinkGenerator({ campaignId }: PreviewLinkGeneratorProps) {
  const [open, setOpen] = useState(false)
  const [link, setLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/campagnes/${campaignId}/preview-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: 'Klant previewlink', days: 14 }),
      })
      const data = await res.json()
      const url = `${window.location.origin}/preview/${data.token}`
      setLink(url)
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={generate} loading={loading}>
        <Link2 className="h-4 w-4" />
        Previewlink genereren
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Previewlink gegenereerd">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--color-muted)]">
            Stuur deze link naar de klant. De link is 14 dagen geldig en vereist geen login.
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={link}
              className="flex-1 text-sm border border-[var(--color-border)] rounded-xl px-3 py-2 bg-gray-50 font-mono truncate"
            />
            <Button size="sm" variant={copied ? 'secondary' : 'primary'} onClick={copy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Gekopieerd!' : 'Kopieer'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
