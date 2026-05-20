'use client'

import { useState, useEffect, useMemo } from 'react'
import { formatCurrency, todayStr } from '@/lib/mock-data'
import { getStoredQuotes, getStoredClients, insertQuote } from '@/lib/store'
import { getCurrentUser } from '@/lib/auth'
import type { Quote, Client } from '@/lib/mock-data'
import Modal from '@/components/ui/Modal'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const SALE_TYPE_OPTIONS = [
  { value: '',                    label: 'Tipo de venta...' },
  { value: 'Tours',               label: 'Tours' },
  { value: 'Personalizado',       label: 'Personalizado' },
  { value: 'Terrestre',           label: 'Terrestre' },
  { value: 'Aéreo (solo vuelo)',  label: 'Aéreo (solo vuelo)' },
  { value: 'Paquete',             label: 'Paquete' },
]

const INPUT_STYLE = {
  width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb',
  borderRadius: 10, fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif",
  outline: 'none', boxSizing: 'border-box' as const, color: '#1A1A2E',
}

const MES_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const EXEC_NAMES: Record<string, string> = { u1: 'Mariana', u2: 'Eduardo', u3: 'Issori' }

type PeriodKey = 'hoy' | 'semana' | 'mes' | 'mesAnterior' | 'trimestre' | 'año' | 'custom'

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: 'hoy',          label: 'Hoy' },
  { key: 'semana',       label: 'Esta semana' },
  { key: 'mes',          label: 'Este mes' },
  { key: 'mesAnterior',  label: 'Mes anterior' },
  { key: 'trimestre',    label: 'Últimos 3 meses' },
  { key: 'año',          label: 'Este año' },
  { key: 'custom',       label: 'Personalizado' },
]

// Devuelve YYYY-MM-DD a partir de un Date
function toIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Devuelve { from, to, prevFrom, prevTo, granularity, label }
function getPeriodRange(
  period: PeriodKey,
  customFrom: string,
  customTo: string,
): { from: string; to: string; prevFrom: string; prevTo: string; granularity: 'day' | 'week' | 'month'; label: string } {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const today = new Date(now)

  switch (period) {
    case 'hoy': {
      const from = new Date(today)
      const to = new Date(today)
      const prevFrom = new Date(today); prevFrom.setDate(prevFrom.getDate() - 1)
      const prevTo = new Date(today);   prevTo.setDate(prevTo.getDate() - 1)
      return { from: toIso(from), to: toIso(to), prevFrom: toIso(prevFrom), prevTo: toIso(prevTo), granularity: 'day', label: 'vs ayer' }
    }
    case 'semana': {
      const from = new Date(today); from.setDate(today.getDate() - 6)
      const to = new Date(today)
      const prevFrom = new Date(today); prevFrom.setDate(today.getDate() - 13)
      const prevTo = new Date(today);   prevTo.setDate(today.getDate() - 7)
      return { from: toIso(from), to: toIso(to), prevFrom: toIso(prevFrom), prevTo: toIso(prevTo), granularity: 'day', label: 'vs semana anterior' }
    }
    case 'mes': {
      const from = new Date(today.getFullYear(), today.getMonth(), 1)
      const to = new Date(today)
      const prevFrom = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const prevTo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
      return { from: toIso(from), to: toIso(to), prevFrom: toIso(prevFrom), prevTo: toIso(prevTo), granularity: 'day', label: 'vs mes anterior' }
    }
    case 'mesAnterior': {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const to = new Date(today.getFullYear(), today.getMonth(), 0)
      const prevFrom = new Date(today.getFullYear(), today.getMonth() - 2, 1)
      const prevTo = new Date(today.getFullYear(), today.getMonth() - 1, 0)
      return { from: toIso(from), to: toIso(to), prevFrom: toIso(prevFrom), prevTo: toIso(prevTo), granularity: 'day', label: 'vs hace 2 meses' }
    }
    case 'trimestre': {
      const from = new Date(today); from.setMonth(today.getMonth() - 2); from.setDate(1)
      const to = new Date(today)
      const prevFrom = new Date(from); prevFrom.setMonth(from.getMonth() - 3)
      const prevTo = new Date(from); prevTo.setDate(0)
      return { from: toIso(from), to: toIso(to), prevFrom: toIso(prevFrom), prevTo: toIso(prevTo), granularity: 'month', label: 'vs trimestre anterior' }
    }
    case 'año': {
      const from = new Date(today.getFullYear(), 0, 1)
      const to = new Date(today)
      const prevFrom = new Date(today.getFullYear() - 1, 0, 1)
      const prevTo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
      return { from: toIso(from), to: toIso(to), prevFrom: toIso(prevFrom), prevTo: toIso(prevTo), granularity: 'month', label: 'vs año anterior' }
    }
    case 'custom': {
      const from = customFrom || toIso(new Date(today.getFullYear(), today.getMonth(), 1))
      const to = customTo || toIso(today)
      // Para personalizado, comparar contra la misma duración anterior
      const fromDate = new Date(from)
      const toDate = new Date(to)
      const days = Math.round((toDate.getTime() - fromDate.getTime()) / 86400000) + 1
      const prevTo = new Date(fromDate); prevTo.setDate(prevTo.getDate() - 1)
      const prevFrom = new Date(prevTo); prevFrom.setDate(prevFrom.getDate() - days + 1)
      const granularity: 'day' | 'month' = days > 90 ? 'month' : 'day'
      return { from, to, prevFrom: toIso(prevFrom), prevTo: toIso(prevTo), granularity, label: 'vs período anterior' }
    }
  }
}

// Suma amounts de quotes ganadas cuyo created_at cae en [from, to]
function sumGanadasInRange(quotes: Quote[], from: string, to: string): { total: number; count: number } {
  let total = 0
  let count = 0
  for (const q of quotes) {
    if (q.status !== 'ganada') continue
    const date = (q.created_at ?? '').slice(0, 10)
    if (date >= from && date <= to) {
      total += q.amount ?? 0
      count++
    }
  }
  return { total, count }
}

// Agrupa ingresos por día (YYYY-MM-DD) o mes (YYYY-MM) en el rango
function groupByPeriod(
  quotes: Quote[],
  from: string,
  to: string,
  granularity: 'day' | 'week' | 'month',
): { label: string; monto: number; key: string }[] {
  const fromDate = new Date(from)
  const toDate = new Date(to)
  const buckets: Record<string, { label: string; monto: number; sortKey: string }> = {}

  if (granularity === 'month') {
    // Inicializar todos los meses entre from y to con 0
    const cur = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1)
    while (cur <= toDate) {
      const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`
      buckets[key] = { label: MES_LABELS[cur.getMonth()], monto: 0, sortKey: key }
      cur.setMonth(cur.getMonth() + 1)
    }
  } else {
    // day granularity
    const cur = new Date(fromDate)
    while (cur <= toDate) {
      const key = toIso(cur)
      buckets[key] = { label: String(cur.getDate()), monto: 0, sortKey: key }
      cur.setDate(cur.getDate() + 1)
    }
  }

  for (const q of quotes) {
    if (q.status !== 'ganada') continue
    const date = (q.created_at ?? '').slice(0, 10)
    if (date < from || date > to) continue
    const key = granularity === 'month' ? date.slice(0, 7) : date
    if (buckets[key]) {
      buckets[key].monto += q.amount ?? 0
    }
  }

  return Object.values(buckets)
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map(({ label, monto, sortKey }) => ({ label, monto, key: sortKey }))
}

function pctChange(current: number, prev: number): { delta: number; isUp: boolean; isFlat: boolean } {
  if (prev === 0 && current === 0) return { delta: 0, isUp: false, isFlat: true }
  if (prev === 0) return { delta: 100, isUp: true, isFlat: false }
  const delta = Math.round(((current - prev) / prev) * 100)
  return { delta: Math.abs(delta), isUp: delta >= 0, isFlat: delta === 0 }
}

function formatDateDisplay(s: string): string {
  if (!s) return '—'
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

export default function SalesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodKey>('mes')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  // ── Modal "Registrar venta" ─────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    client_id: '',
    destination: '',
    travel_date: '',
    return_date: '',
    num_passengers: '2',
    amount: '',
    sale_type: '',
    notes: '',
  })

  useEffect(() => {
    Promise.all([getStoredQuotes(), getStoredClients()]).then(([q, c]) => {
      setQuotes(q)
      setClients(c)
      setLoading(false)
    })
  }, [])

  const openSaleModal = () => {
    setFormError('')
    setForm({
      client_id: '', destination: '', travel_date: '', return_date: '',
      num_passengers: '2', amount: '', sale_type: '', notes: '',
    })
    // Refrescar clientes por si se agregaron desde otra pestaña
    getStoredClients().then(setClients)
    setModalOpen(true)
  }

  const saveSale = async () => {
    setFormError('')
    if (!form.client_id) {
      setFormError('Selecciona un cliente.')
      return
    }
    if (!form.destination.trim()) {
      setFormError('Captura el destino.')
      return
    }
    const amountNum = parseFloat(form.amount)
    if (!amountNum || amountNum <= 0) {
      setFormError('El monto debe ser mayor a $0.')
      return
    }

    setSaving(true)
    const user = getCurrentUser()
    const today = todayStr()
    const newSale: Quote = {
      id: `q${Date.now()}`,
      client_id: form.client_id,
      destination: form.destination.trim(),
      travel_date: form.travel_date,
      return_date: form.return_date,
      num_passengers: parseInt(form.num_passengers) || 1,
      amount: amountNum,
      status: 'ganada', // ← directo a venta cerrada
      notes: form.notes.trim(),
      follow_up_date: '', // ganadas no necesitan follow-up
      created_at: today,
      created_by: user?.id ?? 'u1',
      sale_type: form.sale_type,
    }

    try {
      await insertQuote(newSale)
      setQuotes((prev) => [newSale, ...prev])
      setModalOpen(false)
    } catch (err: any) {
      setFormError('No se pudo guardar la venta. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const range = useMemo(
    () => getPeriodRange(period, customFrom, customTo),
    [period, customFrom, customTo]
  )

  // KPIs del período actual
  const current = useMemo(() => sumGanadasInRange(quotes, range.from, range.to), [quotes, range])
  const previous = useMemo(() => sumGanadasInRange(quotes, range.prevFrom, range.prevTo), [quotes, range])

  const ticketAvg = current.count > 0 ? Math.round(current.total / current.count) : 0
  const prevTicketAvg = previous.count > 0 ? Math.round(previous.total / previous.count) : 0

  const ingresosChange = pctChange(current.total, previous.total)
  const ventasChange = pctChange(current.count, previous.count)
  const ticketChange = pctChange(ticketAvg, prevTicketAvg)

  // Pipeline pendiente (TODAS las pendientes con monto > 0, sin importar fecha)
  const pipeline = useMemo(() => {
    const pendientes = quotes.filter((q) => q.status === 'pendiente' && (q.amount ?? 0) > 0)
    const total = pendientes.reduce((s, q) => s + (q.amount ?? 0), 0)
    const sorted = [...pendientes].sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0)).slice(0, 8)
    return { total, count: pendientes.length, top: sorted }
  }, [quotes])

  // Gráfica del período
  const chartData = useMemo(
    () => groupByPeriod(quotes, range.from, range.to, range.granularity),
    [quotes, range]
  )
  const maxBarValue = Math.max(...chartData.map((d) => d.monto), 1)

  // Detalle de ventas en el período (ganadas)
  const ventasPeriodo = useMemo(() => {
    return quotes
      .filter((q) => {
        if (q.status !== 'ganada') return false
        const d = (q.created_at ?? '').slice(0, 10)
        return d >= range.from && d <= range.to
      })
      .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))
  }, [quotes, range])

  const clientById = (id: string) => clients.find((c) => c.id === id)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p className="label-ui" style={{ marginBottom: 4 }}>Ventas y cashflow</p>
          <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Ventas</h1>
          <p style={{ color: '#9ca3af', marginTop: 4, marginBottom: 0, fontSize: '0.875rem' }}>
            Resumen financiero del negocio. Compara contra el período anterior para detectar tendencias.
          </p>
        </div>
        <button className="xidhu-btn-primary" onClick={openSaleModal}>
          + Registrar venta
        </button>
      </div>

      {/* Selector de período */}
      <div className="xidhu-card" style={{ marginBottom: 20, padding: '16px 24px' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {PERIOD_OPTIONS.map((opt) => {
            const isActive = period === opt.key
            return (
              <button
                key={opt.key}
                onClick={() => setPeriod(opt.key)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 9999,
                  border: isActive ? '1.5px solid #2DC4C4' : '1.5px solid #e5e7eb',
                  background: isActive ? 'rgba(45,196,196,0.08)' : 'white',
                  color: isActive ? '#2DC4C4' : '#4A4A5A',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 700 : 500,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {opt.label}
              </button>
            )
          })}
          {period === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
              <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Del</span>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                style={{ padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif", outline: 'none', color: '#1A1A2E' }}
              />
              <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>al</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                style={{ padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif", outline: 'none', color: '#1A1A2E' }}
              />
            </div>
          )}
        </div>
        <p style={{ margin: '12px 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
          📅 {formatDateDisplay(range.from)} — {formatDateDisplay(range.to)} · comparado con {formatDateDisplay(range.prevFrom)} — {formatDateDisplay(range.prevTo)}
        </p>
      </div>

      {/* KPI cards con comparativa */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <KPICard
          label="Ingresos"
          value={formatCurrency(current.total)}
          color="#2DC4C4"
          delta={ingresosChange.delta}
          isUp={ingresosChange.isUp}
          isFlat={ingresosChange.isFlat}
          comparisonLabel={range.label}
          loading={loading}
        />
        <KPICard
          label="Ventas cerradas"
          value={String(current.count)}
          color="#5DB544"
          delta={ventasChange.delta}
          isUp={ventasChange.isUp}
          isFlat={ventasChange.isFlat}
          comparisonLabel={range.label}
          loading={loading}
        />
        <KPICard
          label="Ticket promedio"
          value={formatCurrency(ticketAvg)}
          color="#F47B20"
          delta={ticketChange.delta}
          isUp={ticketChange.isUp}
          isFlat={ticketChange.isFlat}
          comparisonLabel={range.label}
          loading={loading}
        />
        <KPICard
          label="Pipeline pendiente"
          value={formatCurrency(pipeline.total)}
          sub={`${pipeline.count} cotización${pipeline.count !== 1 ? 'es' : ''}`}
          color="#9B59B6"
          loading={loading}
        />
      </div>

      {/* Gráfica del período */}
      <div className="xidhu-card" style={{ marginBottom: 28 }}>
        <p className="label-ui" style={{ marginBottom: 4 }}>Evolución</p>
        <h2 style={{ margin: '0 0 6px', fontSize: '1.1rem' }}>Cashflow del período</h2>
        <p style={{ color: '#9ca3af', fontSize: '0.78rem', marginBottom: 20, marginTop: 0 }}>
          Ingresos por {range.granularity === 'month' ? 'mes' : 'día'} (cotizaciones ganadas)
        </p>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: '0.875rem' }}>Cargando…</div>
        ) : current.total === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
            <p style={{ fontSize: '2rem', margin: '0 0 8px' }}>📊</p>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>Sin ventas registradas en este período.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v === 0 ? '' : `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v: number) => [`$${v.toLocaleString('es-MX')} MXN`, 'Ingresos']}
                contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontFamily: 'DM Sans' }}
              />
              <Bar dataKey="monto" maxBarSize={40} radius={[4, 4, 0, 0]}>
                {chartData.map((d, i) => (
                  <Cell key={`cell-${i}`} fill={d.monto === maxBarValue && d.monto > 0 ? '#F5C12E' : '#2DC4C4'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pipeline + Detalle de ventas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>

        {/* Pipeline pendiente */}
        <div className="xidhu-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <p className="label-ui" style={{ marginBottom: 4 }}>Pipeline</p>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Cotizaciones pendientes</h2>
            </div>
            <span style={{ background: '#F3E8FF', color: '#9B59B6', borderRadius: 9999, padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700 }}>
              {pipeline.count} pendientes
            </span>
          </div>
          {loading ? (
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', textAlign: 'center', padding: '40px 0' }}>Cargando…</p>
          ) : pipeline.top.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
              <p style={{ fontSize: '2rem', margin: '0 0 8px' }}>✨</p>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>No hay cotizaciones pendientes con monto.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pipeline.top.map((q) => {
                const c = clientById(q.client_id)
                return (
                  <div key={q.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#FAFAF6', borderRadius: 10 }}>
                    <div style={{ minWidth: 0, flex: 1, marginRight: 12 }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#1A1A2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c?.full_name ?? '—'}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {q.destination ?? '—'} · seguimiento {formatDateDisplay(q.follow_up_date ?? '')}
                      </p>
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#9B59B6', whiteSpace: 'nowrap' }}>
                      {formatCurrency(q.amount ?? 0)}
                    </span>
                  </div>
                )
              })}
              {pipeline.count > pipeline.top.length && (
                <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#9ca3af', textAlign: 'center' }}>
                  + {pipeline.count - pipeline.top.length} más en cotizaciones
                </p>
              )}
            </div>
          )}
        </div>

        {/* Detalle ventas del período */}
        <div className="xidhu-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <p className="label-ui" style={{ marginBottom: 4 }}>Detalle</p>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Ventas del período</h2>
            </div>
            <span style={{ background: '#EAF7E4', color: '#5DB544', borderRadius: 9999, padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700 }}>
              {current.count} venta{current.count !== 1 ? 's' : ''}
            </span>
          </div>
          {loading ? (
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', textAlign: 'center', padding: '40px 0' }}>Cargando…</p>
          ) : ventasPeriodo.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
              <p style={{ fontSize: '2rem', margin: '0 0 8px' }}>📭</p>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>Sin ventas en este período.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto' }}>
              {ventasPeriodo.map((q) => {
                const c = clientById(q.client_id)
                return (
                  <div key={q.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#FAFAF6', borderRadius: 10 }}>
                    <div style={{ minWidth: 0, flex: 1, marginRight: 12 }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#1A1A2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c?.full_name ?? '—'}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {q.destination ?? '—'} · {formatDateDisplay((q.created_at ?? '').slice(0, 10))} · {EXEC_NAMES[q.created_by] ?? '—'}
                      </p>
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#5DB544', whiteSpace: 'nowrap' }}>
                      {formatCurrency(q.amount ?? 0)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer info */}
      <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.72rem', margin: '16px 0' }}>
        Los datos se actualizan en tiempo real. Sólo cuentan cotizaciones con estatus <strong style={{ color: '#5DB544' }}>Ganada</strong> y monto registrado.
      </p>

      {/* Modal: Registrar venta directa (status = ganada) */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar venta">
        <p style={{ margin: '0 0 18px', fontSize: '0.85rem', color: '#5DB544', background: '#EAF7E4', padding: '10px 14px', borderRadius: 10, border: '1px solid #5DB544' }}>
          ✅ Esta venta se guardará directamente con estatus <strong>Ganada</strong> y aparecerá en el cashflow.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Cliente */}
          <div>
            <label className="label-ui" style={{ display: 'block', marginBottom: 6 }}>Cliente *</label>
            <select
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              style={INPUT_STYLE}
            >
              <option value="">Seleccionar cliente...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
            {clients.length === 0 && (
              <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
                No hay clientes registrados. Agrega uno desde la pestaña <strong>Clientes</strong>.
              </p>
            )}
          </div>

          {/* Tipo de venta */}
          <div>
            <label className="label-ui" style={{ display: 'block', marginBottom: 6 }}>Tipo de venta</label>
            <select
              value={form.sale_type}
              onChange={(e) => setForm({ ...form, sale_type: e.target.value })}
              style={INPUT_STYLE}
            >
              {SALE_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Destino */}
          <div>
            <label className="label-ui" style={{ display: 'block', marginBottom: 6 }}>Destino *</label>
            <input
              type="text"
              placeholder="Ej. Cancún, México"
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              style={INPUT_STYLE}
            />
          </div>

          {/* Fechas */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label className="label-ui" style={{ display: 'block', marginBottom: 6 }}>Fecha salida</label>
              <input
                type="date"
                value={form.travel_date}
                onChange={(e) => setForm({ ...form, travel_date: e.target.value })}
                style={INPUT_STYLE}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label-ui" style={{ display: 'block', marginBottom: 6 }}>Fecha regreso</label>
              <input
                type="date"
                value={form.return_date}
                onChange={(e) => setForm({ ...form, return_date: e.target.value })}
                style={INPUT_STYLE}
              />
            </div>
          </div>

          {/* Pasajeros + Monto */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label className="label-ui" style={{ display: 'block', marginBottom: 6 }}>Pasajeros</label>
              <input
                type="number"
                min="1"
                value={form.num_passengers}
                onChange={(e) => setForm({ ...form, num_passengers: e.target.value })}
                style={INPUT_STYLE}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label-ui" style={{ display: 'block', marginBottom: 6 }}>Monto MXN *</label>
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="25000"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                style={INPUT_STYLE}
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="label-ui" style={{ display: 'block', marginBottom: 6 }}>Notas</label>
            <textarea
              placeholder="Hotel, tipo de paquete, preferencias..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              style={{ ...INPUT_STYLE, resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>

          {formError && (
            <div style={{ background: '#FDEEEE', color: '#c0221a', border: '1px solid #E63329', borderRadius: 10, padding: '10px 14px', fontSize: '0.85rem', fontWeight: 500 }}>
              {formError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="xidhu-btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </button>
            <button className="xidhu-btn-primary" onClick={saveSale} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar venta'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponentes
// ─────────────────────────────────────────────────────────────────────────────

type KPICardProps = {
  label: string
  value: string
  sub?: string
  color: string
  delta?: number
  isUp?: boolean
  isFlat?: boolean
  comparisonLabel?: string
  loading?: boolean
}

function KPICard({ label, value, sub, color, delta, isUp, isFlat, comparisonLabel, loading }: KPICardProps) {
  return (
    <div className="xidhu-card">
      <p className="label-ui" style={{ marginBottom: 10 }}>{label}</p>
      <p style={{ fontSize: '1.7rem', fontWeight: 700, color, margin: '4px 0', fontFamily: "'Playfair Display', serif" }}>
        {loading ? '—' : value}
      </p>
      {sub && (
        <p style={{ color: '#9ca3af', fontSize: '0.78rem', margin: 0 }}>{sub}</p>
      )}
      {!loading && delta !== undefined && comparisonLabel && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          {isFlat ? (
            <span style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600 }}>= sin cambio</span>
          ) : (
            <span style={{ fontSize: '0.78rem', color: isUp ? '#5DB544' : '#E63329', fontWeight: 700 }}>
              {isUp ? '↑' : '↓'} {delta}%
            </span>
          )}
          <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{comparisonLabel}</span>
        </div>
      )}
    </div>
  )
}
