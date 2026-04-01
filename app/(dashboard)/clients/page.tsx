'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Client, Source, formatDate, todayStr } from '@/lib/mock-data'
import { getStoredClients, insertClient, deleteClient, getStoredQuotes } from '@/lib/store'
import { getCurrentUser } from '@/lib/auth'
import { exportToExcel } from '@/lib/export'
import SourceBadge from '@/components/ui/SourceBadge'
import Modal from '@/components/ui/Modal'

const SOURCE_OPTIONS = [
  { value: '', label: 'Todas las fuentes' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'referido', label: 'Referido' },
  { value: 'otro', label: 'Otro' },
]

const INPUT_STYLE = {
  width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb',
  borderRadius: 10, fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif",
  outline: 'none', boxSizing: 'border-box' as const, color: '#1A1A2E',
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', source: 'whatsapp', notes: '' })

  useEffect(() => {
    const user = getCurrentUser()
    getStoredClients().then((all) => {
      if (user?.role === 'admin') {
        setClients(all)
      } else {
        setClients(all.filter((c) => c.created_by === user?.id))
      }
    })
  }, [])

  const saveClient = async () => {
    if (!form.name.trim()) return
    const user = getCurrentUser()
    const newClient: Client = {
      id: `c${Date.now()}`,
      full_name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      source: form.source as Source,
      notes: form.notes.trim(),
      created_at: todayStr(),
      created_by: user?.id ?? 'u1',
    }
    await insertClient(newClient)
    setClients((prev) => [newClient, ...prev])
    setForm({ name: '', phone: '', email: '', source: 'whatsapp', notes: '' })
    setModalOpen(false)
  }

  const removeClient = async (id: string) => {
    if (!confirm('¿Eliminar este cliente?')) return
    await deleteClient(id)
    setClients((prev) => prev.filter((c) => c.id !== id))
  }

  const filtered = clients.filter((c) => {
    const matchSearch = c.full_name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
    const matchSource = !sourceFilter || c.source === sourceFilter
    return matchSearch && matchSource
  })

  // Lookup ejecutivo por id desde los usuarios hardcodeados
  const execName = (id: string) => {
    const map: Record<string, string> = { u1: 'Mariana', u2: 'Eduardo', u3: 'Issori' }
    return map[id] ?? '—'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <p className="label-ui" style={{ marginBottom: 4 }}>Base de datos</p>
          <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Clientes</h1>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="xidhu-btn-secondary" onClick={async () => { const quotes = await getStoredQuotes(); exportToExcel(clients, quotes) }}>
            ↓ Exportar Excel
          </button>
          <button className="xidhu-btn-primary" onClick={() => setModalOpen(true)}>
            + Nuevo cliente
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="xidhu-card" style={{ marginBottom: 20, padding: '16px 24px' }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍  Buscar por nombre o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...INPUT_STYLE, maxWidth: 320, flex: 1 }}
          />
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} style={{ ...INPUT_STYLE, maxWidth: 200, flex: '0 1 auto' }}>
            {SOURCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <span style={{ color: '#9ca3af', fontSize: '0.85rem', alignSelf: 'center' }}>
            {filtered.length} cliente{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="xidhu-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                {['Cliente', 'Teléfono', 'Fuente', 'Ejecutivo', 'Registro', ''].map((h) => (
                  <th key={h} style={{ padding: '14px 24px', textAlign: 'left', fontSize: '0.7rem', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 600, color: '#2DC4C4' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f9fafb' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = '#FAFAF6')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')}
                >
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9999, background: '#EAF7F7', color: '#2DC4C4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                        {c.full_name.charAt(0)}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#1A1A2E' }}>{c.full_name}</p>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#9ca3af' }}>{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', color: '#4A4A5A', fontSize: '0.875rem' }}>{c.phone}</td>
                  <td style={{ padding: '16px 24px' }}><SourceBadge source={c.source} /></td>
                  <td style={{ padding: '16px 24px', fontSize: '0.875rem', color: '#4A4A5A' }}>{execName(c.created_by)}</td>
                  <td style={{ padding: '16px 24px', fontSize: '0.875rem', color: '#9ca3af' }}>{formatDate(c.created_at)}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link href={`/clients/${c.id}`} style={{ background: 'rgba(45,196,196,0.1)', color: '#2DC4C4', borderRadius: 9999, padding: '6px 14px', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                        Ver perfil →
                      </Link>
                      <button onClick={() => removeClient(c.id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: 9999, padding: '6px 14px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    {clients.length === 0 ? 'Aún no hay clientes registrados.' : `Sin resultados para "${search}"`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo Cliente">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { label: 'Nombre completo', key: 'name', type: 'text', placeholder: 'Ej. Juan García López' },
            { label: 'Teléfono', key: 'phone', type: 'tel', placeholder: '55 1234 5678' },
            { label: 'Correo electrónico', key: 'email', type: 'email', placeholder: 'juan@email.com' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="label-ui" style={{ display: 'block', marginBottom: 6 }}>{label}</label>
              <input type={type} placeholder={placeholder} value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} style={INPUT_STYLE} />
            </div>
          ))}
          <div>
            <label className="label-ui" style={{ display: 'block', marginBottom: 6 }}>Fuente</label>
            <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} style={INPUT_STYLE}>
              {SOURCE_OPTIONS.filter((o) => o.value).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label-ui" style={{ display: 'block', marginBottom: 6 }}>Notas</label>
            <textarea placeholder="Intereses, preferencias, referencias..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} style={{ ...INPUT_STYLE, resize: 'vertical', lineHeight: 1.5 }} />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="xidhu-btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="xidhu-btn-primary" onClick={saveClient}>Guardar cliente</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
