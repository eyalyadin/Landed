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
import { Plus, Loader2 } from 'lucide-react'

function toDateInputValue(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function AddPaymentButton({ tenantId }: { tenantId: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [amount, setAmount] = useState('')
  const [paymentType, setPaymentType] = useState('rent')
  const [paidDate, setPaidDate] = useState(toDateInputValue(new Date()))
  const [notes, setNotes] = useState('')

  function reset() {
    setAmount(''); setPaymentType('rent')
    setPaidDate(toDateInputValue(new Date())); setNotes(''); setError(null); setSaving(false)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId,
        amount: amount || undefined,
        type: paymentType,
        paidDate,
        notes: notes || undefined,
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
          Add Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 py-2">
          <div>
            <label className="block text-sm font-medium mb-1">Payment Type</label>
            <Select value={paymentType} onValueChange={(v) => setPaymentType(v ?? 'rent')}>
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rent">Rent</SelectItem>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="fee">Fee</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Amount (₪)
              <span className="text-muted-foreground font-normal ml-1 text-xs">— leave blank to use overdue amount</span>
            </label>
            <Input type="number" min="0" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 5500" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date Paid</label>
            <Input type="date" required value={paidDate} onChange={(e) => setPaidDate(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional note" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setOpen(false); reset() }}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Record Payment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
