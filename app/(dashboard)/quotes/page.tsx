'use client'

import { useState, useEffect, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { Quote, QuoteStatus, formatCurrency, formatDate, todayStr } from '@/lib/mock-data'
import { getStoredClients, getStoredQuotes, insertQuote, updateQuoteStatus as updateStatus, deleteQuote, updateQuote } from '@/lib/store'
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
    subtotal: '', discount_pct: '', tax_pct: '16', cost: '',
  })
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null)
  const [execFilter, setExecFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortCol, setSortCol] = useState<SortCol | ''>('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    const user = getCurrentUser()
    getStoredQuotes().then((all) => {
      setQuotes(user?.role === 'admin' ? all : all.filter((q) => q.created_by === user?.id))
    })
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
      const createdDate = q.created_at?.slice(0, 10) ?? ''
      const matchDate = (!dateFrom || createdDate >= dateFrom) && (!dateTo || createdDate <= dateTo)
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

  const openEditModal = (q: Quote) => {
    setEditingQuote(q)
    setForm({
      client_id: q.client_id,
      destination: q.destination,
      travel_date: q.travel_date ?? '',
      return_date: q.return_date ?? '',
      num_passengers: String(q.num_passengers ?? 2),
      amount: q.amount ? String(q.amount) : '',
      notes: q.notes ?? '',
      sale_type: q.sale_type ?? '',
      subtotal: q.subtotal != null ? String(q.subtotal) : '',
      discount_pct: q.discount_pct != null ? String(q.discount_pct) : '',
      tax_pct: q.tax_pct != null ? String(q.tax_pct) : '16',
      cost: q.cost != null ? String(q.cost) : '',
    })
    getStoredClients().then(setClients)
    setModalOpen(true)
  }

  const saveQuote = async () => {
    if (!form.client_id || !form.destination.trim()) return

    // Si hay subtotal, recalcular amount = subtotal * (1 - desc%) * (1 + iva%)
    const sub = parseFloat(form.subtotal)
    const disc = parseFloat(form.discount_pct) || 0
    const tax = parseFloat(form.tax_pct) || 0
    const cost = parseFloat(form.cost)
    let finalAmount = parseFloat(form.amount) || 0
    if (!isNaN(sub) && sub > 0) {
      finalAmount = Math.round(sub * (1 - disc / 100) * (1 + tax / 100) * 100) / 100
    }

    const breakdownFields = {
      subtotal: !isNaN(sub) && sub > 0 ? sub : null,
      discount_pct: !isNaN(sub) && sub > 0 ? disc : null,
      tax_pct: !isNaN(sub) && sub > 0 ? tax : null,
      cost: !isNaN(cost) && cost >= 0 ? cost : null,
    }

    if (editingQuote) {
      const updatedFields: Partial<Quote> = {
        client_id: form.client_id,
        destination: form.destination.trim(),
        travel_date: form.travel_date,
        return_date: form.return_date,
        num_passengers: parseInt(form.num_passengers) || 1,
        amount: finalAmount,
        notes: form.notes.trim(),
        sale_type: form.sale_type,
        ...breakdownFields,
      }
      await updateQuote(editingQuote.id, updatedFields)
      setQuotes((prev) => prev.map((q) => q.id === editingQuote.id ? { ...q, ...updatedFields } : q))
      setEditingQuote(null)
    } else {
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
        amount: finalAmount,
        status: 'pendiente',
        notes: form.notes.trim(),
        follow_up_date: `${followUp.getFullYear()}-${String(followUp.getMonth()+1).padStart(2,'0')}-${String(followUp.getDate()).padStart(2,'0')}`,
        created_at: `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`,
        created_by: user?.id ?? 'u1',
        sale_type: form.sale_type,
        ...breakdownFields,
      }
      await insertQuote(newQuote)
      setQuotes((prev) => [newQuote, ...prev])
    }

    setForm({ client_id: '', destination: '', travel_date: '', return_date: '', num_passengers: '2', amount: '', notes: '', sale_type: '', subtotal: '', discount_pct: '', tax_pct: '16', cost: '' })
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
    const fecha = todayStr()
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
          <button className="xidhu-btn-primary" onClick={() => { setEditingQuote(null); setForm({ client_id: '', destination: '', travel_date: '', return_date: '', num_passengers: '2', amount: '', notes: '', sale_type: '', subtotal: '', discount_pct: '', tax_pct: '16', cost: '' }); getStoredClients().then(setClients); setModalOpen(true) }}>
            + Nueva cotización
          </button>
        </div>
      </div>

      {/* Stats mini (todas las cotizaciones) */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Pendientes', status: 'pendiente', value: stats.pendiente, color: '#F5C12E', bg: '#FEF9E7' },
          { label: 'Ganadas',    status: 'ganada',    value: stats.ganada,    color: '#5DB544', bg: '#EAF7E4' },
          { label: 'Perdidas',   status: 'perdida',   value: stats.perdida,   color: '#E63329', bg: '#FDEEEE' },
          { label: 'Todas',      status: 'todas',     value: stats.pendiente + stats.ganada + stats.perdida, color: '#2DC4C4', bg: '#E8F9F9' },
        ].map((s) => {
          const isAllCard = s.status === 'todas'
          const isAllActive = statusFilter === '' && dateFrom === '' && dateTo === ''
          const isActive = isAllCard ? isAllActive : statusFilter === s.status
          return (
            <div
              key={s.label}
              style={{ padding: '12px 20px', background: s.bg, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', border: isActive ? `2px solid ${s.color}` : '2px solid transparent' }}
              onClick={() => {
                if (isAllCard) {
                  if (isAllActive) {
                    // Ya estaba mostrando todas → volver al default (mes actual sin filtro de estatus)
                    setStatusFilter('')
                    setDateFrom(DEFAULT_FROM)
                    setDateTo(DEFAULT_TO)
                  } else {
                    // Mostrar TODAS las cotizaciones (sin filtro de estatus ni de fechas)
                    setStatusFilter('')
                    setDateFrom('')
                    setDateTo('')
                  }
                  return
                }
                const newStatus = statusFilter === s.status ? '' : s.status
                setStatusFilter(newStatus)
                if (newStatus) {
                  // Al activar filtro por estatus, abrir rango de fechas a todo el tiempo
                  setDateFrom('')
                  setDateTo('')
                } else {
                  // Al desactivar, volver al rango default (mes actual)
                  setDateFrom(DEFAULT_FROM)
                  setDateTo(DEFAULT_TO)
                }
              }}
            >
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: '0.8rem', color: s.color, fontWeight: 600 }}>{s.label}</span>
            </div>
          )
        })}
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
                <th onClick={() => handleSort('client')}        style={thStyle('client')}>Cliente{sortIcon('client')}</th>
                <th onClick={() => handleSort('destination')}   style={thStyle('destination')}>Destino{sortIcon('destination')}</th>
                <th onClick={() => handleSort('travel_date')}   style={thStyle('travel_date')}>Fecha{sortIcon('travel_date')}</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '0.7rem', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 600, color: '#2DC4C4' }}>Pax</th>
                <th onClick={() => handleSort('created_by')}    style={thStyle('created_by')}>Ejecutivo{sortIcon('created_by')}</th>
                <th onClick={() => handleSort('follow_up_date')} style={thStyle('follow_up_date')}>Follow-up{sortIcon('follow_up_date')}</th>
                <th onClick={() => handleSort('status')}        style={thStyle('status')}>Estatus{sortIcon('status')}</th>
                <th onClick={() => handleSort('amount')}        style={thStyle('amount')}>Monto{sortIcon('amount')}</th>
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
                    <td style={{ padding: '14px 20px', fontSize: '0.8rem' }}>
                      <span style={{ background: '#EAF7F7', color: '#2DC4C4', borderRadius: 9999, padding: '3px 10px', fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {EXEC_NAMES[q.created_by] ?? '—'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '0.78rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>{q.follow_up_date ? formatDate(q.follow_up_date) : '—'}</td>
                    <td style={{ padding: '14px 20px' }}><StatusBadge status={q.status} /></td>
                    <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: '0.875rem', color: '#1A1A2E', whiteSpace: 'nowrap' }}>{formatCurrency(q.amount)}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button onClick={() => openEditModal(q)} style={{ background: 'rgba(45,196,196,0.1)', color: '#2DC4C4', border: '1px solid #2DC4C4', borderRadius: 9999, padding: '4px 10px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>✎ Editar</button>
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
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditingQuote(null) }} title={editingQuote ? 'Editar Cotización' : 'Nueva Cotización'}>
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
          <div>
            <label className="label-ui" style={{ display: 'block', marginBottom: 6 }}>Pasajeros</label>
            <input type="number" min="1" value={form.num_passengers} onChange={(e) => setForm({ ...form, num_passengers: e.target.value })} style={INPUT_STYLE} />
          </div>

          {/* ────── Desglose financiero ────── */}
          {(() => {
            const sub = parseFloat(form.subtotal)
            const disc = parseFloat(form.discount_pct) || 0
            const tax = parseFloat(form.tax_pct) || 0
            const useBreakdown = !isNaN(sub) && sub > 0
            const descAmount = useBreakdown ? sub * (disc / 100) : 0
            const baseConDesc = useBreakdown ? sub - descAmount : 0
            const ivaAmount = useBreakdown ? baseConDesc * (tax / 100) : 0
            const total = useBreakdown
              ? Math.round((baseConDesc + ivaAmount) * 100) / 100
              : parseFloat(form.amount) || 0
            const cost = parseFloat(form.cost)
            const ganancia = !isNaN(cost) && total > 0 ? total - cost : null
            const margen = ganancia != null && total > 0 ? (ganancia / total) * 100 : null
            return (
              <div style={{ background: '#FAFAF6', borderRadius: 12, padding: '16px 18px', border: '1px solid #f3f4f6' }}>
                <p className="label-ui" style={{ marginBottom: 12 }}>Desglose financiero</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>Subtotal</label>
                    <input type="number" min="0" step="0.01" placeholder="25000" value={form.subtotal} onChange={(e) => setForm({ ...form, subtotal: e.target.value })} style={{ ...INPUT_STYLE, padding: '9px 12px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>Descuento %</label>
                    <input type="number" min="0" max="100" step="0.01" placeholder="0" value={form.discount_pct} onChange={(e) => setForm({ ...form, discount_pct: e.target.value })} style={{ ...INPUT_STYLE, padding: '9px 12px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>IVA %</label>
                    <input type="number" min="0" max="100" step="0.01" placeholder="16" value={form.tax_pct} onChange={(e) => setForm({ ...form, tax_pct: e.target.value })} style={{ ...INPUT_STYLE, padding: '9px 12px' }} />
                  </div>
                </div>

                {!useBreakdown && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>O ingresa monto directo (sin desglose)</label>
                    <input type="number" min="0" placeholder="25000" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ ...INPUT_STYLE, padding: '9px 12px' }} />
                  </div>
                )}

                {useBreakdown && (
                  <div style={{ background: 'white', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: '0.82rem', color: '#4A4A5A' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                      <span>Subtotal</span>
                      <span>{formatCurrency(sub)}</span>
                    </div>
                    {disc > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', color: '#E63329' }}>
                        <span>Descuento ({disc}%)</span>
                        <span>− {formatCurrency(descAmount)}</span>
                      </div>
                    )}
                    {tax > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                        <span>IVA ({tax}%)</span>
                        <span>+ {formatCurrency(ivaAmount)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0 2px', borderTop: '1px dashed #e5e7eb', marginTop: 6, fontWeight: 700, color: '#1A1A2E', fontSize: '0.95rem' }}>
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>
                    Costo del paquete <span style={{ color: '#9ca3af' }}>— lo que te cuesta a ti (opcional)</span>
                  </label>
                  <input type="number" min="0" step="0.01" placeholder="18000" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} style={{ ...INPUT_STYLE, padding: '9px 12px' }} />
                </div>

                {ganancia != null && (
                  <div style={{ marginTop: 10, background: ganancia >= 0 ? '#EAF7E4' : '#FDEEEE', borderRadius: 10, padding: '8px 14px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: ganancia >= 0 ? '#3a8a27' : '#c0221a', fontWeight: 600 }}>
                    <span>Ganancia estimada{margen != null ? ` (${margen.toFixed(1)}%)` : ''}</span>
                    <span>{formatCurrency(ganancia)}</span>
                  </div>
                )}
              </div>
            )
          })()}

          <div>
            <label className="label-ui" style={{ display: 'block', marginBottom: 6 }}>Notas</label>
            <textarea placeholder="Hotel, tipo de paquete, preferencias..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} style={{ ...INPUT_STYLE, resize: 'vertical', lineHeight: 1.5 }} />
          </div>
          <div style={{ background: '#EAF7F7', borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem', color: '#2DC4C4', fontWeight: 500 }}>
            📅 Follow-up automático programado para 2 días después de guardar.
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="xidhu-btn-secondary" onClick={() => { setModalOpen(false); setEditingQuote(null) }}>Cancelar</button>
            <button className="xidhu-btn-primary" onClick={saveQuote}>{editingQuote ? 'Actualizar cotización' : 'Guardar cotización'}</button>
          </div>
        </div>
      </Modal>

      {/* Modal detalle (desglose + notas) */}
      <Modal open={!!selectedQuote} onClose={() => setSelectedQuote(null)} title={`Detalle — ${clientById(selectedQuote?.client_id ?? '')?.full_name ?? ''}`}>
        {selectedQuote && (() => {
          const sub = selectedQuote.subtotal ?? null
          const disc = selectedQuote.discount_pct ?? 0
          const tax = selectedQuote.tax_pct ?? 0
          const hasBreakdown = sub != null && sub > 0
          const descAmount = hasBreakdown ? sub * (disc / 100) : 0
          const baseConDesc = hasBreakdown ? sub - descAmount : 0
          const ivaAmount = hasBreakdown ? baseConDesc * (tax / 100) : 0
          const cost = selectedQuote.cost
          const ganancia = cost != null && selectedQuote.amount > 0 ? selectedQuote.amount - cost : null
          const margen = ganancia != null && selectedQuote.amount > 0 ? (ganancia / selectedQuote.amount) * 100 : null
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Info viaje */}
              <div style={{ fontSize: '0.85rem', color: '#4A4A5A' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#1A1A2E' }}>✈️ {selectedQuote.destination} · {selectedQuote.num_passengers} pax</p>
                <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.78rem' }}>📅 {selectedQuote.travel_date ? formatDate(selectedQuote.travel_date) : '—'} → {selectedQuote.return_date ? formatDate(selectedQuote.return_date) : '—'}</p>
              </div>

              {/* Desglose tipo factura */}
              {hasBreakdown ? (
                <div style={{ background: '#FAFAF6', borderRadius: 12, padding: '14px 18px', fontSize: '0.88rem', color: '#4A4A5A' }}>
                  <p className="label-ui" style={{ marginBottom: 8 }}>Desglose</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <span>Subtotal</span>
                    <span>{formatCurrency(sub)}</span>
                  </div>
                  {disc > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#E63329' }}>
                      <span>Descuento ({disc}%)</span>
                      <span>− {formatCurrency(descAmount)}</span>
                    </div>
                  )}
                  {tax > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                      <span>IVA ({tax}%)</span>
                      <span>+ {formatCurrency(ivaAmount)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 2px', borderTop: '1px dashed #d1d5db', marginTop: 6, fontWeight: 700, color: '#1A1A2E', fontSize: '1rem' }}>
                    <span>Total</span>
                    <span>{formatCurrency(selectedQuote.amount)}</span>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#FAFAF6', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#4A4A5A', fontWeight: 600 }}>Monto</span>
                  <span style={{ fontWeight: 700, color: '#1A1A2E', fontSize: '1rem' }}>{formatCurrency(selectedQuote.amount)}</span>
                </div>
              )}

              {/* Ganancia */}
              {ganancia != null && (
                <div style={{ background: ganancia >= 0 ? '#EAF7E4' : '#FDEEEE', borderRadius: 10, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: ganancia >= 0 ? '#3a8a27' : '#c0221a', fontWeight: 600 }}>
                  <span>Ganancia{margen != null ? ` (${margen.toFixed(1)}%)` : ''}</span>
                  <span>{formatCurrency(ganancia)}</span>
                </div>
              )}

              {/* Notas */}
              <div>
                <p className="label-ui" style={{ marginBottom: 6 }}>Notas</p>
                <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#1A1A2E', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {selectedQuote.notes || <span style={{ color: '#9ca3af' }}>Sin notas registradas.</span>}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="xidhu-btn-secondary" onClick={() => setSelectedQuote(null)}>Cerrar</button>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
