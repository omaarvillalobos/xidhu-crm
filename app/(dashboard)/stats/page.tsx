'use client'

import { useState, useEffect, useMemo } from 'react'
import { formatCurrency } from '@/lib/mock-data'
import { getStoredClients, getStoredQuotes } from '@/lib/store'
import type { Client, Quote } from '@/lib/mock-data'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const MES_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const SOURCE_COLORS: Record<string, string> = {
  whatsapp: '#25D366', instagram: '#E1306C', facebook: '#1877F2', referido: '#F5C12E', otro: '#9B59B6',
}

const EXEC_MAP: Record<string, { name: string; role: string; color: string }> = {
  u1: { name: 'Mariana', role: 'Admin',     color: '#2DC4C4' },
  u2: { name: 'Eduardo', role: 'Ejecutivo', color: '#F47B20' },
  u3: { name: 'Issori',  role: 'Ejecutivo', color: '#9B59B6' },
}

const RADIAN = Math.PI / 180
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  if (percent < 0.08) return null
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

function SectionTitle({ label, title }: { label: string; title: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p className="label-ui" style={{ marginBottom: 4 }}>{label}</p>
      <h2 style={{ margin: 0, fontSize: '1.3rem' }}>{title}</h2>
    </div>
  )
}

export default function StatsPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [clients, setClients] = useState<Client[]>([])

  useEffect(() => {
    getStoredQuotes().then(setQuotes)
    getStoredClients().then(setClients)
  }, [])

  const now = new Date()

  // KPIs
  const ganadas = quotes.filter((q) => q.status === 'ganada')
  const totalSales = ganadas.reduce((s, q) => s + (q.amount ?? 0), 0)
  const closedQuotes = quotes.filter((q) => q.status !== 'pendiente').length
  const globalRate = closedQuotes > 0 ? Math.round((ganadas.length / closedQuotes) * 100) : 0
  const avgAmount = ganadas.length > 0 ? Math.round(totalSales / ganadas.length) : 0

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

  const maxMonto = Math.max(...salesByMonth.map((m) => m.monto))

  // Fuente de clientes
  const sourceDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    clients.forEach((c) => { counts[c.source] = (counts[c.source] ?? 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: SOURCE_COLORS[name] ?? '#9ca3af',
    }))
  }, [clients])

  // Ingresos por tipo de venta (cotizaciones ganadas)
  const salesByType = useMemo(() => {
    const tipos = ['Tours', 'Personalizado', 'Terrestre', 'Aéreo (solo vuelo)', 'Paquete']
    return tipos.map((tipo) => ({
      tipo,
      monto: quotes.filter((q) => q.status === 'ganada' && q.sale_type === tipo).reduce((s, q) => s + (q.amount ?? 0), 0),
    })).filter((t) => t.monto > 0)
  }, [quotes])

  // Top destinos
  const topDestinations = useMemo(() => {
    const cots: Record<string, number> = {}
    const ventas: Record<string, number> = {}
    quotes.forEach((q) => {
      cots[q.destination] = (cots[q.destination] ?? 0) + 1
      if (q.status === 'ganada') ventas[q.destination] = (ventas[q.destination] ?? 0) + 1
    })
    return Object.entries(cots)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([destino, cotizaciones]) => ({ destino, cotizaciones, ventas: ventas[destino] ?? 0 }))
  }, [quotes])

  const maxDest = topDestinations[0]?.cotizaciones ?? 1

  // Estadísticas por ejecutivo
  const execStats = useMemo(() =>
    Object.entries(EXEC_MAP).map(([id, info]) => {
      const eq = quotes.filter((q) => q.created_by === id)
      const ev = eq.filter((q) => q.status === 'ganada')
      const closed = eq.filter((q) => q.status !== 'pendiente').length
      return {
        id, ...info,
        cotizaciones: eq.length,
        ventas: ev.length,
        monto: ev.reduce((s, q) => s + (q.amount ?? 0), 0),
        tasa: closed > 0 ? Math.round((ev.length / closed) * 100) : 0,
      }
    }),
    [quotes]
  )

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <p className="label-ui" style={{ marginBottom: 4 }}>Análisis de negocio</p>
        <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Estadísticas</h1>
        <p style={{ color: '#9ca3af', marginTop: 4, marginBottom: 0, fontSize: '0.875rem' }}>
          Datos históricos para tomar mejores decisiones.
        </p>
      </div>

      {/* KPIs globales */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 36, flexWrap: 'wrap' }}>
        {[
          { label: 'Total ventas',          value: formatCurrency(totalSales), color: '#2DC4C4' },
          { label: 'Tasa de cierre global', value: `${globalRate}%`,           color: '#5DB544' },
          { label: 'Ticket promedio',       value: formatCurrency(avgAmount),  color: '#F47B20' },
          { label: 'Cotizaciones totales',  value: quotes.length,              color: '#9B59B6' },
        ].map((k) => (
          <div key={k.label} className="xidhu-card" style={{ flex: 1, minWidth: 180 }}>
            <p className="label-ui" style={{ marginBottom: 8 }}>{k.label}</p>
            <p style={{ fontSize: '1.8rem', fontWeight: 700, color: k.color, margin: 0, fontFamily: "'Playfair Display', serif" }}>
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Ventas por mes */}
      <div className="xidhu-card" style={{ marginBottom: 28 }}>
        <SectionTitle label="Ventas" title="Ingresos por mes · últimos 12 meses" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={salesByMonth} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
              tickFormatter={(v) => v === 0 ? '' : `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v: number) => [`$${v.toLocaleString('es-MX')} MXN`, 'Venta']}
              contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontFamily: 'DM Sans' }}
            />
            <Bar dataKey="monto"
              shape={(props: any) => <rect x={props.x} y={props.y} width={props.width} height={props.height} fill={props.monto === maxMonto && props.monto > 0 ? '#F5C12E' : '#2DC4C4'} rx={4} />}
              maxBarSize={52}
            />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#9ca3af' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: '#2DC4C4', display: 'inline-block' }} /> Ventas regulares
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#9ca3af' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: '#F5C12E', display: 'inline-block' }} /> Mes pico
          </span>
        </div>
      </div>

      {/* Ingresos por tipo de venta */}
      <div className="xidhu-card" style={{ marginBottom: 28 }}>
        <SectionTitle label="Tipos de venta" title="Ingresos por tipo de venta (ganadas)" />
        {salesByType.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', textAlign: 'center', padding: '40px 0' }}>Sin ventas registradas por tipo aún.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={salesByType} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="tipo" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v === 0 ? '' : `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: number) => [`$${v.toLocaleString('es-MX')} MXN`, 'Ingresos']}
                contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontFamily: 'DM Sans' }}
              />
              <Bar dataKey="monto" fill="#F47B20" maxBarSize={60} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Fuente de clientes + Destinos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>

        {/* Pie chart fuente */}
        <div className="xidhu-card">
          <SectionTitle label="Clientes" title="Fuente de adquisición" />
          {sourceDistribution.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', textAlign: 'center', padding: '40px 0' }}>Sin clientes aún.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={sourceDistribution} cx="50%" cy="50%" outerRadius={100} dataKey="value" labelLine={false} label={renderCustomLabel}>
                  {sourceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend formatter={(value) => <span style={{ fontSize: '0.82rem', color: '#4A4A5A' }}>{value}</span>} />
                <Tooltip
                  formatter={(v: number, name) => [`${v} cliente${v !== 1 ? 's' : ''}`, name]}
                  contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontFamily: 'DM Sans' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top destinos */}
        <div className="xidhu-card">
          <SectionTitle label="Destinos" title="Cotizados vs Vendidos" />
          {topDestinations.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', textAlign: 'center', padding: '40px 0' }}>Sin cotizaciones aún.</p>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {topDestinations.map((d, i) => (
                  <div key={d.destino}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1A1A2E' }}>{i + 1}. {d.destino}</span>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <span style={{ fontSize: '0.78rem', color: '#2DC4C4', fontWeight: 600 }}>{d.cotizaciones} cots.</span>
                        <span style={{ fontSize: '0.78rem', color: '#5DB544', fontWeight: 600 }}>{d.ventas} ventas</span>
                      </div>
                    </div>
                    <div style={{ position: 'relative', height: 8, borderRadius: 9999, background: '#f3f4f6' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${(d.cotizaciones / maxDest) * 100}%`, background: '#2DC4C4', borderRadius: 9999, opacity: 0.3 }} />
                      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${(d.ventas / maxDest) * 100}%`, background: '#5DB544', borderRadius: 9999 }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#9ca3af' }}>
                  <span style={{ width: 12, height: 8, borderRadius: 3, background: '#2DC4C4', opacity: 0.4, display: 'inline-block' }} /> Cotizadas
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#9ca3af' }}>
                  <span style={{ width: 12, height: 8, borderRadius: 3, background: '#5DB544', display: 'inline-block' }} /> Vendidas
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabla ejecutivos */}
      <div className="xidhu-card">
        <SectionTitle label="Equipo · solo admin" title="Rendimiento por ejecutivo" />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                {['Ejecutivo', 'Cotizaciones', 'Ventas', 'Tasa de cierre', 'Monto total'].map((h) => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.7rem', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 600, color: '#2DC4C4' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {execStats.map((e, i) => (
                <tr key={e.id} style={{ borderBottom: i < execStats.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9999, background: e.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                        {e.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: '#1A1A2E' }}>{e.name}</p>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#9ca3af' }}>{e.role}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '1rem', fontWeight: 700, color: '#4A4A5A', textAlign: 'center' }}>{e.cotizaciones}</td>
                  <td style={{ padding: '16px 20px', fontSize: '1rem', fontWeight: 700, color: '#5DB544', textAlign: 'center' }}>{e.ventas}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                      <div style={{ height: 6, width: 80, borderRadius: 9999, background: '#f3f4f6', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${e.tasa}%`, background: e.tasa >= 60 ? '#5DB544' : e.tasa >= 40 ? '#F5C12E' : '#E63329', borderRadius: 9999 }} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1A1A2E' }}>{e.tasa}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 600, fontSize: '0.875rem', color: '#1A1A2E' }}>{formatCurrency(e.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
