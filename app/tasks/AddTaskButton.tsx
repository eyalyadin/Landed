'use client'

import { useState, useEffect } from 'react'
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
import { Plus, Loader2 } from 'lucide-react'

type PropertyOption = { id: number; address: string }

export function AddTaskButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [properties, setProperties] = useState<PropertyOption[]>([])
  const [loadingProps, setLoadingProps] = useState(false)

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('repair')
  const [status, setStatus] = useState('new')
  const [propertyId, setPropertyId] = useState('')
  const [dueDate, setDueDate] = useState('')

  useEffect(() => {
    if (!open) return
    setLoadingProps(true)
    fetch('/api/properties')
      .then(r => r.json())
      .then((data: Array<{ id: number; address: string }>) => {
        setProperties(data.map(p => ({ id: p.id, address: p.address })))
      })
      .catch(() => {})
      .finally(() => setLoadingProps(false))
  }, [open])

  function reset() {
    setTitle(''); setCategory('repair'); setStatus('new')
    setPropertyId(''); setDueDate(''); setError(null); setSaving(false)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, category, status,
        propertyId: parseInt(propertyId, 10),
        dueDate: dueDate || undefined,
      }),
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
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 py-2">
          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Fix leaking faucet" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Property *</label>
            {loadingProps ? (
              <div className="h-9 flex items-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />Loading…
              </div>
            ) : (
              <Select value={propertyId} onValueChange={(v) => setPropertyId(v ?? '')} required>
                <SelectTrigger className="h-9 text-[13px]">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map(p => (
                    <SelectItem key={p.id} value={String(p.id)} className="text-[13px]">
                      {p.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <Select value={category} onValueChange={(v) => setCategory(v ?? 'repair')}>
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="repair">Repair</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="inspection">Inspection</SelectItem>
                <SelectItem value="payment_followup">Payment Follow-up</SelectItem>
                <SelectItem value="contract_renewal">Contract Renewal</SelectItem>
                <SelectItem value="tenant_issue">Tenant Issue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v ?? 'new')}>
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="waiting_on_tenant">Waiting on Tenant</SelectItem>
                <SelectItem value="waiting_on_vendor">Waiting on Vendor</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setOpen(false); reset() }}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !propertyId} className="flex-1">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Add Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
