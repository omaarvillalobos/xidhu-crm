'use client'

import { useState, useEffect, useMemo } from 'react'
import { formatCurrency, formatDate, todayStr as getTodayStr } from '@/lib/mock-data'
import { getStoredClients, getStoredQuotes } from '@/lib/store'
import { getCurrentUser } from '@/lib/auth'
import type { Client, Quote } from '@/lib/mock-data'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

function KPICard({ label, value, sub, color }: { label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className="xidhu-card" style={{ flex: 1, minWidth: 180 }}>
      <p className="label-ui" style={{ marginBottom: 10 }}>{label}</p>
      <p style={{ fontSize: '2.2rem', fontWeight: 700, color, margin: '4px 0', fontFamily: "'Playfair Display', serif" }}>
        {value}
      </p>
      <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: 0 }}>{sub}</p>
    </div>
  )
}

const CustomBar = (props: any) => {
  const { x, y, width, height, index, data } = props
  const max = Math.max(...(data ?? []).map((d: any) => d.monto))
  const fill = props.monto === max && max > 0 ? '#F5C12E' : '#2DC4C4'
  return <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} />
}

const MES_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export default function DashboardPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [dismissed, setDismissed] = useState<string[]>([])
  const user = getCurrentUser()

  useEffect(() => {
    getStoredQuotes().then(setQuotes)
    getStoredClients().then(setClients)
  }, [])

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const todayStr = getTodayStr()

  // KPIs
  const activeQuotes = quotes.filter((q) => q.status === 'pendiente').length
  const ganadasThisMonth = quotes.filter((q) => q.status === 'ganada' && q.created_at?.startsWith(thisMonth)).length
  const newClientsThisMonth = clients.filter((c) => c.created_at?.startsWith(thisMonth)).length
  const closed = quotes.filter((q) => q.status !== 'pendiente').length
  const ganadas = quotes.filter((q) => q.status === 'ganada').length
  const closureRate = closed > 0 ? Math.round((ganadas / closed) * 100) : 0

  // Follow-ups: cotizaciones pendientes cuyo follow_up_date <= hoy
  const followUps = useMemo(() =>
    quotes.filter((q) =>
      q.status === 'pendiente' &&
      q.follow_up_date &&
      q.follow_up_date <= todayStr &&
      !dismissed.includes(q.id)
    ).sort((a, b) => a.follow_up_date.localeCompare(b.follow_up_date)),
    [quotes, dismissed, todayStr]
  )

  // Top destinos
  const topDestinations = useMemo(() => {
    const counts: Record<string, number> = {}
    quotes.forEach((q) => { counts[q.destination] = (counts[q.destination] ?? 0) + 1 })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([destino, cotizaciones]) => ({ destino, cotizaciones }))
  }, [quotes])

  const maxDest = topDestinations[0]?.cotizaciones ?? 1

  // Ventas por mes (últimos 12 meses, cotizaciones ganadas)
  const salesByMonth = useMemo(() => {
    const result: { mes: string; monto: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const monto = quotes
        .filter((q) => q.status === 'ganada' && q.created_at?.startsWith(key))
        .reduce((s, q) => s + (q.amount ?? 0), 0)
      result.push({ mes: MES_LABELS[d.getMonth()], monto })
    }
    return result
  }, [quotes])

  const clientById = (id: string) => clients.find((c) => c.id === id)

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#1A1A2E' }}>
          ¡Bienvenid{user?.name?.endsWith('a') || user?.name?.endsWith('María') ? 'a' : 'o'}, {user?.name ?? 'Ejecutivo'}! 👋
        </h1>
        <p style={{ color: '#9ca3af', marginTop: 4, marginBottom: 0 }}>Aquí está el resumen del día.</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 32, flexWrap: 'wrap' }}>
        <KPICard label="Cotizaciones activas" value={activeQuotes}       sub="Pendientes de cierre"   color="#2DC4C4" />
        <KPICard label="Ganadas este mes"      value={ganadasThisMonth}  sub="Cerradas este mes"      color="#5DB544" />
        <KPICard label="Clientes nuevos"       value={newClientsThisMonth} sub="Registrados este mes" color="#F47B20" />
        <KPICard label="Tasa de cierre"        value={`${closureRate}%`} sub="Cotizaciones ganadas"   color="#9B59B6" />
      </div>

      {/* Follow-ups + Top destinations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, marginBottom: 32 }}>

        {/* Follow-ups del día */}
        <div className="xidhu-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <p className="label-ui" style={{ marginBottom: 4 }}>Seguimientos de hoy</p>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Clientes pendientes de contactar</h2>
            </div>
            <span style={{ background: '#FDEEEE', color: '#E63329', border: '1px solid #E63329', borderRadius: 9999, padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700 }}>
              {followUps.length} pendientes
            </span>
          </div>

          {followUps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
              <p style={{ fontSize: '2rem', marginBottom: 8 }}>✅</p>
              <p style={{ margin: 0 }}>¡Todo al día! Sin seguimientos pendientes.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {followUps.map((q) => {
                const client = clientById(q.client_id)
                const daysOverdue = Math.floor((now.getTime() - new Date(q.follow_up_date).getTime()) / 86400000)
                return (
                  <div key={q.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#FAFAF6', borderRadius: 12, gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 9999, background: '#2DC4C4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                        {client?.full_name.charAt(0) ?? '?'}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#1A1A2E' }}>{client?.full_name ?? '—'}</p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af' }}>
                          {q.destination} · {formatCurrency(q.amount ?? 0)}
                          {daysOverdue > 0 && (
                            <span style={{ color: '#E63329', marginLeft: 8, fontWeight: 600 }}>• {daysOverdue}d vencido</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setDismissed((prev) => [...prev, q.id])}
                      style={{ background: '#EAF7E4', color: '#3a8a27', border: '1px solid #5DB544', borderRadius: 9999, padding: '6px 14px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      ✓ Ya lo contacté
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top destinos */}
        <div className="xidhu-card">
          <p className="label-ui" style={{ marginBottom: 4 }}>Top destinos</p>
          <h2 style={{ margin: '0 0 20px', fontSize: '1.1rem' }}>Más cotizados</h2>
          {topDestinations.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Sin cotizaciones aún.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topDestinations.map((d, i) => (
                <div key={d.destino}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1A1A2E' }}>{i + 1}. {d.destino}</span>
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{d.cotizaciones} cots.</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 9999, background: '#f3f4f6', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(d.cotizaciones / maxDest) * 100}%`, background: i === 0 ? '#2DC4C4' : i === 1 ? '#F5C12E' : '#e5e7eb', borderRadius: 9999, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart ventas por mes */}
      <div className="xidhu-card">
        <p className="label-ui" style={{ marginBottom: 4 }}>Ventas mensuales</p>
        <h2 style={{ margin: '0 0 24px', fontSize: '1.1rem' }}>Últimos 12 meses · en MXN</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={salesByMonth} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => v === 0 ? '' : `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => [`$${v.toLocaleString('es-MX')} MXN`, 'Venta']} contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontFamily: 'DM Sans' }} />
            <Bar dataKey="monto" shape={(props: any) => <CustomBar {...props} data={salesByMonth} />} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: '#2DC4C4' }} />
            <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Ventas regulares</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: '#F5C12E' }} />
            <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Mes pico</span>
          </div>
        </div>
      </div>
    </div>
  )
}
