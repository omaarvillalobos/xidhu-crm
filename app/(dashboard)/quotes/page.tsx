'use client'

import { useState, useEffect, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { Quote, QuoteStatus, formatCurrency, formatDate } from '@/lib/mock-data'
import { getStoredClients, getStoredQuotes, insertQuote, updateQuoteStatus as updateStatus, deleteQuote } from '@/lib/store'
import { getCurrentUser } from '@/lib/auth'
import { Client } from '@/lib/mock-data'
import StatusBadge from '@/components/ui/StatusBadge'
import Modal from '@/components/ui/Modal'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estatus' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'ganada', label: 'Ganada' },
  { value: 'perdida', label: 'Perdida' },
  { value: 'vencida', label: 'Vencida' },
]

const EXEC_OPTIONS = [
  { value: '', label: 'Todos los ejecutivos' },
  { value: 'u1', label: 'Mariana' },
  { value: 'u2', label: 'Eduardo' },
  { value: 'u3', label: 'Issori' },
]

const SALE_TYPE_OPTIONS = [
  { value: '', label: 'Tipo de venta...' },
  { value: 'Tours', label: 'Tours' },
  { value: 'Personalizado', label: 'Personalizado' },
  { value: 'Terrestre', label: 'Terrestre' },
  { value: 'Aéreo (solo vuelo)', label: 'Aéreo (solo vuelo)' },
  { value: 'Paquete', label: 'Paquete' },
]

const INPUT_STYLE = {
  width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb',
  borderRadius: 10, fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif",
  outline: 'none', boxSizing: 'border-box' as const, color: '#1A1A2E',
}

const EXEC_NAMES: Record<string, string> = { u1: 'Mariana', u2: 'Eduardo', u3: 'Issori' }

const now = new Date()
const DEFAULT_FROM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
const DEFAULT_TO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`

type SortCol = 'client' | 'destination' | 'travel_date' | 'amount' | 'status' | 'created_by' | 'follow_up_date'

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [form, setForm] = useState({
    client_id: '', destination: '', travel_date: '', return_date: '',
    num_passengers: '2', amount: '', notes: '', sale_type: '',
  })
  const [execFilter, setExecFilter] = useState('')
  const [dateFrom, setDateFrom] = useState(DEFAULT_FROM)
  const [dateTo, setDateTo] = useState(DEFAULT_TO)
  const [sortCol, setSortCol] = useState<SortCol | ''>('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    getStoredQuotes().then(setQuotes)
    getStoredClients().then(setClients)
  }, [])

  const clientById = (id: string) => clients.find((c) => c.id === id)

  const filtered = useMemo(() => {
    let result = quotes.filter((q) => {
      const client = clients.find((c) => c.id === q.client_id)
      const matchSearch =
        q.destination.toLowerCase().includes(search.toLowerCase()) ||
        (client?.full_name.toLowerCase().includes(search.toLowerCase()) ?? false)
      const matchStatus = !statusFilter || q.status === statusFilter
      const matchExec = !execFilter || q.created_by === execFilter
      const matchDate = (!dateFrom || q.created_at >= dateFrom) && (!dateTo || q.created_at <= dateTo)
      return matchSearch && matchStatus && matchExec && matchDate
    })
    if (sortCol) {
      result = [...result].sort((a, b) => {
        let va: any, vb: any
        if (sortCol === 'client') {
          va = clients.find((c) => c.id === a.client_id)?.full_name ?? ''
          vb = clients.find((c) => c.id === b.client_id)?.full_name ?? ''
        } else {
          va = (a as any)[sortCol] ?? ''
          vb = (b as any)[sortCol] ?? ''
        }
        if (va < vb) return sortDir === 'asc' ? -1 : 1
        if (va > vb) return sortDir === 'asc' ? 1 : -1
        return 0
      })
    }
    return result
  }, [quotes, clients, search, statusFilter, execFilter, dateFrom, dateTo, sortCol, sortDir])

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const sortIcon = (col: SortCol) => sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  const thStyle = (col: SortCol): React.CSSProperties => ({
    padding: '14px 20px', textAlign: 'left', fontSize: '0.7rem', letterSpacing: '3px',
    textTransform: 'uppercase', fontWeight: 600, color: '#2DC4C4',
    cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
    background: sortCol === col ? '#f0fafa' : 'transparent',
  })

  const removeQuote = async (id: string) => {
    if (!confirm('¿Eliminar esta cotización?')) return
    await deleteQuote(id)
    setQuotes((prev) => prev.filter((q) => q.id !== id))
  }

  const changeStatus = async (id: string, newStatus: QuoteStatus) => {
    await updateStatus(id, newStatus)
    setQuotes((prev) => prev.map((q) => q.id === id ? { ...q, status: newStatus } : q))
  }

  const saveQuote = async () => {
    if (!form.client_id || !form.destination.trim() || !form.amount) return
    const user = getCurrentUser()
    const today = new Date()
    const followUp = new Date(today)
    followUp.setDate(today.getDate() + 2)
    const newQuote: Quote = {
      id: `q${Date.now()}`,
      client_id: form.client_id,
      destination: form.destination.trim(),
      travel_date: form.travel_date,
      return_date: form.return_date,
      num_passengers: parseInt(form.num_passengers) || 1,
      amount: parseFloat(form.amount) || 0,
      status: 'pendiente',
      notes: form.notes.trim(),
      follow_up_date: followUp.toISOString().split('T')[0],
      created_at: today.toISOString().split('T')[0],
      created_by: user?.id ?? 'u1',
      sale_type: form.sale_type,
    }
    await insertQuote(newQuote)
    setQuotes((prev) => [newQuote, ...prev])
    setForm({ client_id: '', destination: '', travel_date: '', return_date: '', num_passengers: '2', amount: '', notes: '', sale_type: '' })
    setModalOpen(false)
  }

  const exportFiltered = () => {
    const wb = XLSX.utils.book_new()
    const rows = filtered.map((q, i) => {
      const client = clientById(q.client_id)
      return {
        'Folio':             `Q-${String(i + 1).padStart(4, '0')}`,
        'Cliente':           client?.full_name ?? '—',
        'Teléfono':          client?.phone ?? '—',
        'Destino':           q.destination,
        'Fecha Salida':      q.travel_date ? formatDate(q.travel_date) : '—',
        'Fecha Regreso':     q.return_date ? formatDate(q.return_date) : '—',
        'Pasajeros':         q.num_passengers,
        'Monto MXN':         q.amount,
        'Estatus':           q.status,
        'Ejecutivo':         EXEC_NAMES[q.created_by] ?? '—',
        'Fecha Cotización':  q.created_at ? formatDate(q.created_at) : '—',
        'Fecha Follow-up':   q.follow_up_date ? formatDate(q.follow_up_date) : '—',
        'Notas':             q.notes,
      }
    })
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ 'Sin datos': '' }])
    XLSX.utils.book_append_sheet(wb, ws, 'Cotizaciones')
    const fecha = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `Cotizaciones_Xidhu_${fecha}.xlsx`)
  }

  const filteredGanadas = filtered.filter((q) => q.status === 'ganada').length
  const filteredMonto = filtered.reduce((s, q) => s + (q.amount ?? 0), 0)
  const tasaCierre = filtered.length ? Math.round((filteredGanadas / filtered.length) * 100) : 0

  const stats = {
    pendiente: quotes.filter((q) => q.status === 'pendiente').length,
    ganada: quotes.filter((q) => q.status === 'ganada').length,
    perdida: quotes.filter((q) => q.status === 'perdida').length,
    total: quotes.reduce((s, q) => s + q.amount, 0),
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <p className="label-ui" style={{ marginBottom: 4 }}>Gestión</p>
          <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Cotizaciones</h1>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={exportFiltered}
            style={{ background: 'rgba(45,196,196,0.1)', color: '#2DC4C4', border: '1.5px solid #2DC4C4', borderRadius: 9999, padding: '10px 20px', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}
          >
            ↓ Exportar Excel
          </button>
          <button className="xidhu-btn-primary" onClick={() => { getStoredClients().then(setClients); setModalOpen(true) }}>
            + Nueva cotización
          </button>
        </div>
      </div>

      {/* Stats mini (todas las cotizaciones) */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Pendientes', value: stats.pendiente, color: '#F5C12E', bg: '#FEF9E7' },
          { label: 'Ganadas',    value: stats.ganada,    color: '#5DB544', bg: '#EAF7E4' },
          { label: 'Perdidas',   value: stats.perdida,   color: '#E63329', bg: '#FDEEEE' },
        ].map((s) => (
          <div
            key={s.label}
            style={{ padding: '12px 20px', background: s.bg, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', border: statusFilter === s.label.toLowerCase() ? `2px solid ${s.color}` : '2px solid transparent' }}
            onClick={() => setStatusFilter(statusFilter === s.label.toLowerCase() ? '' : s.label.toLowerCase())}
          >
            <span style={{ fontSize: '1.3rem', fontWeight: 700, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: '0.8rem', color: s.color, fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', padding: '12px 20px', background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <p className="label-ui" style={{ margin: '0 0 2px' }}>Total en cartera</p>
          <p style={{ margin: 0, fontWeight: 700, color: '#1A1A2E', fontSize: '1rem' }}>{formatCurrency(stats.total)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="xidhu-card" style={{ marginBottom: 20, padding: '16px 24px' }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" placeholder="🔍  Buscar por destino o cliente..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...INPUT_STYLE, maxWidth: 280, flex: 1 }} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...INPUT_STYLE, maxWidth: 180 }}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={execFilter} onChange={(e) => setExecFilter(e.target.value)} style={{ ...INPUT_STYLE, maxWidth: 190 }}>
            {EXEC_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.78rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>Del</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ ...INPUT_STYLE, maxWidth: 150 }} />
            <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>al</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ ...INPUT_STYLE, maxWidth: 150 }} />
          </div>
          <span style={{ color: '#9ca3af', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
            {filtered.length} cotización{filtered.length !== 1 ? 'es' : ''}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="xidhu-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                <th onClick={() => handleSort('client')}     style={thStyle('client')}>Cliente{sortIcon('client')}</th>
                <th onClick={() => handleSort('destination')} style={thStyle('destination')}>Destino{sortIcon('destination')}</th>
                <th onClick={() => handleSort('travel_date')} style={thStyle('travel_date')}>Viaje{sortIcon('travel_date')}</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '0.7rem', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 600, color: '#2DC4C4' }}>Pax</th>
                <th onClick={() => handleSort('amount')}      style={thStyle('amount')}>Monto{sortIcon('amount')}</th>
                <th onClick={() => handleSort('created_by')}  style={thStyle('created_by')}>Ejecutivo{sortIcon('created_by')}</th>
                <th onClick={() => handleSort('follow_up_date')} style={thStyle('follow_up_date')}>Follow-up{sortIcon('follow_up_date')}</th>
                <th onClick={() => handleSort('status')}      style={thStyle('status')}>Estatus{sortIcon('status')}</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '0.7rem', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 600, color: '#2DC4C4' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q, i) => {
                const client = clientById(q.client_id)
                return (
                  <tr key={q.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f9fafb' : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = '#FAFAF6')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 20px', fontWeight: 500, fontSize: '0.875rem', color: '#2DC4C4', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setSelectedQuote(q)}>{client?.full_name ?? '—'}</td>
                    <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: '#4A4A5A' }}>✈️ {q.destination}</td>
                    <td style={{ padding: '14px 20px', fontSize: '0.78rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>{q.travel_date ? formatDate(q.travel_date) : '—'}</td>
                    <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: '#4A4A5A', textAlign: 'center' }}>{q.num_passengers}</td>
                    <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: '0.875rem', color: '#1A1A2E', whiteSpace: 'nowrap' }}>{formatCurrency(q.amount)}</td>
                    <td style={{ padding: '14px 20px', fontSize: '0.8rem' }}>
                      <span style={{ background: '#EAF7F7', color: '#2DC4C4', borderRadius: 9999, padding: '3px 10px', fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {EXEC_NAMES[q.created_by] ?? '—'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '0.78rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>{q.follow_up_date ? formatDate(q.follow_up_date) : '—'}</td>
                    <td style={{ padding: '14px 20px' }}><StatusBadge status={q.status} /></td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {q.status === 'pendiente' && (
                          <>
                            <button onClick={() => changeStatus(q.id, 'ganada')} style={{ background: '#EAF7E4', color: '#3a8a27', border: '1px solid #5DB544', borderRadius: 9999, padding: '4px 10px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>✓ Ganada</button>
                            <button onClick={() => changeStatus(q.id, 'perdida')} style={{ background: '#FDEEEE', color: '#c0221a', border: '1px solid #E63329', borderRadius: 9999, padding: '4px 10px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>✗ Perdida</button>
                          </>
                        )}
                        <button onClick={() => removeQuote(q.id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: 9999, padding: '4px 10px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    {quotes.length === 0 ? 'Aún no hay cotizaciones registradas.' : 'Sin cotizaciones para los filtros seleccionados.'}
                  </td>
                </tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ borderTop: '2px solid #f3f4f6', background: '#FAFAF6' }}>
                  <td colSpan={4} style={{ padding: '12px 20px', fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600 }}>
                    {filtered.length} cotización{filtered.length !== 1 ? 'es' : ''} mostradas
                  </td>
                  <td style={{ padding: '12px 20px', fontWeight: 700, fontSize: '0.9rem', color: '#1A1A2E', whiteSpace: 'nowrap' }}>
                    {formatCurrency(filteredMonto)}
                  </td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal nueva cotización */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Cotización">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label-ui" style={{ display: 'block', marginBottom: 6 }}>Cliente</label>
            <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} style={INPUT_STYLE}>
              <option value="">Seleccionar cliente...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label-ui" style={{ display: 'block', marginBottom: 6 }}>Tipo de venta</label>
            <select value={form.sale_type} onChange={(e) => setForm({ ...form, sale_type: e.target.value })} style={INPUT_STYLE}>
              {SALE_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label-ui" style={{ display: 'block', marginBottom: 6 }}>Destino</label>
            <input type="text" placeholder="Ej. Cancún, México" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} style={INPUT_STYLE} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label-ui" style={{ display: 'block', marginBottom: 6 }}>Fecha salida</label>
              <input type="date" value={form.travel_date} onChange={(e) => setForm({ ...form, travel_date: e.target.value })} style={INPUT_STYLE} />
            </div>
            <div>
              <label className="label-ui" style={{ display: 'block', marginBottom: 6 }}>Fecha regreso</label>
              <input type="date" value={form.return_date} onChange={(e) => setForm({ ...form, return_date: e.target.value })} style={INPUT_STYLE} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label-ui" style={{ display: 'block', marginBottom: 6 }}>Pasajeros</label>
              <input type="number" min="1" value={form.num_passengers} onChange={(e) => setForm({ ...form, num_passengers: e.target.value })} style={INPUT_STYLE} />
            </div>
            <div>
              <label className="label-ui" style={{ display: 'block', marginBottom: 6 }}>Monto (MXN)</label>
              <input type="number" placeholder="25000" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={INPUT_STYLE} />
            </div>
          </div>
          <div>
            <label className="label-ui" style={{ display: 'block', marginBottom: 6 }}>Notas</label>
            <textarea placeholder="Hotel, tipo de paquete, preferencias..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} style={{ ...INPUT_STYLE, resize: 'vertical', lineHeight: 1.5 }} />
          </div>
          <div style={{ background: '#EAF7F7', borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem', color: '#2DC4C4', fontWeight: 500 }}>
            📅 Follow-up automático programado para 2 días después de guardar.
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="xidhu-btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="xidhu-btn-primary" onClick={saveQuote}>Guardar cotización</button>
          </div>
        </div>
      </Modal>

      {/* Modal notas */}
      <Modal open={!!selectedQuote} onClose={() => setSelectedQuote(null)} title={`Notas — ${clientById(selectedQuote?.client_id ?? '')?.full_name ?? ''}`}>
        {selectedQuote && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: '14px 16px' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#1A1A2E', lineHeight: 1.6 }}>
                {selectedQuote.notes || 'Sin notas registradas.'}
              </p>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
              <p style={{ margin: '0 0 4px' }}>✈️ {selectedQuote.destination} · {selectedQuote.num_passengers} pax · {formatCurrency(selectedQuote.amount)}</p>
              <p style={{ margin: 0 }}>📅 Viaje: {selectedQuote.travel_date ? formatDate(selectedQuote.travel_date) : '—'} → {selectedQuote.return_date ? formatDate(selectedQuote.return_date) : '—'}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="xidhu-btn-secondary" onClick={() => setSelectedQuote(null)}>Cerrar</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
