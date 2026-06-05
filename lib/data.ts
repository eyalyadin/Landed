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
    managerName: 'ועד הבית',
    notes: 'דירת פינה, אור טבעי מעולה'
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
    notes: 'בית פרטי עם גינה'
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
    managerName: 'חברת ניהול'
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
    notes: 'שופץ לאחרונה, מוכן לשוכר חדש'
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
    managerName: 'חברת ניהול'
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
    fullName: 'דנה לוי',
    phone: '+972501112233',
    email: 'dana.levi@email.com',
    propertyId: 'prop-1',
    moveInDate: '2025-03-01',
    leaseEndDate: '2026-02-28',
    paymentMethod: 'העברה בנקאית',
    paymentStatus: 'paid',
    contractStatus: 'active',
    keysAccessNotes: '2 מפתחות, שלט',
    messageThreadId: 'thread-1',
    notes: 'שוכרת שקטה, משלמת בזמן'
  },
  {
    id: 'tenant-2',
    fullName: 'יוסי כהן',
    phone: '+972502223344',
    email: 'yossi.cohen@email.com',
    propertyId: 'prop-2',
    moveInDate: '2024-08-01',
    leaseEndDate: '2026-07-31',
    paymentMethod: 'צ׳ק',
    paymentStatus: 'overdue',
    contractStatus: 'active',
    keysAccessNotes: '3 מפתחות, שלט לחניה',
    messageThreadId: 'thread-2',
    notes: 'לעקוב אחר תשלום מאוחר'
  },
  {
    id: 'tenant-3',
    fullName: 'Sarah Johnson',
    phone: '+972503334455',
    email: 'sarah.j@email.com',
    propertyId: 'prop-3',
    moveInDate: '2025-01-01',
    leaseEndDate: '2025-12-31',
    paymentMethod: 'הוראת קבע',
    paymentStatus: 'due-soon',
    contractStatus: 'expiring-soon',
    keysAccessNotes: '2 מפתחות, כרטיס חניה',
    messageThreadId: 'thread-3'
  },
  {
    id: 'tenant-4',
    fullName: 'אורן ברק',
    phone: '+972504445566',
    email: 'oren.barak@email.com',
    propertyId: 'prop-5',
    moveInDate: '2025-06-01',
    leaseEndDate: '2026-05-31',
    paymentMethod: 'העברה בנקאית',
    paymentStatus: 'paid',
    contractStatus: 'active',
    keysAccessNotes: '2 מפתחות',
    messageThreadId: 'thread-4',
    notes: 'שוכר חדש, מגיב מהר'
  },
  {
    id: 'tenant-5',
    fullName: 'מיכל שפירא',
    phone: '+972505556677',
    email: 'michal.s@email.com',
    propertyId: 'prop-6',
    moveInDate: '2024-12-01',
    leaseEndDate: '2025-11-30',
    paymentMethod: 'צ׳ק',
    paymentStatus: 'partial',
    contractStatus: 'active',
    keysAccessNotes: '4 מפתחות, קוד אזעקה: 1234',
    messageThreadId: 'thread-5',
    notes: 'שילמה חלקית, ממתינה לשאר'
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
    source: 'העברה בנקאית',
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
    source: 'העברה בנקאית'
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
    notes: 'תשלום חלקי — ₪2,000 מתוך ₪4,200'
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
    source: 'העברה בנקאית'
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
    source: 'העברה בנקאית',
    notes: 'פיקדון — 2 חודשים'
  }
]

export const sampleContracts: Contract[] = [
  { id: 'contract-1', documentName: 'חוזה שכירות — 123 Oak St 4A', documentType: 'rental-contract', propertyId: 'prop-1', uploadedAt: '2025-03-01' },
  { id: 'contract-2', documentName: 'פרוטוקול כניסה — 123 Oak St 4A', documentType: 'inventory', propertyId: 'prop-1', uploadedAt: '2025-03-01' },
  { id: 'contract-3', documentName: 'חוזה שכירות — 456 Pine Ave', documentType: 'rental-contract', propertyId: 'prop-2', uploadedAt: '2024-08-01' },
  { id: 'contract-4', documentName: 'חוזה שכירות — 789 Market St 202', documentType: 'rental-contract', propertyId: 'prop-3', uploadedAt: '2025-01-01' },
  { id: 'contract-5', documentName: 'קבלת פיקדון — 789 Market St', documentType: 'deposit-document', propertyId: 'prop-3', uploadedAt: '2025-01-01' },
  { id: 'contract-6', documentName: 'חוזה שכירות — 555 Bay View Unit 8', documentType: 'rental-contract', propertyId: 'prop-5', uploadedAt: '2025-06-01' },
  { id: 'contract-7', documentName: 'חוזה שכירות — 888 Mission Blvd', documentType: 'rental-contract', propertyId: 'prop-6', uploadedAt: '2024-12-01' },
  { id: 'contract-8', documentName: 'מסירת מפתחות — 123 Oak St 4A', documentType: 'keys-record', propertyId: 'prop-1', uploadedAt: '2025-03-01' }
]

export const sampleMessageThreads: MessageThread[] = [
  {
    id: 'thread-1',
    tenantId: 'tenant-1',
    propertyId: 'prop-1',
    lastMessagePreview: 'תודה על התיקון המהיר של המזגן!',
    lastMessageAt: '2026-06-04T14:30:00Z',
    unreadCount: 0,
    urgency: 'normal',
    status: 'resolved',
    summary: 'תיקון מזגן הושלם בהצלחה',
    suggestedNextAction: 'לא נדרשת פעולה'
  },
  {
    id: 'thread-2',
    tenantId: 'tenant-2',
    propertyId: 'prop-2',
    lastMessagePreview: 'אשלם את שכר הדירה עד יום שישי, היה לי הוצאה בלתי צפויה',
    lastMessageAt: '2026-06-05T09:15:00Z',
    unreadCount: 1,
    urgency: 'urgent',
    status: 'open',
    summary: 'שוכר מבקש דחייה בתשלום עקב הוצאה בלתי צפויה',
    suggestedNextAction: 'לאשר תאריך תשלום ולתעד את ההסכם'
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
    lastMessagePreview: 'נכנסתי, הכל נראה מצוין!',
    lastMessageAt: '2026-06-01T10:00:00Z',
    unreadCount: 0,
    urgency: 'normal',
    status: 'resolved'
  },
  {
    id: 'thread-5',
    tenantId: 'tenant-5',
    propertyId: 'prop-6',
    lastMessagePreview: 'הדוד שמש שוב משמיע רעשים מוזרים',
    lastMessageAt: '2026-06-05T08:30:00Z',
    unreadCount: 2,
    urgency: 'urgent',
    status: 'open',
    summary: 'דווח על תקלה בדוד שמש — ייתכן שנדרש תיקון',
    suggestedNextAction: 'לתאם ביקור שרברב'
  }
]

export const sampleMessages: Message[] = [
  {
    id: 'msg-1',
    threadId: 'thread-2',
    senderType: 'tenant',
    senderName: 'יוסי כהן',
    body: 'שלום, רציתי לעדכן אותך לגבי שכר הדירה. היה לי תיקון רכב בלתי צפוי והחודש קצת קשה.',
    createdAt: '2026-06-04T10:00:00Z',
    isInternalNote: false
  },
  {
    id: 'msg-2',
    threadId: 'thread-2',
    senderType: 'landlord',
    senderName: 'בעל הבית',
    body: 'שלום יוסי, תודה שעדכנת. מתי אתה מצפה לשלם?',
    createdAt: '2026-06-04T14:30:00Z',
    isInternalNote: false
  },
  {
    id: 'msg-3',
    threadId: 'thread-2',
    senderType: 'tenant',
    senderName: 'יוסי כהן',
    body: 'אשלם את שכר הדירה עד יום שישי, היה לי הוצאה בלתי צפויה',
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
    senderName: 'מיכל שפירא',
    body: 'בוקר טוב. הדוד שמש התחיל להשמיע רעשי גוף אמש. הוא עדיין עובד אבל אני מודאגת שזו בעיה.',
    createdAt: '2026-06-05T07:45:00Z',
    isInternalNote: false
  },
  {
    id: 'msg-6',
    threadId: 'thread-5',
    senderType: 'tenant',
    senderName: 'מיכל שפירא',
    body: 'הדוד שמש שוב משמיע רעשים מוזרים',
    createdAt: '2026-06-05T08:30:00Z',
    isInternalNote: false
  }
]

export const sampleTasks: Task[] = [
  {
    id: 'task-1',
    title: 'תיקון מזגן — משמיע רעש',
    propertyId: 'prop-1',
    tenantId: 'tenant-1',
    category: 'repair',
    priority: 'high',
    dueDate: '2026-06-06',
    status: 'in-progress',
    contractorName: 'Cool Air HVAC',
    notes: 'השוכרת דיווחה על רעש מהמזגן',
    createdAt: '2026-06-02T10:00:00Z'
  },
  {
    id: 'task-2',
    title: 'מעקב תשלום שכר דירה מאוחר',
    propertyId: 'prop-2',
    tenantId: 'tenant-2',
    category: 'payment-followup',
    priority: 'urgent',
    dueDate: '2026-06-07',
    status: 'waiting-on-tenant',
    sourceThreadId: 'thread-2',
    notes: 'השוכר אמר שישלם עד יום שישי',
    createdAt: '2026-06-04T15:00:00Z'
  },
  {
    id: 'task-3',
    title: 'תיקון ברז דולף במטבח',
    propertyId: 'prop-2',
    tenantId: 'tenant-2',
    category: 'repair',
    priority: 'medium',
    dueDate: '2026-06-10',
    status: 'new',
    notes: 'ברז כיור המטבח מטפטף',
    createdAt: '2026-06-03T09:00:00Z'
  },
  {
    id: 'task-4',
    title: 'שיחה על חידוש חוזה',
    propertyId: 'prop-3',
    tenantId: 'tenant-3',
    category: 'contract-renewal',
    priority: 'medium',
    dueDate: '2026-06-15',
    status: 'new',
    sourceThreadId: 'thread-3',
    notes: 'השוכרת רוצה לחדש לעוד שנה',
    createdAt: '2026-06-03T17:00:00Z'
  },
  {
    id: 'task-5',
    title: 'הכנת דירה לשוכר חדש',
    propertyId: 'prop-4',
    category: 'maintenance',
    priority: 'high',
    dueDate: '2026-06-20',
    status: 'in-progress',
    notes: 'ניקוי עמוק, תיקוני צבע, החלפת שטיח בחדר שינה',
    createdAt: '2026-05-28T11:00:00Z'
  },
  {
    id: 'task-6',
    title: 'החלפת סוללות גלאי עשן',
    propertyId: 'prop-4',
    category: 'maintenance',
    priority: 'medium',
    dueDate: '2026-06-12',
    status: 'new',
    createdAt: '2026-06-01T08:00:00Z'
  },
  {
    id: 'task-7',
    title: 'תיקון ידית שער שבורה',
    propertyId: 'prop-4',
    category: 'repair',
    priority: 'low',
    dueDate: '2026-06-25',
    status: 'new',
    createdAt: '2026-05-30T14:00:00Z'
  },
  {
    id: 'task-8',
    title: 'בדיקת דוד שמש',
    propertyId: 'prop-6',
    tenantId: 'tenant-5',
    category: 'repair',
    priority: 'high',
    dueDate: '2026-06-06',
    status: 'new',
    sourceThreadId: 'thread-5',
    notes: 'משמיע רעשי גוף — לתאם שרברב',
    createdAt: '2026-06-05T08:45:00Z'
  },
  {
    id: 'task-9',
    title: 'בדיקה שנתית',
    propertyId: 'prop-1',
    category: 'inspection',
    priority: 'low',
    dueDate: '2026-07-15',
    status: 'new',
    notes: 'בדיקת נכס שנתית שגרתית',
    createdAt: '2026-06-01T09:00:00Z'
  }
]

export const sampleVendors: Vendor[] = [
  { id: 'vendor-1', name: 'Cool Air HVAC', phone: '+972501001001', email: 'service@coolair.co.il', category: 'ac-hvac', serviceArea: 'גוש דן', notes: 'מגיב מהר, מחירים טובים. לשאול עבור מיקי.', isPreferred: true },
  { id: 'vendor-2', name: 'אינסטלציה בע"מ', phone: '+972502002002', email: 'info@plumbing.co.il', category: 'plumbing', serviceArea: 'תל אביב, חיפה', notes: 'שירות חירום 24/7', isPreferred: true },
  { id: 'vendor-3', name: 'כל-תיקון', phone: '+972503003003', category: 'handyman', serviceArea: 'ירושלים', notes: 'טוב לתיקונים קטנים', isPreferred: false },
  { id: 'vendor-4', name: 'ברק חשמל', phone: '+972504004004', email: 'jobs@barak.co.il', category: 'electrician', serviceArea: 'כל הארץ', isPreferred: true },
  { id: 'vendor-5', name: 'צבע טרי', phone: '+972505005005', email: 'quotes@fresh.co.il', category: 'painting', serviceArea: 'מרכז', notes: 'משמש לסיבוב דירות. עבודה איכותית.', isPreferred: false },
  { id: 'vendor-6', name: 'מנעולן מהיר', phone: '+972506006006', category: 'locksmith', serviceArea: 'תל אביב', notes: 'זמין 24/7', isPreferred: true },
  { id: 'vendor-7', name: 'נקיון כסף', phone: '+972507007007', email: 'book@silver.co.il', category: 'cleaning', serviceArea: 'מרכז ודרום', notes: 'ניקוי עמוק לפינוי דירות', isPreferred: false },
  { id: 'vendor-8', name: 'מומחי מכשירים', phone: '+972508008008', category: 'appliance-repair', serviceArea: 'כל הארץ', isPreferred: false }
]

export const sampleCalendarEvents: CalendarEvent[] = [
  { id: 'event-1', title: 'מועד גביית שכר דירה — כל הנכסים', eventType: 'rent-due', start: '2026-07-01', notes: 'גביית שכר דירה חודשית' },
  { id: 'event-2', title: 'חוזה מסתיים — 789 Market St 202', eventType: 'lease-end', propertyId: 'prop-3', tenantId: 'tenant-3', start: '2025-12-31', notes: 'Sarah Johnson — לדון בחידוש' },
  { id: 'event-3', title: 'חוזה מסתיים — 888 Mission Blvd', eventType: 'lease-end', propertyId: 'prop-6', tenantId: 'tenant-5', start: '2025-11-30', notes: 'מיכל שפירא — חוזה פג' },
  { id: 'event-4', title: 'תיקון מתוכנן — מזגן', eventType: 'scheduled-repair', propertyId: 'prop-1', taskId: 'task-1', start: '2026-06-06', notes: 'Cool Air HVAC — תיקון מזגן' },
  { id: 'event-5', title: 'בדיקה שנתית — 123 Oak St', eventType: 'inspection', propertyId: 'prop-1', start: '2026-07-15', notes: 'בדיקת נכס שנתית שגרתית' },
  { id: 'event-6', title: 'תזכורת חידוש חוזה — 789 Market St', eventType: 'renewal-reminder', propertyId: 'prop-3', tenantId: 'tenant-3', start: '2025-10-01', notes: '90 יום לפני סיום חוזה' },
  { id: 'event-7', title: 'מועד גביית שכר דירה — כל הנכסים', eventType: 'rent-due', start: '2026-06-01', notes: 'גביית שכר דירה חודשית' },
  { id: 'event-8', title: 'חוזה מסתיים — 123 Oak St 4A', eventType: 'lease-end', propertyId: 'prop-1', tenantId: 'tenant-1', start: '2026-02-28', notes: 'דנה לוי — חוזה מסתיים' }
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
  return new Intl.NumberFormat('he-IL', {
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
  if (diffInHours < 1) return 'עכשיו'
  if (diffInHours < 24) return `לפני ${diffInHours}ש׳`
  if (diffInHours < 48) return 'אתמול'
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
    case 'new': return 'חדש'
    case 'in-progress': return 'בטיפול'
    case 'waiting-on-tenant': return 'ממתין לשוכר'
    case 'waiting-on-vendor': return 'ממתין לקבלן'
    case 'completed': return 'הושלם'
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
    case 'ac-hvac': return 'מיזוג אוויר'
    case 'electrician': return 'חשמלאי'
    case 'plumbing': return 'אינסטלציה'
    case 'painting': return 'צביעה'
    case 'locksmith': return 'מנעולן'
    case 'handyman': return 'כל-בו'
    case 'cleaning': return 'ניקיון'
    case 'appliance-repair': return 'תיקון מכשירים'
    case 'pest-control': return 'הדברה'
    default: return category
  }
}

export function getDocumentTypeLabel(type: DocumentType): string {
  switch (type) {
    case 'rental-contract': return 'חוזה שכירות'
    case 'inventory': return 'מלאי'
    case 'deposit-document': return 'מסמך פיקדון'
    case 'keys-record': return 'רישום מפתחות'
    case 'other': return 'אחר'
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
  'vendor-1': { contactPerson: 'מיקי', rating: 4.8, activeJobs: 2, completedJobs: 14 },
  'vendor-2': { contactPerson: 'אינסטלציה', rating: 4.5, activeJobs: 1, completedJobs: 22 },
  'vendor-3': { contactPerson: 'כל-תיקון', rating: 3.9, activeJobs: 0, completedJobs: 7 },
  'vendor-4': { contactPerson: 'ברק חשמל', rating: 4.7, activeJobs: 3, completedJobs: 31 },
  'vendor-5': { contactPerson: 'צבע טרי', rating: 4.2, activeJobs: 0, completedJobs: 9 },
  'vendor-6': { contactPerson: 'מנעולן', rating: 4.6, activeJobs: 1, completedJobs: 18 },
  'vendor-7': { contactPerson: 'נקיון כסף', rating: 4.3, activeJobs: 0, completedJobs: 12 },
  'vendor-8': { contactPerson: 'מומחי מכשירים', rating: 4.0, activeJobs: 1, completedJobs: 6 },
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
  name: 'בעל הבית',
  email: 'landlord@landed.co.il',
  role: 'Administrator',
  company: 'Landed Property Management',
}
