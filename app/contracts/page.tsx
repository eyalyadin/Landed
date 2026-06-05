'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
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
  Search,
  FileText,
  Building2,
  User,
  MoreHorizontal,
  Download,
  ExternalLink,
  Trash2,
  Upload,
} from 'lucide-react'
import {
  sampleContracts,
  sampleProperties,
  getPropertyById,
  getTenantsByPropertyId,
  formatDate,
  getDocumentTypeLabel,
  type Contract,
} from '@/lib/data'

function ContractCard({ contract }: { contract: Contract }) {
  const property = getPropertyById(contract.propertyId)
  const tenants = property ? getTenantsByPropertyId(property.id) : []
  const tenant = tenants[0]

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
              <DropdownMenuItem className="text-[13px]">
                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[13px]">
                <Download className="mr-2 h-3.5 w-3.5" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[13px] text-destructive">
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-1 text-xs">
          {property && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Building2 className="h-3 w-3 shrink-0" />
              <Link
                href={`/properties/${property.id}`}
                className="truncate hover:text-foreground"
              >
                {property.address}
              </Link>
            </div>
          )}
          {tenant && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">{tenant.fullName}</span>
            </div>
          )}
          {tenant && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-muted-foreground">Lease End</span>
              <span className="text-foreground">{formatDate(tenant.leaseEndDate)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function ContractsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [propertyFilter, setPropertyFilter] = useState<string>('all')

  // Filter contracts
  const filteredContracts = sampleContracts.filter(contract => {
    const property = getPropertyById(contract.propertyId)
    const tenants = property ? getTenantsByPropertyId(property.id) : []
    const tenant = tenants[0]

    const matchesSearch = contract.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property?.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant?.fullName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = typeFilter === 'all' || contract.documentType === typeFilter
    const matchesProperty = propertyFilter === 'all' || contract.propertyId === propertyFilter

    return matchesSearch && matchesType && matchesProperty
  })

  // Count by type
  const typeStats = {
    'rental-contract': sampleContracts.filter(c => c.documentType === 'rental-contract').length,
    'inventory': sampleContracts.filter(c => c.documentType === 'inventory').length,
    'deposit-document': sampleContracts.filter(c => c.documentType === 'deposit-document').length,
    'keys-record': sampleContracts.filter(c => c.documentType === 'keys-record').length,
  }

  return (
    <AppShell
      pageTitle="Contracts"
      pageAction={
        <Button size="sm" className="h-8 text-[13px]">
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          Upload Contract
        </Button>
      }
    >
      <div className="p-4 lg:p-5 space-y-5">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Card className="border-border shadow-none">
            <CardContent className="p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground leading-none mb-0.5">{sampleContracts.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-none">
            <CardContent className="p-3">
              <div>
                <p className="text-xl font-semibold text-foreground leading-none mb-0.5">{typeStats['rental-contract']}</p>
                <p className="text-xs text-muted-foreground">Rental Contracts</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-none">
            <CardContent className="p-3">
              <div>
                <p className="text-xl font-semibold text-foreground leading-none mb-0.5">{typeStats['inventory']}</p>
                <p className="text-xs text-muted-foreground">Inventories</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-none">
            <CardContent className="p-3">
              <div>
                <p className="text-xl font-semibold text-foreground leading-none mb-0.5">{typeStats['deposit-document']}</p>
                <p className="text-xs text-muted-foreground">Deposits</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-none">
            <CardContent className="p-3">
              <div>
                <p className="text-xl font-semibold text-foreground leading-none mb-0.5">{typeStats['keys-record']}</p>
                <p className="text-xs text-muted-foreground">Keys Records</p>
              </div>
            </CardContent>
          </Card>
        </div>

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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] h-8 text-[13px] bg-card">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[13px]">all</SelectItem>
              <SelectItem value="rental-contract" className="text-[13px]">Rental Contract</SelectItem>
              <SelectItem value="inventory" className="text-[13px]">Inventory</SelectItem>
              <SelectItem value="deposit-document" className="text-[13px]">Deposit</SelectItem>
              <SelectItem value="keys-record" className="text-[13px]">Keys Record</SelectItem>
              <SelectItem value="other" className="text-[13px]">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-[160px] h-8 text-[13px] bg-card">
              <SelectValue placeholder="Property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[13px]">all</SelectItem>
              {sampleProperties.map(property => (
                <SelectItem key={property.id} value={property.id} className="text-[13px]">
                  {property.address}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Contracts Table/Cards */}
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
                    {filteredContracts.map(contract => {
                      const property = getPropertyById(contract.propertyId)
                      const tenants = property ? getTenantsByPropertyId(property.id) : []
                      const tenant = tenants[0]

                      return (
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
                            {property ? (
                              <Link
                                href={`/properties/${property.id}`}
                                className="text-[13px] text-foreground hover:underline"
                              >
                                {property.address}
                              </Link>
                            ) : (
                              <span className="text-[13px] text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="py-2.5 text-[13px]">{tenant?.fullName || '-'}</TableCell>
                          <TableCell className="py-2.5 text-[13px]">{tenant ? formatDate(tenant.leaseEndDate) : '-'}</TableCell>
                          <TableCell className="py-2.5 text-[13px] text-muted-foreground">
                            {formatDate(contract.uploadedAt)}
                          </TableCell>
                          <TableCell className="py-2.5 text-right">
                            <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span className="sr-only">View</span>
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Download className="h-3.5 w-3.5" />
                                <span className="sr-only">Download</span>
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                    <span className="sr-only">More</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-32">
                                  <DropdownMenuItem className="text-[13px]">Edit</DropdownMenuItem>
                                  <DropdownMenuItem className="text-[13px] text-destructive">Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden grid gap-2">
              {filteredContracts.map(contract => (
                <ContractCard key={contract.id} contract={contract} />
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
    </AppShell>
  )
}
