// Frontend data types and formatters.
// Sample arrays and mock data have been removed — all pages now query the database.

export type PaymentStatus = 'paid' | 'due-soon' | 'overdue' | 'partial' | 'pending'
export type OccupancyStatus = 'occupied' | 'vacant'
export type TaskStatus = 'new' | 'in-progress' | 'waiting-on-tenant' | 'waiting-on-vendor' | 'completed'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskCategory = 'repair' | 'payment-followup' | 'contract-renewal' | 'tenant-issue' | 'inspection' | 'maintenance'
export type DocumentType = 'rental-contract' | 'inventory' | 'deposit-document' | 'keys-record' | 'other'
export type VendorCategory = 'ac-hvac' | 'electrician' | 'plumbing' | 'painting' | 'locksmith' | 'handyman' | 'cleaning' | 'appliance-repair' | 'pest-control'
export type PropertyType = 'apartment' | 'house' | 'condo' | 'townhouse' | 'commercial'
export type MessageUrgency = 'normal' | 'urgent'
export type ConversationStatus = 'open' | 'resolved'
export type CalendarEventType = 'rent-due' | 'lease-start' | 'lease-end' | 'renewal-reminder' | 'scheduled-repair' | 'move-in' | 'move-out' | 'inspection'

export interface Property {
  id: string
  address: string
  city: string
  propertyType: PropertyType
  unitLabel?: string
  occupancyStatus: OccupancyStatus
  tenantIds: string[]
  monthlyRent: number
  rentCurrency: string
  nextPaymentDueDate: string
  paymentStatus: PaymentStatus
  leaseStartDate: string
  leaseEndDate: string
  openTaskCount: number
  openRepairCount: number
  contractIds: string[]
  vendorIds: string[]
  managerName?: string
  notes?: string
}

export interface Tenant {
  id: string
  fullName: string
  phone: string
  email: string
  propertyId: string
  moveInDate: string
  leaseEndDate: string
  paymentMethod: string
  paymentStatus: PaymentStatus
  contractStatus: 'active' | 'expiring-soon' | 'missing'
  keysAccessNotes?: string
  messageThreadId: string
  notes?: string
}

export interface Payment {
  id: string
  propertyId: string
  tenantId: string
  amount: number
  currency: string
  type: 'rent' | 'deposit' | 'fee'
  status: PaymentStatus
  dueDate: string
  paidDate?: string
  source?: string
  reference?: string
  notes?: string
}

export interface Contract {
  id: string
  documentName: string
  documentType: DocumentType
  propertyId: string
  uploadedAt: string
}

export interface MessageThread {
  id: string
  tenantId: string
  propertyId: string
  lastMessagePreview: string
  lastMessageAt: string
  unreadCount: number
  urgency: MessageUrgency
  status: ConversationStatus
  summary?: string
  suggestedNextAction?: string
}

export interface Message {
  id: string
  threadId: string
  senderType: 'tenant' | 'landlord'
  senderName: string
  body: string
  createdAt: string
  attachments?: string[]
  isInternalNote: boolean
}

export interface Task {
  id: string
  title: string
  propertyId: string
  tenantId?: string
  category: TaskCategory
  priority: TaskPriority
  dueDate: string
  status: TaskStatus
  contractorName?: string
  sourceThreadId?: string
  notes?: string
  createdAt: string
  completedAt?: string
}

export interface Vendor {
  id: string
  name: string
  phone: string
  email?: string
  category: VendorCategory
  serviceArea: string
  notes?: string
  isPreferred: boolean
}

export interface CalendarEvent {
  id: string
  title: string
  eventType: CalendarEventType
  propertyId?: string
  tenantId?: string
  taskId?: string
  contractId?: string
  start: string
  end?: string
  status?: string
  notes?: string
}

// ─── Formatters ───────────────────────────────────────────────────────────────

export function formatCurrency(amount: number, currency: string = 'ILS'): string {
  return new Intl.NumberFormat('en-IL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatDate(dateString: string): string {
  if (!dateString) return '—'
  const d = new Date(dateString)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}` // dd/MM/yyyy per spec
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInHours < 48) return 'Yesterday'
  return formatDate(dateString)
}

export function getPaymentStatusColor(status: PaymentStatus): string {
  switch (status) {
    case 'paid': return 'success'
    case 'due-soon': return 'warning'
    case 'overdue': return 'destructive'
    case 'partial': return 'warning'
    case 'pending': return 'secondary'
    default: return 'secondary'
  }
}

export function getTaskStatusLabel(status: TaskStatus): string {
  switch (status) {
    case 'new': return 'New'
    case 'in-progress': return 'In progress'
    case 'waiting-on-tenant': return 'Waiting on tenant'
    case 'waiting-on-vendor': return 'Waiting on vendor'
    case 'completed': return 'Completed'
    default: return status
  }
}

export function getTaskPriorityColor(priority: TaskPriority): string {
  switch (priority) {
    case 'urgent': return 'destructive'
    case 'high': return 'warning'
    case 'medium': return 'secondary'
    case 'low': return 'secondary'
    default: return 'secondary'
  }
}

export function getVendorCategoryLabel(category: VendorCategory): string {
  switch (category) {
    case 'ac-hvac': return 'AC / HVAC'
    case 'electrician': return 'Electrician'
    case 'plumbing': return 'Plumbing'
    case 'painting': return 'Painting'
    case 'locksmith': return 'Locksmith'
    case 'handyman': return 'Handyman'
    case 'cleaning': return 'Cleaning'
    case 'appliance-repair': return 'Appliance repair'
    case 'pest-control': return 'Pest control'
    default: return category
  }
}

export function getDocumentTypeLabel(type: DocumentType): string {
  switch (type) {
    case 'rental-contract': return 'Rental contract'
    case 'inventory': return 'Inventory'
    case 'deposit-document': return 'Deposit document'
    case 'keys-record': return 'Keys record'
    case 'other': return 'Other'
    default: return type
  }
}
