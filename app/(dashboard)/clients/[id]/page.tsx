'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Client, Quote, Source, formatCurrency, formatDate } from '@/lib/mock-data'
import StatusBadge from '@/components/ui/StatusBadge'
import SourceBadge from '@/components/ui/SourceBadge'

const SOURCE_OPTIONS: { value: Source; label: string }[] = [
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

const EXEC_NAMES: Record<string, string> = { u1: 'Mariana', u2: 'Eduardo', u3: 'Issori' }

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<Client | null>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', source: 'whatsapp' as Source, notes: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      const [{ data: c }, { data: qs }] = await Promise.all([
        supabase.from('clients').select('*').eq('id', id).maybeSingle(),
        supabase.from('quotes').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      ])
      if (cancelled) return
      const found = (c as Client | null) ?? null
      setClient(found)
      if (found) {
        setForm({
          full_name: found.full_name ?? '',
          phone: found.phone ?? '',
          email: found.email ?? '',
          source: (found.source ?? 'otro') as Source,
          notes: found.notes ?? '',
        })
      }
      setQuotes((qs as Quote[]) ?? [])
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [id])

  const handleSave = async () => {
    if (!client) return
    if (!form.full_name.trim()) return
    setSaving(true)
    const fields = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      source: form.source,
      notes: form.notes.trim(),
    }
    const { error } = await supabase.from('clients').update(fields).eq('id', client.id)
    setSaving(false)
    if (error) {
      alert('No se pudo guardar: ' + error.message)
      return
    }
    setClient({ ...client, ...fields })
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleCancel = () => {
    if (!client) return
    setForm({
      full_name: client.full_name ?? '',
      phone: client.phone ?? '',
      email: client.email ?? '',
      source: (client.source ?? 'otro') as Source,
      notes: client.notes ?? '',
    })
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="xidhu-card" style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ color: '#9ca3af' }}>Cargando cliente…</p>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="xidhu-card" style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ fontSize: '2rem' }}>😕</p>
        <p style={{ color: '#9ca3af' }}>Cliente no encontrado.</p>
        <button className="xidhu-btn-primary" onClick={() => router.push('/clients')}>Volver</button>
      </div>
    )
  }

  const execName = EXEC_NAMES[client.created_by] ?? '—'

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => router.push('/clients')}
        style={{
          background: 'none', border: 'none', color: '#2DC4C4',
          cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
          marginBottom: 20, padding: 0,
        }}
      >
        ← Volver a Clientes
      </button>

      {/* Header */}
      <div className="xidhu-card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: 9999,
              background: '#2DC4C4', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '1.5rem', flexShrink: 0,
            }}
          >
            {(client.full_name || '?').charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>{client.full_name}</h1>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>📞 {client.phone || '—'}</span>
              <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>✉️ {client.email || '—'}</span>
              <SourceBadge source={client.source} />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p className="label-ui" style={{ marginBottom: 4 }}>Ejecutivo</p>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>{execName}</p>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#9ca3af' }}>Desde {formatDate(client.created_at)}</p>
            {!editing && (
              <button
                className="xidhu-btn-secondary"
                onClick={() => setEditing(true)}
                style={{ marginTop: 10, padding: '6px 14px', fontSize: '0.8rem' }}
              >
                ✎ Editar
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, flexWrap: 'wrap' }}>

        {/* Cotizaciones */}
        <div className="xidhu-card">
          <p className="label-ui" style={{ marginBottom: 4 }}>Historial</p>
          <h2 style={{ margin: '0 0 20px', fontSize: '1.1rem' }}>Cotizaciones ({quotes.length})</h2>
          {quotes.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>Sin cotizaciones aún.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {quotes.map((q) => (
                <div
                  key={q.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 16px',
                    background: '#FAFAF6',
                    borderRadius: 12,
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#1A1A2E' }}>
                      ✈️ {q.destination}
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>
                      {formatDate(q.travel_date)} · {q.num_passengers} pax · {formatCurrency(q.amount)}
                    </p>
                  </div>
                  <StatusBadge status={q.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Datos del cliente */}
        <div className="xidhu-card">
          <p className="label-ui" style={{ marginBottom: 4 }}>Perfil</p>
          <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem' }}>
            {editing ? 'Editar cliente' : 'Datos del cliente'}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="label-ui" style={{ display: 'block', marginBottom: 6 }}>Nombre completo</label>
              {editing ? (
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  style={INPUT_STYLE}
                />
              ) : (
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#1A1A2E' }}>{client.full_name || '—'}</p>
              )}
            </div>

            <div>
              <label className="label-ui" style={{ display: 'block', marginBottom: 6 }}>Teléfono</label>
              {editing ? (
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  style={INPUT_STYLE}
                />
              ) : (
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#1A1A2E' }}>{client.phone || '—'}</p>
              )}
            </div>

            <div>
              <label className="label-ui" style={{ display: 'block', marginBottom: 6 }}>Correo electrónico</label>
              {editing ? (
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={INPUT_STYLE}
                />
              ) : (
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#1A1A2E' }}>{client.email || '—'}</p>
              )}
            </div>

            <div>
              <label className="label-ui" style={{ display: 'block', marginBottom: 6 }}>Fuente</label>
              {editing ? (
                <select
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value as Source })}
                  style={INPUT_STYLE}
                >
                  {SOURCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <SourceBadge source={client.source} />
              )}
            </div>

            <div>
              <label className="label-ui" style={{ display: 'block', marginBottom: 6 }}>Notas</label>
              {editing ? (
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={5}
                  style={{ ...INPUT_STYLE, resize: 'vertical', lineHeight: 1.5 }}
                />
              ) : (
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#1A1A2E', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {client.notes || <span style={{ color: '#9ca3af' }}>Sin notas.</span>}
                </p>
              )}
            </div>
          </div>

          {editing ? (
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button className="xidhu-btn-secondary" onClick={handleCancel} disabled={saving} style={{ flex: 1 }}>
                Cancelar
              </button>
              <button className="xidhu-btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          ) : saved ? (
            <p style={{ margin: '14px 0 0', color: '#5DB544', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>
              ✓ Cambios guardados
            </p>
          ) : null}

          {/* Stats */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '1.5rem', color: '#2DC4C4' }}>{quotes.length}</p>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 2 }}>Cotizaciones</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '1.5rem', color: '#5DB544' }}>
                  {quotes.filter((q) => q.status === 'ganada').length}
                </p>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 2 }}>Compras</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '1.5rem', color: '#F47B20' }}>
                  {formatCurrency(quotes.filter((q) => q.status === 'ganada').reduce((s, q) => s + q.amount, 0)).replace(' MXN', '')}
                </p>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 2 }}>Total</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
