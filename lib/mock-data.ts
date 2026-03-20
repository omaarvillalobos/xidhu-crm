// ─── USUARIOS ───────────────────────────────────────────────────────────────
export type User = {
  id: string
  name: string
  email: string
  role: 'admin' | 'ejecutivo'
  avatar: string
}

export const USERS: User[] = [
  { id: 'u1', name: 'Ana García', email: 'ana@xidhu.mx', role: 'admin', avatar: 'AG' },
  { id: 'u2', name: 'Carlos López', email: 'carlos@xidhu.mx', role: 'ejecutivo', avatar: 'CL' },
  { id: 'u3', name: 'María Torres', email: 'maria@xidhu.mx', role: 'ejecutivo', avatar: 'MT' },
]

export const CURRENT_USER = USERS[0]

// ─── CLIENTES ────────────────────────────────────────────────────────────────
export type Source = 'whatsapp' | 'instagram' | 'facebook' | 'referido' | 'otro'

export type Client = {
  id: string
  full_name: string
  phone: string
  email: string
  source: Source
  notes: string
  created_at: string
  created_by: string
}

export const CLIENTS: Client[] = []

// ─── COTIZACIONES ─────────────────────────────────────────────────────────────
export type QuoteStatus = 'pendiente' | 'ganada' | 'perdida' | 'vencida'

export type Quote = {
  id: string
  client_id: string
  destination: string
  travel_date: string
  return_date: string
  num_passengers: number
  amount: number
  status: QuoteStatus
  notes: string
  follow_up_date: string
  created_at: string
  created_by: string
}

export const QUOTES: Quote[] = []

// ─── VENTAS ───────────────────────────────────────────────────────────────────
export type Sale = {
  id: string
  quote_id: string
  client_id: string
  closed_by: string
  amount: number
  destination: string
  travel_date: string
  closed_at: string
}

export const SALES: Sale[] = []

// ─── NOTIFICACIONES / FOLLOW-UPS ─────────────────────────────────────────────
export type Notification = {
  id: string
  quote_id: string
  client_id: string
  message: string
  days_overdue: number
  read: boolean
  created_at: string
}

export const NOTIFICATIONS: Notification[] = []

// ─── HELPERS ─────────────────────────────────────────────────────────────────
export function getClientById(id: string): Client | undefined {
  return CLIENTS.find((c) => c.id === id)
}

export function getQuotesByClient(clientId: string): Quote[] {
  return QUOTES.filter((q) => q.client_id === clientId)
}

export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('es-MX')} MXN`
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export function getUserById(id: string): User | undefined {
  return USERS.find((u) => u.id === id)
}

// Sales por mes (últimos 12 meses) para charts
export const SALES_BY_MONTH = [
  { mes: 'Abr', monto: 0 },
  { mes: 'May', monto: 0 },
  { mes: 'Jun', monto: 0 },
  { mes: 'Jul', monto: 0 },
  { mes: 'Ago', monto: 0 },
  { mes: 'Sep', monto: 0 },
  { mes: 'Oct', monto: 0 },
  { mes: 'Nov', monto: 0 },
  { mes: 'Dic', monto: 0 },
  { mes: 'Ene', monto: 0 },
  { mes: 'Feb', monto: 0 },
  { mes: 'Mar', monto: 0 },
]

export const TOP_DESTINATIONS: { destino: string; cotizaciones: number; ventas: number }[] = []

export const SOURCE_DISTRIBUTION: { name: string; value: number; color: string }[] = []
