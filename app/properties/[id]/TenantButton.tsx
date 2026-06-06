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
import { Pencil, UserPlus, Loader2 } from 'lucide-react'

export type TenantProp = {
  id: number
  name: string
  phone: string | null
  email: string | null
  moveInDate: string | null
  leaseEndDate: string | null
  notes: string | null
}

type UnassignedTenant = { id: number; name: string }

function isoToDateInput(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

export function TenantButton({
  propertyId,
  tenant,
}: {
  propertyId: number
  tenant: TenantProp | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Edit fields (occupied) ──
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [moveInDate, setMoveInDate] = useState('')
  const [leaseEndDate, setLeaseEndDate] = useState('')
  const [notes, setNotes] = useState('')

  // ── Add fields (vacant) ──
  const [addMode, setAddMode] = useState<'existing' | 'new'>('existing')
  const [unassigned, setUnassigned] = useState<UnassignedTenant[]>([])
  const [loadingTenants, setLoadingTenants] = useState(false)
  const [selectedTenantId, setSelectedTenantId] = useState('')
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')

  useEffect(() => {
    if (!open) return
    if (tenant) {
      setName(tenant.name)
      setPhone(tenant.phone ?? '')
      setEmail(tenant.email ?? '')
      setMoveInDate(isoToDateInput(tenant.moveInDate))
      setLeaseEndDate(isoToDateInput(tenant.leaseEndDate))
      setNotes(tenant.notes ?? '')
    } else {
      setLoadingTenants(true)
      fetch('/api/tenants')
        .then(r => r.json())
        .then((data: Array<{ id: number; name: string; property_address: string | null }>) => {
          setUnassigned(data.filter(t => !t.property_address).map(t => ({ id: t.id, name: t.name })))
        })
        .catch(() => {})
        .finally(() => setLoadingTenants(false))
    }
  }, [open, tenant])

  function reset() {
    setName(''); setPhone(''); setEmail(''); setMoveInDate(''); setLeaseEndDate(''); setNotes('')
    setAddMode('existing'); setSelectedTenantId('')
    setNewName(''); setNewPhone(''); setNewEmail('')
    setError(null); setSaving(false)
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!tenant) return
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/tenants/${tenant.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name || undefined,
        phone: phone || undefined,
        email: email || undefined,
        moveInDate: moveInDate || undefined,
        leaseEndDate: leaseEndDate || undefined,
        notes: notes || undefined,
      }),
    })
    setSaving(false)
    if (res.ok) { setOpen(false); reset(); router.refresh() }
    else { const d = await res.json().catch(() => ({})); setError(d.error ?? 'Failed to save') }
  }

  async function submitAssign(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTenantId) return
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/tenants/${selectedTenantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId }),
    })
    setSaving(false)
    if (res.ok) { setOpen(false); reset(); router.refresh() }
    else { const d = await res.json().catch(() => ({})); setError(d.error ?? 'Failed to assign tenant') }
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName) return
    setSaving(true)
    setError(null)
    const res = await fetch('/api/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newName,
        phone: newPhone || undefined,
        email: newEmail || undefined,
        propertyId,
      }),
    })
    setSaving(false)
    if (res.ok) { setOpen(false); reset(); router.refresh() }
    else { const d = await res.json().catch(() => ({})); setError(d.error ?? 'Failed to create tenant') }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); setOpen(v) }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-[12px]">
          {tenant
            ? <><Pencil className="mr-1 h-3 w-3" />Edit Tenant</>
            : <><UserPlus className="mr-1 h-3 w-3" />Add Tenant</>
          }
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{tenant ? 'Edit Tenant' : 'Add Tenant'}</DialogTitle>
        </DialogHeader>

        {tenant ? (
          /* ── EDIT FORM ── */
          <form onSubmit={submitEdit} className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050-1234567" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tenant@example.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Move-in Date</label>
                <Input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Lease End</label>
                <Input type="date" value={leaseEndDate} onChange={(e) => setLeaseEndDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => { setOpen(false); reset() }}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Save Changes'}
              </Button>
            </div>
          </form>
        ) : (
          /* ── ADD TENANT (VACANT) ── */
          <div className="py-2 space-y-4">
            {/* Mode toggle */}
            <div className="flex rounded-md border border-border overflow-hidden text-[13px]">
              <button
                type="button"
                onClick={() => setAddMode('existing')}
                className={`flex-1 py-1.5 text-center transition-colors ${addMode === 'existing' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'}`}
              >
                Assign existing
              </button>
              <button
                type="button"
                onClick={() => setAddMode('new')}
                className={`flex-1 py-1.5 text-center transition-colors ${addMode === 'new' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'}`}
              >
                Create new
              </button>
            </div>

            {addMode === 'existing' ? (
              <form onSubmit={submitAssign} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tenant *</label>
                  {loadingTenants ? (
                    <div className="h-9 flex items-center text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />Loading…
                    </div>
                  ) : unassigned.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No unassigned tenants — use &quot;Create new&quot; instead.</p>
                  ) : (
                    <Select value={selectedTenantId} onValueChange={(v) => setSelectedTenantId(v ?? '')}>
                      <SelectTrigger className="h-9 text-[13px]">
                        <SelectValue placeholder="Select tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {unassigned.map(t => (
                          <SelectItem key={t.id} value={String(t.id)} className="text-[13px]">
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => { setOpen(false); reset() }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving || !selectedTenantId} className="flex-1">
                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Assign Tenant'}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={submitCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <Input required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. David Cohen" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <Input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="050-1234567" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="tenant@example.com" />
                  </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => { setOpen(false); reset() }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving || !newName} className="flex-1">
                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Create Tenant'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
