'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Upload, Loader2 } from 'lucide-react'

function toDateInputValue(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function AddContractButton({ propertyId }: { propertyId: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [documentName, setDocumentName] = useState('')
  const [documentType, setDocumentType] = useState('rental_contract')
  const [uploadedAt, setUploadedAt] = useState(toDateInputValue(new Date()))

  function reset() {
    setDocumentName(''); setDocumentType('rental_contract')
    setUploadedAt(toDateInputValue(new Date())); setError(null); setSaving(false)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentName, documentType, propertyId, uploadedAt }),
    })
    setSaving(false)
    if (res.ok) {
      setOpen(false)
      reset()
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to save')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); setOpen(v) }}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 text-[13px]">
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          Upload Contract
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Contract / Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 py-2">
          <div>
            <label className="block text-sm font-medium mb-1">Document Name *</label>
            <Input required value={documentName} onChange={(e) => setDocumentName(e.target.value)} placeholder="e.g. Rental Contract 2024" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Document Type</label>
            <Select value={documentType} onValueChange={(v) => setDocumentType(v ?? 'rental_contract')}>
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rental_contract">Rental Contract</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="deposit_document">Deposit Document</SelectItem>
                <SelectItem value="keys_record">Keys Record</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Upload Date</label>
            <Input type="date" required value={uploadedAt} onChange={(e) => setUploadedAt(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              File
              <span className="text-muted-foreground font-normal ml-1 text-xs">— file storage not yet configured, metadata is saved</span>
            </label>
            <Input type="file" disabled className="opacity-50 cursor-not-allowed" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setOpen(false); reset() }}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Save Contract'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
