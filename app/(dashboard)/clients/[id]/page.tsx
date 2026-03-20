'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getClientById, getQuotesByClient, formatCurrency, formatDate, getUserById } from '@/lib/mock-data'
import StatusBadge from '@/components/ui/StatusBadge'
import SourceBadge from '@/components/ui/SourceBadge'

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const client = getClientById(id)
  const [notes, setNotes] = useState(client?.notes ?? '')
  const [saved, setSaved] = useState(false)

  if (!client) {
    return (
      <div className="xidhu-card" style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ fontSize: '2rem' }}>😕</p>
        <p style={{ color: '#9ca3af' }}>Cliente no encontrado.</p>
        <button className="xidhu-btn-primary" onClick={() => router.push('/clients')}>Volver</button>
      </div>
    )
  }

  const quotes = getQuotesByClient(id)
  const exec = getUserById(client.created_by)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

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
            {client.full_name.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>{client.full_name}</h1>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>📞 {client.phone}</span>
              <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>✉️ {client.email}</span>
              <SourceBadge source={client.source} />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p className="label-ui" style={{ marginBottom: 4 }}>Ejecutivo</p>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>{exec?.name}</p>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#9ca3af' }}>Desde {formatDate(client.created_at)}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, flexWrap: 'wrap' }}>

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

        {/* Notas */}
        <div className="xidhu-card">
          <p className="label-ui" style={{ marginBottom: 4 }}>Perfil</p>
          <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem' }}>Notas del cliente</h2>
          <textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setSaved(false) }}
            rows={6}
            style={{
              width: '100%',
              padding: '12px 14px',
              border: '1.5px solid #e5e7eb',
              borderRadius: 10,
              fontSize: '0.875rem',
              fontFamily: "'DM Sans', sans-serif",
              resize: 'vertical',
              outline: 'none',
              color: '#1A1A2E',
              lineHeight: 1.6,
              boxSizing: 'border-box',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#2DC4C4')}
            onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
          />
          <button
            className="xidhu-btn-primary"
            onClick={handleSave}
            style={{ marginTop: 14, width: '100%' }}
          >
            {saved ? '✓ Guardado' : 'Guardar notas'}
          </button>

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
