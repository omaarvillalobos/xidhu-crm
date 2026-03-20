'use client'

import { useState, useMemo, useEffect } from 'react'
import { formatCurrency, formatDate } from '@/lib/mock-data'
import { getStoredQuotes, getStoredClients } from '@/lib/store'

type FollowUpItem = {
  quoteId: string
  clientId: string
  followUpDate: string
  daysUntil: number // negativo = vencido, 0 = hoy, 1 = mañana, 2 = pasado
  dismissed: boolean
  postponed: number // cuántos días se ha pospuesto
}

function diffDays(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

import type { Client, Quote } from '@/lib/mock-data'

function buildFromQuotes(quotes: Quote[]): FollowUpItem[] {
  return quotes.filter((q) => q.status === 'pendiente' && q.follow_up_date)
    .map((q) => ({
      quoteId: q.id,
      clientId: q.client_id,
      followUpDate: q.follow_up_date,
      daysUntil: diffDays(q.follow_up_date),
      dismissed: false,
      postponed: 0,
    }))
    .filter((i) => i.daysUntil <= 2)
    .sort((a, b) => a.daysUntil - b.daysUntil)
}

function sectionLabel(days: number) {
  if (days < 0) return { label: `Vencido hace ${Math.abs(days)} día${Math.abs(days) > 1 ? 's' : ''}`, color: '#E63329', bg: '#FDEEEE', border: '#E63329' }
  if (days === 0) return { label: 'Hoy', color: '#E63329', bg: '#FDEEEE', border: '#E63329' }
  if (days === 1) return { label: 'Mañana', color: '#d4a017', bg: '#FEF9E7', border: '#F5C12E' }
  return { label: 'En 2 días', color: '#2DC4C4', bg: '#E8F9F9', border: '#2DC4C4' }
}

export default function FollowUpsPage() {
  const [items, setItems] = useState<FollowUpItem[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])

  useEffect(() => {
    getStoredQuotes().then((q) => { setQuotes(q); setItems(buildFromQuotes(q)) })
    getStoredClients().then(setClients)
  }, [])

  const dismiss = (qid: string) =>
    setItems((prev) => prev.map((i) => i.quoteId === qid ? { ...i, dismissed: true } : i))

  const postpone = (qid: string) =>
    setItems((prev) =>
      prev.map((i) => {
        if (i.quoteId !== qid) return i
        const newDays = i.daysUntil + 1
        return { ...i, daysUntil: newDays, postponed: i.postponed + 1 }
      })
    )

  const visible = items.filter((i) => !i.dismissed && i.daysUntil <= 2)
  const done = items.filter((i) => i.dismissed).length
  const total = items.length

  // Agrupar: vencidos (< 0), hoy (0), mañana (1), en 2 días (2)
  const groups = useMemo(() => {
    const overdue = visible.filter((i) => i.daysUntil < 0)
    const today   = visible.filter((i) => i.daysUntil === 0)
    const tomorrow = visible.filter((i) => i.daysUntil === 1)
    const inTwo   = visible.filter((i) => i.daysUntil === 2)

    const result: { key: string; days: number; items: FollowUpItem[] }[] = []
    if (overdue.length) result.push({ key: 'overdue', days: -1, items: overdue })
    if (today.length)   result.push({ key: 'today',   days: 0,  items: today })
    if (tomorrow.length) result.push({ key: 'tomorrow', days: 1, items: tomorrow })
    if (inTwo.length)   result.push({ key: 'intwo',   days: 2,  items: inTwo })
    return result
  }, [visible])

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <p className="label-ui" style={{ marginBottom: 4 }}>Acciones requeridas</p>
        <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Seguimientos</h1>
        <p style={{ color: '#9ca3af', marginTop: 4, marginBottom: 0, fontSize: '0.875rem' }}>
          Clientes que necesitan contacto hoy, mañana o pasado mañana.
        </p>
      </div>

      {/* Progress */}
      {total > 0 && (
        <div className="xidhu-card" style={{ marginBottom: 24, padding: '16px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1A1A2E' }}>
              {done} de {total} completados
            </span>
            <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{visible.length} pendientes</span>
          </div>
          <div style={{ height: 8, borderRadius: 9999, background: '#f3f4f6', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${total > 0 ? (done / total) * 100 : 0}%`,
                background: '#2DC4C4',
                borderRadius: 9999,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="xidhu-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <p style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</p>
          <h2 style={{ color: '#1A1A2E', marginBottom: 8 }}>¡Todo al día!</h2>
          <p style={{ color: '#9ca3af', margin: 0 }}>No hay seguimientos pendientes para los próximos 2 días.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {groups.map((group) => {
            const { label, color, bg, border } = sectionLabel(group.days === -1 ? group.items[0].daysUntil : group.days)

            return (
              <div key={group.key}>
                {/* Section header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span
                    style={{
                      background: bg,
                      color: color,
                      border: `1.5px solid ${border}`,
                      borderRadius: 9999,
                      padding: '4px 14px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {group.days === -1
                      ? group.items.map((i) => sectionLabel(i.daysUntil).label).join(' / ')
                      : label}
                  </span>
                  <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                    {group.items.length} cliente{group.items.length > 1 ? 's' : ''}
                  </span>
                  <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {group.items.map((item) => {
                    const client = clients.find((c) => c.id === item.clientId)
                    const quote = quotes.find((q) => q.id === item.quoteId)
                    const sect = sectionLabel(item.daysUntil)

                    return (
                      <div
                        key={item.quoteId}
                        className="xidhu-card"
                        style={{ borderLeft: `4px solid ${sect.border}`, padding: '20px 24px' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                          {/* Avatar */}
                          <div
                            style={{
                              width: 50, height: 50, borderRadius: 9999, flexShrink: 0,
                              background: sect.bg, color: sect.color,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700, fontSize: '1.1rem',
                            }}
                          >
                            {client?.full_name.charAt(0) ?? '?'}
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 180 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                              <h3 style={{ margin: 0, fontSize: '1rem', color: '#1A1A2E' }}>{client?.full_name}</h3>
                              <span style={{
                                background: sect.bg, color: sect.color,
                                border: `1px solid ${sect.border}`,
                                borderRadius: 9999, padding: '2px 10px',
                                fontSize: '0.72rem', fontWeight: 700,
                              }}>
                                {sect.label}
                              </span>
                              {item.postponed > 0 && (
                                <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontStyle: 'italic' }}>
                                  pospuesto {item.postponed}x
                                </span>
                              )}
                            </div>
                            <p style={{ margin: '2px 0', fontSize: '0.875rem', color: '#4A4A5A' }}>
                              ✈️ <strong>{quote?.destination}</strong> · {quote?.num_passengers} pax · {formatCurrency(quote?.amount ?? 0)}
                            </p>
                            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>
                              📅 Follow-up: {formatDate(item.followUpDate)} &nbsp;·&nbsp; Cotizado el {formatDate(quote?.created_at ?? '')}
                            </p>
                            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>
                              📞 {client?.phone} &nbsp;·&nbsp; Fuente: {client?.source}
                            </p>
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignSelf: 'center' }}>
                            <button
                              onClick={() => dismiss(item.quoteId)}
                              style={{
                                background: '#EAF7E4', color: '#3a8a27',
                                border: '1.5px solid #5DB544', borderRadius: 9999,
                                padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              ✓ Ya lo contacté
                            </button>
                            <button
                              onClick={() => postpone(item.quoteId)}
                              style={{
                                background: '#FEF9E7', color: '#d4a017',
                                border: '1.5px solid #F5C12E', borderRadius: 9999,
                                padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              +1 día
                            </button>
                            <button
                              onClick={() => dismiss(item.quoteId)}
                              style={{
                                background: '#FDEEEE', color: '#c0221a',
                                border: '1.5px solid #E63329', borderRadius: 9999,
                                padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              ✗ Perdida
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
