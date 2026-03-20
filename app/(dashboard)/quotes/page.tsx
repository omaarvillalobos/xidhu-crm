'use client'

import { useState, useEffect } from 'react'
import { Quote, QuoteStatus, formatCurrency, formatDate } from '@/lib/mock-data'
import { getStoredClients, getStoredQuotes, insertQuote, updateQuoteStatus as updateStatus } from '@/lib/store'
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

const INPUT_STYLE = {
  width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb',
  borderRadius: 10, fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif",
  outline: 'none', boxSizing: 'border-box' as const, color: '#1A1A2E',
}

const EXEC_NAMES: Record<string, string> = { u1: 'Ana García', u2: 'Carlos López', u3: 'María Torres' }

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [form, setForm] = useState({
    client_id: '', destination: '', travel_date: '', return_date: '',
    num_passengers: '2', amount: '', notes: '',
  })

  useEffect(() => {
    getStoredQuotes().then(setQuotes)
    getStoredClients().then(setClients)
  }, [])

  const clientById = (id: string) => clients.find((c) => c.id === id)

  const filtered = quotes.filter((q) => {
    const client = clientById(q.client_id)
    const matchSearch =
      q.destination.toLowerCase().includes(search.toLowerCase()) ||
      (client?.full_name.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchStatus = !statusFilter || q.status === statusFilter
    return matchSearch && matchStatus
  })

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
    }
    await insertQuote(newQuote)
    setQuotes((prev) => [newQuote, ...prev])
    setForm({ client_id: '', destination: '', travel_date: '', return_date: '', num_passengers: '2', amount: '', notes: '' })
    setModalOpen(false)
  }

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
        <button className="xidhu-btn-primary" onClick={() => { getStoredClients().then(setClients); setModalOpen(true) }}>
          + Nueva cotización
        </button>
      </div>

      {/* Stats mini */}
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
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <input type="text" placeholder="🔍  Buscar por destino o cliente..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...INPUT_STYLE, maxWidth: 340, flex: 1 }} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...INPUT_STYLE, maxWidth: 200 }}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <span style={{ color: '#9ca3af', fontSize: '0.85rem', alignSelf: 'center' }}>
            {filtered.length} cotización{filtered.length !== 1 ? 'es' : ''}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="xidhu-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 950 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                {['Cliente', 'Destino', 'Viaje', 'Pax', 'Monto', 'Ejecutivo', 'Follow-up', 'Estatus', 'Acciones'].map((h) => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '0.7rem', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 600, color: '#2DC4C4' }}>
                    {h}
                  </th>
                ))}
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
                      {q.status === 'pendiente' ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => changeStatus(q.id, 'ganada')} style={{ background: '#EAF7E4', color: '#3a8a27', border: '1px solid #5DB544', borderRadius: 9999, padding: '4px 10px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>✓ Ganada</button>
                          <button onClick={() => changeStatus(q.id, 'perdida')} style={{ background: '#FDEEEE', color: '#c0221a', border: '1px solid #E63329', borderRadius: 9999, padding: '4px 10px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>✗ Perdida</button>
                        </div>
                      ) : (
                        <span style={{ color: '#d1d5db', fontSize: '0.78rem' }}>—</span>
                      )}
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
          </table>
        </div>
      </div>

      {/* Modal */}
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
