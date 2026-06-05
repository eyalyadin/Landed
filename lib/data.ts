// Frontend data types based on SIP specification
// These are frontend-only types with sample data.
// TODO: Replace helper functions with real Prisma data-access calls (Phase B).

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

// ─── Sample Data ─────────────────────────────────────────────────────────────

export const sampleProperties: Property[] = [
  {
    id: 'prop-1',
    address: '123 Oak Street, Unit 4A',
    city: 'Tel Aviv',
    propertyType: 'apartment',
    unitLabel: '4A',
    occupancyStatus: 'occupied',
    tenantIds: ['tenant-1'],
    monthlyRent: 6500,
    rentCurrency: 'ILS',
    nextPaymentDueDate: '2026-07-01',
    paymentStatus: 'paid',
    leaseStartDate: '2025-03-01',
    leaseEndDate: '2026-02-28',
    openTaskCount: 1,
    openRepairCount: 1,
    contractIds: ['contract-1', 'contract-2'],
    vendorIds: ['vendor-1'],
    managerName: 'Building Committee',
    notes: 'Corner unit with excellent natural light'
  },
  {
    id: 'prop-2',
    address: '456 Pine Avenue',
    city: 'Haifa',
    propertyType: 'house',
    occupancyStatus: 'occupied',
    tenantIds: ['tenant-2'],
    monthlyRent: 7200,
    rentCurrency: 'ILS',
    nextPaymentDueDate: '2026-07-01',
    paymentStatus: 'overdue',
    leaseStartDate: '2024-08-01',
    leaseEndDate: '2026-07-31',
    openTaskCount: 2,
    openRepairCount: 2,
    contractIds: ['contract-3'],
    vendorIds: [],
    notes: 'Private house with garden'
  },
  {
    id: 'prop-3',
    address: '789 Market Street, Suite 202',
    city: 'Tel Aviv',
    propertyType: 'condo',
    unitLabel: '202',
    occupancyStatus: 'occupied',
    tenantIds: ['tenant-3'],
    monthlyRent: 8000,
    rentCurrency: 'ILS',
    nextPaymentDueDate: '2026-07-01',
    paymentStatus: 'due-soon',
    leaseStartDate: '2025-01-01',
    leaseEndDate: '2025-12-31',
    openTaskCount: 0,
    openRepairCount: 0,
    contractIds: ['contract-4', 'contract-5'],
    vendorIds: ['vendor-2'],
    managerName: 'Management Company'
  },
  {
    id: 'prop-4',
    address: '321 Elm Drive',
    city: 'Jerusalem',
    propertyType: 'apartment',
    occupancyStatus: 'vacant',
    tenantIds: [],
    monthlyRent: 5800,
    rentCurrency: 'ILS',
    nextPaymentDueDate: '',
    paymentStatus: 'pending',
    leaseStartDate: '',
    leaseEndDate: '',
    openTaskCount: 3,
    openRepairCount: 1,
    contractIds: [],
    vendorIds: [],
    notes: 'Recently renovated, ready for new tenant'
  },
  {
    id: 'prop-5',
    address: '555 Bay View Terrace, Unit 8',
    city: 'Herzliya',
    propertyType: 'apartment',
    unitLabel: '8',
    occupancyStatus: 'occupied',
    tenantIds: ['tenant-4'],
    monthlyRent: 5500,
    rentCurrency: 'ILS',
    nextPaymentDueDate: '2026-07-01',
    paymentStatus: 'paid',
    leaseStartDate: '2025-06-01',
    leaseEndDate: '2026-05-31',
    openTaskCount: 0,
    openRepairCount: 0,
    contractIds: ['contract-6'],
    vendorIds: [],
    managerName: 'Management Company'
  },
  {
    id: 'prop-6',
    address: '888 Mission Boulevard',
    city: 'Beer Sheva',
    propertyType: 'house',
    occupancyStatus: 'occupied',
    tenantIds: ['tenant-5'],
    monthlyRent: 4200,
    rentCurrency: 'ILS',
    nextPaymentDueDate: '2026-07-01',
    paymentStatus: 'partial',
    leaseStartDate: '2024-12-01',
    leaseEndDate: '2025-11-30',
    openTaskCount: 1,
    openRepairCount: 0,
    contractIds: ['contract-7'],
    vendorIds: ['vendor-3']
  }
]

export const sampleTenants: Tenant[] = [
  {
    id: 'tenant-1',
    fullName: 'Dana Levy',
    phone: '+972501112233',
    email: 'dana.levi@email.com',
    propertyId: 'prop-1',
    moveInDate: '2025-03-01',
    leaseEndDate: '2026-02-28',
    paymentMethod: 'Bank transfer',
    paymentStatus: 'paid',
    contractStatus: 'active',
    keysAccessNotes: '2 keys, remote',
    messageThreadId: 'thread-1',
    notes: 'Quiet tenant, pays on time'
  },
  {
    id: 'tenant-2',
    fullName: 'Yossi Cohen',
    phone: '+972502223344',
    email: 'yossi.cohen@email.com',
    propertyId: 'prop-2',
    moveInDate: '2024-08-01',
    leaseEndDate: '2026-07-31',
    paymentMethod: 'Cheque',
    paymentStatus: 'overdue',
    contractStatus: 'active',
    keysAccessNotes: '3 keys, parking remote',
    messageThreadId: 'thread-2',
    notes: 'Follow up on late payment'
  },
  {
    id: 'tenant-3',
    fullName: 'Sarah Johnson',
    phone: '+972503334455',
    email: 'sarah.j@email.com',
    propertyId: 'prop-3',
    moveInDate: '2025-01-01',
    leaseEndDate: '2025-12-31',
    paymentMethod: 'Standing order',
    paymentStatus: 'due-soon',
    contractStatus: 'expiring-soon',
    keysAccessNotes: '2 keys, parking card',
    messageThreadId: 'thread-3'
  },
  {
    id: 'tenant-4',
    fullName: 'Oren Barak',
    phone: '+972504445566',
    email: 'oren.barak@email.com',
    propertyId: 'prop-5',
    moveInDate: '2025-06-01',
    leaseEndDate: '2026-05-31',
    paymentMethod: 'Bank transfer',
    paymentStatus: 'paid',
    contractStatus: 'active',
    keysAccessNotes: '2 keys',
    messageThreadId: 'thread-4',
    notes: 'New tenant, quick to respond'
  },
  {
    id: 'tenant-5',
    fullName: 'Michal Shapira',
    phone: '+972505556677',
    email: 'michal.s@email.com',
    propertyId: 'prop-6',
    moveInDate: '2024-12-01',
    leaseEndDate: '2025-11-30',
    paymentMethod: 'Cheque',
    paymentStatus: 'partial',
    contractStatus: 'active',
    keysAccessNotes: '4 keys, alarm code: 1234',
    messageThreadId: 'thread-5',
    notes: 'Paid partially, awaiting remainder'
  }
]

export const samplePayments: Payment[] = [
  {
    id: 'pay-1',
    propertyId: 'prop-1',
    tenantId: 'tenant-1',
    amount: 6500,
    currency: 'ILS',
    type: 'rent',
    status: 'paid',
    dueDate: '2026-06-01',
    paidDate: '2026-05-28',
    source: 'Bank transfer',
    reference: 'TXN-2026-0528-001'
  },
  {
    id: 'pay-2',
    propertyId: 'prop-2',
    tenantId: 'tenant-2',
    amount: 7200,
    currency: 'ILS',
    type: 'rent',
    status: 'overdue',
    dueDate: '2026-06-01'
  },
  {
    id: 'pay-3',
    propertyId: 'prop-3',
    tenantId: 'tenant-3',
    amount: 8000,
    currency: 'ILS',
    type: 'rent',
    status: 'due-soon',
    dueDate: '2026-07-01'
  },
  {
    id: 'pay-4',
    propertyId: 'prop-5',
    tenantId: 'tenant-4',
    amount: 5500,
    currency: 'ILS',
    type: 'rent',
    status: 'paid',
    dueDate: '2026-06-01',
    paidDate: '2026-06-01',
    source: 'Bank transfer'
  },
  {
    id: 'pay-5',
    propertyId: 'prop-6',
    tenantId: 'tenant-5',
    amount: 2000,
    currency: 'ILS',
    type: 'rent',
    status: 'partial',
    dueDate: '2026-06-01',
    paidDate: '2026-06-03',
    notes: 'Partial payment — ₪2,000 of ₪4,200'
  },
  {
    id: 'pay-6',
    propertyId: 'prop-1',
    tenantId: 'tenant-1',
    amount: 6500,
    currency: 'ILS',
    type: 'rent',
    status: 'paid',
    dueDate: '2026-05-01',
    paidDate: '2026-04-30',
    source: 'Bank transfer'
  },
  {
    id: 'pay-7',
    propertyId: 'prop-1',
    tenantId: 'tenant-1',
    amount: 13000,
    currency: 'ILS',
    type: 'deposit',
    status: 'paid',
    dueDate: '2025-03-01',
    paidDate: '2025-02-28',
    source: 'Bank transfer',
    notes: 'Security deposit — 2 months'
  }
]

export const sampleContracts: Contract[] = [
  { id: 'contract-1', documentName: 'Rental Contract — 123 Oak St 4A', documentType: 'rental-contract', propertyId: 'prop-1', uploadedAt: '2025-03-01' },
  { id: 'contract-2', documentName: 'Entry Inventory — 123 Oak St 4A', documentType: 'inventory', propertyId: 'prop-1', uploadedAt: '2025-03-01' },
  { id: 'contract-3', documentName: 'Rental Contract — 456 Pine Ave', documentType: 'rental-contract', propertyId: 'prop-2', uploadedAt: '2024-08-01' },
  { id: 'contract-4', documentName: 'Rental Contract — 789 Market St 202', documentType: 'rental-contract', propertyId: 'prop-3', uploadedAt: '2025-01-01' },
  { id: 'contract-5', documentName: 'Deposit Receipt — 789 Market St', documentType: 'deposit-document', propertyId: 'prop-3', uploadedAt: '2025-01-01' },
  { id: 'contract-6', documentName: 'Rental Contract — 555 Bay View Unit 8', documentType: 'rental-contract', propertyId: 'prop-5', uploadedAt: '2025-06-01' },
  { id: 'contract-7', documentName: 'Rental Contract — 888 Mission Blvd', documentType: 'rental-contract', propertyId: 'prop-6', uploadedAt: '2024-12-01' },
  { id: 'contract-8', documentName: 'Keys Handover — 123 Oak St 4A', documentType: 'keys-record', propertyId: 'prop-1', uploadedAt: '2025-03-01' }
]

export const sampleMessageThreads: MessageThread[] = [
  {
    id: 'thread-1',
    tenantId: 'tenant-1',
    propertyId: 'prop-1',
    lastMessagePreview: 'Thanks for the quick AC repair!',
    lastMessageAt: '2026-06-04T14:30:00Z',
    unreadCount: 0,
    urgency: 'normal',
    status: 'resolved',
    summary: 'AC repair completed successfully',
    suggestedNextAction: 'No action required'
  },
  {
    id: 'thread-2',
    tenantId: 'tenant-2',
    propertyId: 'prop-2',
    lastMessagePreview: "I'll pay the rent by Friday, I had an unexpected expense",
    lastMessageAt: '2026-06-05T09:15:00Z',
    unreadCount: 1,
    urgency: 'urgent',
    status: 'open',
    summary: 'Tenant requesting payment deferral due to unexpected expense',
    suggestedNextAction: 'Confirm payment date and document the agreement'
  },
  {
    id: 'thread-3',
    tenantId: 'tenant-3',
    propertyId: 'prop-3',
    lastMessagePreview: 'Can we discuss renewing the lease? I\'d like to stay another year.',
    lastMessageAt: '2026-06-03T16:45:00Z',
    unreadCount: 1,
    urgency: 'normal',
    status: 'open',
    summary: 'Lease renewal inquiry — tenant wants to extend',
    suggestedNextAction: 'Schedule lease renewal discussion'
  },
  {
    id: 'thread-4',
    tenantId: 'tenant-4',
    propertyId: 'prop-5',
    lastMessagePreview: 'Moved in, everything looks great!',
    lastMessageAt: '2026-06-01T10:00:00Z',
    unreadCount: 0,
    urgency: 'normal',
    status: 'resolved'
  },
  {
    id: 'thread-5',
    tenantId: 'tenant-5',
    propertyId: 'prop-6',
    lastMessagePreview: 'The solar boiler is making strange noises again',
    lastMessageAt: '2026-06-05T08:30:00Z',
    unreadCount: 2,
    urgency: 'urgent',
    status: 'open',
    summary: 'Solar boiler fault reported — repair may be needed',
    suggestedNextAction: 'Schedule a plumber visit'
  }
]

export const sampleMessages: Message[] = [
  {
    id: 'msg-1',
    threadId: 'thread-2',
    senderType: 'tenant',
    senderName: 'Yossi Cohen',
    body: "Hi, I wanted to update you about the rent. I had an unexpected car repair this month, it's been a bit tough.",
    createdAt: '2026-06-04T10:00:00Z',
    isInternalNote: false
  },
  {
    id: 'msg-2',
    threadId: 'thread-2',
    senderType: 'landlord',
    senderName: 'Landlord',
    body: 'Hi Yossi, thanks for letting me know. When do you expect to pay?',
    createdAt: '2026-06-04T14:30:00Z',
    isInternalNote: false
  },
  {
    id: 'msg-3',
    threadId: 'thread-2',
    senderType: 'tenant',
    senderName: 'Yossi Cohen',
    body: "I'll pay the rent by Friday, I had an unexpected expense",
    createdAt: '2026-06-05T09:15:00Z',
    isInternalNote: false
  },
  {
    id: 'msg-4',
    threadId: 'thread-3',
    senderType: 'tenant',
    senderName: 'Sarah Johnson',
    body: 'Hi! My lease is coming up at the end of the year. Can we discuss renewing the lease? I\'d like to stay another year.',
    createdAt: '2026-06-03T16:45:00Z',
    isInternalNote: false
  },
  {
    id: 'msg-5',
    threadId: 'thread-5',
    senderType: 'tenant',
    senderName: 'Michal Shapira',
    body: "Good morning. The solar boiler started making banging noises last night. It's still working but I'm worried it's a problem.",
    createdAt: '2026-06-05T07:45:00Z',
    isInternalNote: false
  },
  {
    id: 'msg-6',
    threadId: 'thread-5',
    senderType: 'tenant',
    senderName: 'Michal Shapira',
    body: 'The solar boiler is making strange noises again',
    createdAt: '2026-06-05T08:30:00Z',
    isInternalNote: false
  }
]

export const sampleTasks: Task[] = [
  {
    id: 'task-1',
    title: 'AC repair — making noise',
    propertyId: 'prop-1',
    tenantId: 'tenant-1',
    category: 'repair',
    priority: 'high',
    dueDate: '2026-06-06',
    status: 'in-progress',
    contractorName: 'Cool Air HVAC',
    notes: 'Tenant reported noise from the AC unit',
    createdAt: '2026-06-02T10:00:00Z'
  },
  {
    id: 'task-2',
    title: 'Follow up on late rent payment',
    propertyId: 'prop-2',
    tenantId: 'tenant-2',
    category: 'payment-followup',
    priority: 'urgent',
    dueDate: '2026-06-07',
    status: 'waiting-on-tenant',
    sourceThreadId: 'thread-2',
    notes: "Tenant said he'll pay by Friday",
    createdAt: '2026-06-04T15:00:00Z'
  },
  {
    id: 'task-3',
    title: 'Fix leaking kitchen tap',
    propertyId: 'prop-2',
    tenantId: 'tenant-2',
    category: 'repair',
    priority: 'medium',
    dueDate: '2026-06-10',
    status: 'new',
    notes: 'Kitchen sink tap is dripping',
    createdAt: '2026-06-03T09:00:00Z'
  },
  {
    id: 'task-4',
    title: 'Lease renewal discussion',
    propertyId: 'prop-3',
    tenantId: 'tenant-3',
    category: 'contract-renewal',
    priority: 'medium',
    dueDate: '2026-06-15',
    status: 'new',
    sourceThreadId: 'thread-3',
    notes: 'Tenant wants to renew for another year',
    createdAt: '2026-06-03T17:00:00Z'
  },
  {
    id: 'task-5',
    title: 'Prepare apartment for new tenant',
    propertyId: 'prop-4',
    category: 'maintenance',
    priority: 'high',
    dueDate: '2026-06-20',
    status: 'in-progress',
    notes: 'Deep clean, touch-up painting, replace bedroom carpet',
    createdAt: '2026-05-28T11:00:00Z'
  },
  {
    id: 'task-6',
    title: 'Replace smoke detector batteries',
    propertyId: 'prop-4',
    category: 'maintenance',
    priority: 'medium',
    dueDate: '2026-06-12',
    status: 'new',
    createdAt: '2026-06-01T08:00:00Z'
  },
  {
    id: 'task-7',
    title: 'Fix broken gate handle',
    propertyId: 'prop-4',
    category: 'repair',
    priority: 'low',
    dueDate: '2026-06-25',
    status: 'new',
    createdAt: '2026-05-30T14:00:00Z'
  },
  {
    id: 'task-8',
    title: 'Inspect solar boiler',
    propertyId: 'prop-6',
    tenantId: 'tenant-5',
    category: 'repair',
    priority: 'high',
    dueDate: '2026-06-06',
    status: 'new',
    sourceThreadId: 'thread-5',
    notes: 'Making banging noises — arrange plumber',
    createdAt: '2026-06-05T08:45:00Z'
  },
  {
    id: 'task-9',
    title: 'Annual inspection',
    propertyId: 'prop-1',
    category: 'inspection',
    priority: 'low',
    dueDate: '2026-07-15',
    status: 'new',
    notes: 'Routine annual property inspection',
    createdAt: '2026-06-01T09:00:00Z'
  }
]

export const sampleVendors: Vendor[] = [
  { id: 'vendor-1', name: 'Cool Air HVAC', phone: '+972501001001', email: 'service@coolair.co.il', category: 'ac-hvac', serviceArea: 'Greater Tel Aviv', notes: 'Quick response, good rates. Ask for Mickey.', isPreferred: true },
  { id: 'vendor-2', name: 'Premium Plumbing Ltd', phone: '+972502002002', email: 'info@plumbing.co.il', category: 'plumbing', serviceArea: 'Tel Aviv, Haifa', notes: '24/7 emergency service', isPreferred: true },
  { id: 'vendor-3', name: 'AllFix Handyman', phone: '+972503003003', category: 'handyman', serviceArea: 'Jerusalem', notes: 'Good for small repairs', isPreferred: false },
  { id: 'vendor-4', name: 'Barak Electric', phone: '+972504004004', email: 'jobs@barak.co.il', category: 'electrician', serviceArea: 'Nationwide', isPreferred: true },
  { id: 'vendor-5', name: 'Fresh Paint', phone: '+972505005005', email: 'quotes@fresh.co.il', category: 'painting', serviceArea: 'Central', notes: 'Used for apartment turnovers. Quality work.', isPreferred: false },
  { id: 'vendor-6', name: 'Quick Locksmith', phone: '+972506006006', category: 'locksmith', serviceArea: 'Tel Aviv', notes: 'Available 24/7', isPreferred: true },
  { id: 'vendor-7', name: 'Silver Clean', phone: '+972507007007', email: 'book@silver.co.il', category: 'cleaning', serviceArea: 'Central & South', notes: 'Deep cleaning for apartment vacations', isPreferred: false },
  { id: 'vendor-8', name: 'Appliance Experts', phone: '+972508008008', category: 'appliance-repair', serviceArea: 'Nationwide', isPreferred: false }
]

export const sampleCalendarEvents: CalendarEvent[] = [
  { id: 'event-1', title: 'Rent collection — all properties', eventType: 'rent-due', start: '2026-07-01', notes: 'Monthly rent collection' },
  { id: 'event-2', title: 'Lease ends — 789 Market St 202', eventType: 'lease-end', propertyId: 'prop-3', tenantId: 'tenant-3', start: '2025-12-31', notes: 'Sarah Johnson — discuss renewal' },
  { id: 'event-3', title: 'Lease ends — 888 Mission Blvd', eventType: 'lease-end', propertyId: 'prop-6', tenantId: 'tenant-5', start: '2025-11-30', notes: 'Michal Shapira — lease expiring' },
  { id: 'event-4', title: 'Scheduled repair — AC unit', eventType: 'scheduled-repair', propertyId: 'prop-1', taskId: 'task-1', start: '2026-06-06', notes: 'Cool Air HVAC — AC repair' },
  { id: 'event-5', title: 'Annual inspection — 123 Oak St', eventType: 'inspection', propertyId: 'prop-1', start: '2026-07-15', notes: 'Routine annual property inspection' },
  { id: 'event-6', title: 'Lease renewal reminder — 789 Market St', eventType: 'renewal-reminder', propertyId: 'prop-3', tenantId: 'tenant-3', start: '2025-10-01', notes: '90 days before lease end' },
  { id: 'event-7', title: 'Rent collection — all properties', eventType: 'rent-due', start: '2026-06-01', notes: 'Monthly rent collection' },
  { id: 'event-8', title: 'Lease ends — 123 Oak St 4A', eventType: 'lease-end', propertyId: 'prop-1', tenantId: 'tenant-1', start: '2026-02-28', notes: 'Dana Levy — lease ending' }
]

// ─── Helper functions ─────────────────────────────────────────────────────────

export function getPropertyById(id: string): Property | undefined {
  return sampleProperties.find(p => p.id === id)
}

export function getTenantById(id: string): Tenant | undefined {
  return sampleTenants.find(t => t.id === id)
}

export function getTenantsByPropertyId(propertyId: string): Tenant[] {
  return sampleTenants.filter(t => t.propertyId === propertyId)
}

export function getPaymentsByPropertyId(propertyId: string): Payment[] {
  return samplePayments.filter(p => p.propertyId === propertyId)
}

export function getContractsByPropertyId(propertyId: string): Contract[] {
  return sampleContracts.filter(c => c.propertyId === propertyId)
}

export function getTasksByPropertyId(propertyId: string): Task[] {
  return sampleTasks.filter(t => t.propertyId === propertyId)
}

export function getMessageThreadById(id: string): MessageThread | undefined {
  return sampleMessageThreads.find(t => t.id === id)
}

export function getMessagesByThreadId(threadId: string): Message[] {
  return sampleMessages.filter(m => m.threadId === threadId)
}

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

// ─── Aliases for pages that import these names ────────────────────────────────
// The tenants/page.tsx, vendors/page.tsx, and settings/page.tsx were written
// against a slightly different shape. These adapters bridge the gap while keeping
// the canonical types unchanged.

/** Flat tenant view expected by app/tenants/page.tsx */
export interface TenantRow {
  id: string
  name: string      // fullName
  email: string
  phone: string
  propertyId: string
  unit: string      // property unitLabel
  status: 'active' | 'pending' | 'former'
  telegram?: string // future: from Telegram linking
  leaseStart: string
  leaseEnd: string
  rent: string      // formatted currency
}

function tenantContractStatusToStatus(cs: Tenant['contractStatus']): TenantRow['status'] {
  if (cs === 'missing') return 'former'
  return 'active'
}

export const tenants: TenantRow[] = sampleTenants.map(t => {
  const prop = sampleProperties.find(p => p.id === t.propertyId)
  return {
    id: t.id,
    name: t.fullName,
    email: t.email,
    phone: t.phone,
    propertyId: t.propertyId,
    unit: prop?.unitLabel ?? '',
    status: tenantContractStatusToStatus(t.contractStatus),
    telegram: undefined,
    leaseStart: formatDate(t.moveInDate),
    leaseEnd: formatDate(t.leaseEndDate),
    rent: formatCurrency(prop?.monthlyRent ?? 0, prop?.rentCurrency ?? 'ILS'),
  }
})

/** Flat property view expected by app/tenants/page.tsx (needs `name` field) */
export interface PropertyRow {
  id: string
  name: string
}

export const properties: PropertyRow[] = sampleProperties.map(p => ({
  id: p.id,
  name: p.address,
}))

/** Extended vendor view expected by app/vendors/page.tsx */
export interface VendorRow {
  id: string
  name: string
  phone: string
  email: string
  category: string  // plumbing/electrical/general/painting/security/ac-hvac/...
  specialty: string // human-readable category
  contactPerson: string
  serviceArea: string
  rating: number
  activeJobs: number
  completedJobs: number
  status: 'active' | 'preferred' | 'inactive'
  notes?: string
}

const _vendorExtras: Record<string, { contactPerson: string; rating: number; activeJobs: number; completedJobs: number }> = {
  'vendor-1': { contactPerson: 'Mickey', rating: 4.8, activeJobs: 2, completedJobs: 14 },
  'vendor-2': { contactPerson: 'Plumbing Dept', rating: 4.5, activeJobs: 1, completedJobs: 22 },
  'vendor-3': { contactPerson: 'All Repairs', rating: 3.9, activeJobs: 0, completedJobs: 7 },
  'vendor-4': { contactPerson: 'Barak Electric', rating: 4.7, activeJobs: 3, completedJobs: 31 },
  'vendor-5': { contactPerson: 'Fresh Paint', rating: 4.2, activeJobs: 0, completedJobs: 9 },
  'vendor-6': { contactPerson: 'Quick Lock', rating: 4.6, activeJobs: 1, completedJobs: 18 },
  'vendor-7': { contactPerson: 'Silver Clean', rating: 4.3, activeJobs: 0, completedJobs: 12 },
  'vendor-8': { contactPerson: 'Appliance Experts', rating: 4.0, activeJobs: 1, completedJobs: 6 },
}

export const vendors: VendorRow[] = sampleVendors.map(v => {
  const extras = _vendorExtras[v.id] ?? { contactPerson: v.name, rating: 4.0, activeJobs: 0, completedJobs: 0 }
  return {
    id: v.id,
    name: v.name,
    phone: v.phone,
    email: v.email ?? '',
    category: v.category,
    specialty: getVendorCategoryLabel(v.category),
    contactPerson: extras.contactPerson,
    serviceArea: v.serviceArea,
    rating: extras.rating,
    activeJobs: extras.activeJobs,
    completedJobs: extras.completedJobs,
    status: v.isPreferred ? 'preferred' : 'active',
    notes: v.notes,
  }
})

/** Current landlord user — placeholder until a real /api/me endpoint exists */
export const currentUser = {
  name: 'Landlord',
  email: 'landlord@landed.co.il',
  role: 'Administrator',
  company: 'Landed Property Management',
}
