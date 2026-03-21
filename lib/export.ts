import * as XLSX from 'xlsx'
import type { Client, Quote } from './mock-data'

const EXEC_NAMES: Record<string, string> = {
  u1: 'Ana García',
  u2: 'Carlos López',
  u3: 'María Torres',
}

export function exportToExcel(clients: Client[], quotes: Quote[]) {
  const wb = XLSX.utils.book_new()

  // ── Hoja 1: Clientes ──────────────────────────────────────────────
  const clientRows = clients.map((c) => ({
    'Nombre':        c.full_name,
    'Teléfono':      c.phone,
    'Correo':        c.email,
    'Fuente':        c.source,
    'Notas':         c.notes,
    'Ejecutivo':     EXEC_NAMES[c.created_by] ?? c.created_by,
    'Fecha registro': c.created_at,
  }))
  const wsClients = XLSX.utils.json_to_sheet(clientRows.length ? clientRows : [{ 'Sin datos': '' }])
  XLSX.utils.book_append_sheet(wb, wsClients, 'Clientes')

  // ── Hoja 2: Cotizaciones ──────────────────────────────────────────
  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.full_name]))
  const quoteRows = quotes.map((q) => ({
    'Cliente':          clientMap[q.client_id] ?? q.client_id,
    'Destino':          q.destination,
    'Fecha de viaje':   q.travel_date,
    'Fecha de regreso': q.return_date,
    'Pasajeros':        q.num_passengers,
    'Monto (MXN)':      q.amount,
    'Estado':           q.status,
    'Seguimiento':      q.follow_up_date,
    'Ejecutivo':        EXEC_NAMES[q.created_by] ?? q.created_by,
    'Notas':            q.notes,
    'Creada el':        q.created_at,
  }))
  const wsQuotes = XLSX.utils.json_to_sheet(quoteRows.length ? quoteRows : [{ 'Sin datos': '' }])
  XLSX.utils.book_append_sheet(wb, wsQuotes, 'Cotizaciones')

  // ── Hoja 3: Estadísticas ──────────────────────────────────────────
  const total = quotes.reduce((s, q) => s + (q.amount ?? 0), 0)
  const ganadas = quotes.filter((q) => q.status === 'ganada')
  const statsRows = [
    { 'Métrica': 'Total clientes',              'Valor': clients.length },
    { 'Métrica': 'Total cotizaciones',           'Valor': quotes.length },
    { 'Métrica': 'Cotizaciones pendientes',      'Valor': quotes.filter((q) => q.status === 'pendiente').length },
    { 'Métrica': 'Cotizaciones ganadas',         'Valor': ganadas.length },
    { 'Métrica': 'Cotizaciones perdidas',        'Valor': quotes.filter((q) => q.status === 'perdida').length },
    { 'Métrica': 'Cotizaciones vencidas',        'Valor': quotes.filter((q) => q.status === 'vencida').length },
    { 'Métrica': 'Monto total cotizado (MXN)',   'Valor': total },
    { 'Métrica': 'Monto ganado (MXN)',           'Valor': ganadas.reduce((s, q) => s + (q.amount ?? 0), 0) },
    { 'Métrica': 'Tasa de cierre',               'Valor': quotes.length ? `${Math.round((ganadas.length / quotes.length) * 100)}%` : '0%' },
  ]
  const wsStats = XLSX.utils.json_to_sheet(statsRows)
  XLSX.utils.book_append_sheet(wb, wsStats, 'Estadísticas')

  // ── Descargar ─────────────────────────────────────────────────────
  const fecha = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `xidhu-crm-${fecha}.xlsx`)
}
