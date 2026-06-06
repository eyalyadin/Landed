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
import { Plus, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

export function AddPropertyButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTenant, setShowTenant] = useState(false)

  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [propertyType, setPropertyType] = useState('apartment')
  const [unitLabel, setUnitLabel] = useState('')
  const [monthlyRent, setMonthlyRent] = useState('')

  const [tenantName, setTenantName] = useState('')
  const [tenantPhone, setTenantPhone] = useState('')
  const [tenantEmail, setTenantEmail] = useState('')
  const [leaseStartDate, setLeaseStartDate] = useState('')
  const [leaseEndDate, setLeaseEndDate] = useState('')

  function reset() {
    setAddress(''); setCity(''); setPropertyType('apartment'); setUnitLabel(''); setMonthlyRent('')
    setTenantName(''); setTenantPhone(''); setTenantEmail(''); setLeaseStartDate(''); setLeaseEndDate('')
    setShowTenant(false); setError(null); setSaving(false)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address, city, propertyType, unitLabel: unitLabel || undefined,
        monthlyRent,
        tenantName: tenantName || undefined,
        tenantPhone: tenantPhone || undefined,
        tenantEmail: tenantEmail || undefined,
        leaseStartDate: leaseStartDate || undefined,
        leaseEndDate: leaseEndDate || undefined,
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
          Add Property
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Property</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 py-2">
          {/* Property details */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Property Details</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Address *</label>
              <Input required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 123 HaYarkon St" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City *</label>
              <Input required value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Tel Aviv" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <Select value={propertyType} onValueChange={(v) => setPropertyType(v ?? 'apartment')}>
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit Label</label>
                <Input value={unitLabel} onChange={(e) => setUnitLabel(e.target.value)} placeholder="e.g. Apt 4A" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Monthly Rent (₪) *</label>
              <Input required type="number" min="0" step="1" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} placeholder="e.g. 5500" />
            </div>
          </div>

          {/* Optional tenant section */}
          <div className="border border-border rounded-md">
            <button
              type="button"
              onClick={() => setShowTenant(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/40 transition-colors rounded-md"
            >
              <span>Add Tenant (optional)</span>
              {showTenant ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showTenant && (
              <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Tenant Name</label>
                  <Input value={tenantName} onChange={(e) => setTenantName(e.target.value)} placeholder="e.g. David Cohen" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <Input type="tel" value={tenantPhone} onChange={(e) => setTenantPhone(e.target.value)} placeholder="050-1234567" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <Input type="email" value={tenantEmail} onChange={(e) => setTenantEmail(e.target.value)} placeholder="tenant@example.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Lease Start</label>
                    <Input type="date" value={leaseStartDate} onChange={(e) => setLeaseStartDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Lease End</label>
                    <Input type="date" value={leaseEndDate} onChange={(e) => setLeaseEndDate(e.target.value)} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setOpen(false); reset() }}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Add Property'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
