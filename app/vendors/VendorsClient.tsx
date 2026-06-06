"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Plus,
  Phone,
  Mail,
  Star,
  MoreHorizontal,
  Filter,
  Wrench,
  Paintbrush,
  Zap,
  Droplets,
  Shield,
  AirVent,
  KeyRound,
  Bug,
  Sparkles,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type VendorRow = {
  id: number
  name: string
  phone: string
  email: string | null
  category: string
  serviceArea: string
  contactPerson: string | null
  rating: number | null
  activeJobs: number
  completedJobs: number
  isPreferred: boolean
  notes: string | null
}

// DB uses underscores
const CATEGORY_LABELS: Record<string, string> = {
  ac_hvac: 'AC / HVAC',
  electrician: 'Electrician',
  plumbing: 'Plumbing',
  painting: 'Painting',
  locksmith: 'Locksmith',
  handyman: 'Handyman',
  cleaning: 'Cleaning',
  appliance_repair: 'Appliance Repair',
  pest_control: 'Pest Control',
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  plumbing: <Droplets className="h-4 w-4" />,
  electrician: <Zap className="h-4 w-4" />,
  ac_hvac: <AirVent className="h-4 w-4" />,
  painting: <Paintbrush className="h-4 w-4" />,
  locksmith: <KeyRound className="h-4 w-4" />,
  cleaning: <Sparkles className="h-4 w-4" />,
  pest_control: <Bug className="h-4 w-4" />,
  handyman: <Wrench className="h-4 w-4" />,
  appliance_repair: <Wrench className="h-4 w-4" />,
}

interface Props {
  vendors: VendorRow[]
}

export function VendorsClient({ vendors }: Props) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedVendor, setSelectedVendor] = useState<VendorRow | null>(null)

  // Edit dialog state
  const [editDialog, setEditDialog] = useState<{ open: boolean; vendor: VendorRow | null }>({ open: false, vendor: null })
  const [editName, setEditName] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editCategory, setEditCategory] = useState("")
  const [editServiceArea, setEditServiceArea] = useState("")
  const [editContact, setEditContact] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [editPreferred, setEditPreferred] = useState(false)
  const [editSaving, setEditSaving] = useState(false)

  function openEdit(vendor: VendorRow) {
    setEditName(vendor.name)
    setEditPhone(vendor.phone)
    setEditEmail(vendor.email ?? "")
    setEditCategory(vendor.category)
    setEditServiceArea(vendor.serviceArea)
    setEditContact(vendor.contactPerson ?? "")
    setEditNotes(vendor.notes ?? "")
    setEditPreferred(vendor.isPreferred)
    setEditDialog({ open: true, vendor })
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editDialog.vendor) return
    setEditSaving(true)
    await fetch(`/api/vendors/${editDialog.vendor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        phone: editPhone,
        email: editEmail || undefined,
        category: editCategory,
        serviceArea: editServiceArea,
        contactPerson: editContact || undefined,
        notes: editNotes || undefined,
        isPreferred: editPreferred,
      }),
    })
    setEditSaving(false)
    setEditDialog({ open: false, vendor: null })
    setSelectedVendor(null)
    router.refresh()
  }

  async function handleDelete(vendor: VendorRow) {
    if (!confirm(`Delete vendor "${vendor.name}"? This cannot be undone.`)) return
    await fetch(`/api/vendors/${vendor.id}`, { method: "DELETE" })
    if (selectedVendor?.id === vendor.id) setSelectedVendor(null)
    router.refresh()
  }

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (CATEGORY_LABELS[vendor.category] ?? vendor.category).toLowerCase().includes(searchQuery.toLowerCase()) ||
    (vendor.email ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalActiveJobs = vendors.reduce((acc, v) => acc + v.activeJobs, 0)
  const preferredCount = vendors.filter(v => v.isPreferred).length
  const ratingsWithValue = vendors.filter(v => v.rating !== null)
  const avgRating = ratingsWithValue.length > 0
    ? ratingsWithValue.reduce((acc, v) => acc + (v.rating ?? 0), 0) / ratingsWithValue.length
    : 0

  const getStatusBadge = (isPreferred: boolean) => {
    return isPreferred
      ? <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Preferred</Badge>
      : <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Active</Badge>
  }

  const renderStars = (rating: number | null) => {
    if (rating === null) return <span className="text-sm text-muted-foreground">—</span>
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3.5 w-3.5 ${
              star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-muted-foreground">{rating.toFixed(1)}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Edit Vendor Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(v) => !v && setEditDialog({ open: false, vendor: null })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Vendor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSave} className="space-y-3 py-2">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <Input required value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Phone *</label>
                <Input required value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <Select value={editCategory} onValueChange={(v) => setEditCategory(v ?? editCategory)}>
                  <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value} className="text-[13px]">{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Service Area</label>
                <Input value={editServiceArea} onChange={(e) => setEditServiceArea(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Person</label>
              <Input value={editContact} onChange={(e) => setEditContact(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <Input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editPreferred"
                checked={editPreferred}
                onChange={(e) => setEditPreferred(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="editPreferred" className="text-sm font-medium">Preferred vendor</label>
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEditDialog({ open: false, vendor: null })}>
                Cancel
              </Button>
              <Button type="submit" disabled={editSaving} className="flex-1">
                {editSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Vendors</h1>
          <p className="text-muted-foreground">Manage your service providers and contractors</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
              <DialogDescription>
                Enter the vendor&apos;s information to create a new record.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input placeholder="Company Name" />
              <Input placeholder="Contact Person" />
              <Input placeholder="Email" type="email" />
              <Input placeholder="Phone" type="tel" />
              <Input placeholder="Specialty (e.g., Plumbing, Electrical)" />
            </div>
            <Button className="w-full">Create Vendor</Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Preferred</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{preferredCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{totalActiveJobs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {avgRating > 0 ? avgRating.toFixed(1) : '—'}
              </span>
              {avgRating > 0 && <Star className="h-5 w-5 fill-amber-400 text-amber-400" />}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search vendors by name, specialty, or email..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Vendors Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Active Jobs</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.map((vendor) => (
                <TableRow
                  key={vendor.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedVendor(vendor)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {vendor.name.split(" ").slice(0, 2).map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{vendor.name}</div>
                        <div className="text-sm text-muted-foreground">{vendor.contactPerson ?? ''}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {CATEGORY_ICONS[vendor.category] ?? <Wrench className="h-4 w-4" />}
                      <span>{CATEGORY_LABELS[vendor.category] ?? vendor.category}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Phone className="h-4 w-4" />
                      </Button>
                      {vendor.email && (
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{renderStars(vendor.rating)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{vendor.activeJobs} jobs</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(vendor.isPreferred)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedVendor(vendor) }}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(vendor) }}>
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Edit Vendor
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => { e.stopPropagation(); handleDelete(vendor) }}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Delete Vendor
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Vendor Detail Panel */}
      {selectedVendor && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {selectedVendor.name.split(" ").slice(0, 2).map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{selectedVendor.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {CATEGORY_LABELS[selectedVendor.category] ?? selectedVendor.category}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setSelectedVendor(null)}>
              Close
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Contact Information</h4>
                <div className="space-y-2">
                  {selectedVendor.contactPerson && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Contact:</span>
                      <span className="text-sm">{selectedVendor.contactPerson}</span>
                    </div>
                  )}
                  {selectedVendor.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedVendor.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedVendor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Area: {selectedVendor.serviceArea}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Performance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Rating</span>
                    {renderStars(selectedVendor.rating)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Completed Jobs</span>
                    <span className="text-sm">{selectedVendor.completedJobs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Active Jobs</span>
                    <span className="text-sm">{selectedVendor.activeJobs}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(selectedVendor)}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit Details
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(selectedVendor)}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
            {selectedVendor.notes && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">{selectedVendor.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
