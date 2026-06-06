'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Search,
  FileText,
  Building2,
  User,
  MoreHorizontal,
  Download,
  Trash2,
  Upload,
  Pencil,
  Loader2,
} from 'lucide-react'
import { formatDate } from '@/lib/data'

export type ContractRow = {
  id: number
  documentName: string
  documentType: string
  propertyId: number | null
  propertyAddress: string | null
  tenantName: string | null
  leaseEndDate: string | null
  uploadedAt: string
  hasFile: boolean
}

export type PropertyOption = {
  id: number
  address: string
}

function getDocumentTypeLabel(type: string): string {
  switch (type) {
    case 'rental_contract': return 'Rental contract'
    case 'inventory': return 'Inventory'
    case 'deposit_document': return 'Deposit document'
    case 'keys_record': return 'Keys record'
    case 'other': return 'Other'
    default: return type
  }
}

function ContractCard({
  contract,
  onEdit,
  onDelete,
}: {
  contract: ContractRow
  onEdit: (c: ContractRow) => void
  onDelete: (c: ContractRow) => void
}) {
  return (
    <Card className="group border-border shadow-none hover:shadow-sm transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-foreground truncate">{contract.documentName}</p>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground mt-0.5">
                {getDocumentTypeLabel(contract.documentType)}
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-3.5 w-3.5" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                className="text-[13px]"
                disabled={!contract.hasFile}
                onClick={() => contract.hasFile && window.open(`/api/documents/${contract.id}/file`, '_blank')}
              >
                <Download className="mr-2 h-3.5 w-3.5" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[13px]" onClick={() => onEdit(contract)}>
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[13px] text-destructive" onClick={() => onDelete(contract)}>
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-1 text-xs">
          {contract.propertyId && contract.propertyAddress && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Building2 className="h-3 w-3 shrink-0" />
              <Link
                href={`/properties/${contract.propertyId}`}
                className="truncate hover:text-foreground"
              >
                {contract.propertyAddress}
              </Link>
            </div>
          )}
          {contract.tenantName && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">{contract.tenantName}</span>
            </div>
          )}
          {contract.leaseEndDate && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-muted-foreground">Lease End</span>
              <span className="text-foreground">{formatDate(contract.leaseEndDate)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface Props {
  contracts: ContractRow[]
  properties: PropertyOption[]
}

export function ContractsClient({ contracts, properties }: Props) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [propertyFilter, setPropertyFilter] = useState<string>('all')

  const [editDialog, setEditDialog] = useState<{ open: boolean; contract: ContractRow | null }>({ open: false, contract: null })
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  function openEdit(contract: ContractRow) {
    setEditName(contract.documentName)
    setEditType(contract.documentType)
    setEditDialog({ open: true, contract })
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editDialog.contract) return
    setEditSaving(true)
    await fetch(`/api/documents/${editDialog.contract.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentName: editName, documentType: editType }),
    })
    setEditSaving(false)
    setEditDialog({ open: false, contract: null })
    router.refresh()
  }

  async function handleDelete(contract: ContractRow) {
    if (!confirm(`Delete "${contract.documentName}"? This cannot be undone.`)) return
    await fetch(`/api/documents/${contract.id}`, { method: 'DELETE' })
    router.refresh()
  }

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = !searchQuery ||
      contract.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contract.propertyAddress ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contract.tenantName ?? '').toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = typeFilter === 'all' || contract.documentType === typeFilter
    const matchesProperty = propertyFilter === 'all' || String(contract.propertyId) === propertyFilter

    return matchesSearch && matchesType && matchesProperty
  })

  return (
    <div className="p-4 lg:p-5 space-y-5">
      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(v) => !v && setEditDialog({ open: false, contract: null })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSave} className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <Input required value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <Select value={editType} onValueChange={(v) => setEditType(v ?? editType)}>
                <SelectTrigger className="h-9 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rental_contract" className="text-[13px]">Rental Contract</SelectItem>
                  <SelectItem value="inventory" className="text-[13px]">Inventory</SelectItem>
                  <SelectItem value="deposit_document" className="text-[13px]">Deposit Document</SelectItem>
                  <SelectItem value="keys_record" className="text-[13px]">Keys Record</SelectItem>
                  <SelectItem value="other" className="text-[13px]">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEditDialog({ open: false, contract: null })}>
                Cancel
              </Button>
              <Button type="submit" disabled={editSaving} className="flex-1">
                {editSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-[13px] bg-card"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? 'all')}>
          <SelectTrigger className="w-[140px] h-8 text-[13px] bg-card">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-[13px]">All Types</SelectItem>
            <SelectItem value="rental_contract" className="text-[13px]">Rental Contract</SelectItem>
            <SelectItem value="inventory" className="text-[13px]">Inventory</SelectItem>
            <SelectItem value="deposit_document" className="text-[13px]">Deposit</SelectItem>
            <SelectItem value="keys_record" className="text-[13px]">Keys Record</SelectItem>
            <SelectItem value="other" className="text-[13px]">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={propertyFilter} onValueChange={(v) => setPropertyFilter(v ?? 'all')}>
          <SelectTrigger className="w-[160px] h-8 text-[13px] bg-card">
            <SelectValue placeholder="Property" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-[13px]">All Properties</SelectItem>
            {properties.map(property => (
              <SelectItem key={property.id} value={String(property.id)} className="text-[13px]">
                {property.address}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contracts Table / Cards */}
      {filteredContracts.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Card className="border-border shadow-none">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-medium">Document Name</TableHead>
                    <TableHead className="text-xs font-medium">Type</TableHead>
                    <TableHead className="text-xs font-medium">Property</TableHead>
                    <TableHead className="text-xs font-medium">Tenant</TableHead>
                    <TableHead className="text-xs font-medium">Lease End</TableHead>
                    <TableHead className="text-xs font-medium">Uploaded</TableHead>
                    <TableHead className="text-xs font-medium text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map(contract => (
                    <TableRow key={contract.id} className="group">
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-[13px] font-medium text-foreground">{contract.documentName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                          {getDocumentTypeLabel(contract.documentType)}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5">
                        {contract.propertyId && contract.propertyAddress ? (
                          <Link
                            href={`/properties/${contract.propertyId}`}
                            className="text-[13px] text-foreground hover:underline"
                          >
                            {contract.propertyAddress}
                          </Link>
                        ) : (
                          <span className="text-[13px] text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5 text-[13px]">{contract.tenantName ?? '-'}</TableCell>
                      <TableCell className="py-2.5 text-[13px]">
                        {contract.leaseEndDate ? formatDate(contract.leaseEndDate) : '-'}
                      </TableCell>
                      <TableCell className="py-2.5 text-[13px] text-muted-foreground">
                        {formatDate(contract.uploadedAt)}
                      </TableCell>
                      <TableCell className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            disabled={!contract.hasFile}
                            onClick={() => contract.hasFile && window.open(`/api/documents/${contract.id}/file`, '_blank')}
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span className="sr-only">Download</span>
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => openEdit(contract)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(contract)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden grid gap-2">
            {filteredContracts.map(contract => (
              <ContractCard
                key={contract.id}
                contract={contract}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      ) : (
        <Card className="border-border shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-sm font-medium text-foreground mb-1">No contracts found</h3>
            <p className="text-xs text-muted-foreground mb-3 text-center">
              {searchQuery || typeFilter !== 'all' || propertyFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by uploading your first contract'}
            </p>
            <Button size="sm" className="h-8 text-[13px]">
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Upload Contract
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
