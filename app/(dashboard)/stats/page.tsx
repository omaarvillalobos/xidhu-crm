'use client'

import {
  SALES_BY_MONTH,
  TOP_DESTINATIONS,
  SOURCE_DISTRIBUTION,
  QUOTES,
  SALES,
  USERS,
  formatCurrency,
} from '@/lib/mock-data'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const CustomBar = (props: any) => {
  const maxVal = Math.max(...SALES_BY_MONTH.map((m) => m.monto))
  const isPeak = props.monto === maxVal && props.monto > 0
  return <rect x={props.x} y={props.y} width={props.width} height={props.height} fill={isPeak ? '#F5C12E' : '#2DC4C4'} rx={4} />
}

// Tasa de cierre por ejecutivo (simulada)
const EXEC_STATS = [
  { name: 'Ana García', cotizaciones: 6, ventas: 4, monto: 91500, tasa: 67 },
  { name: 'Carlos López', cotizaciones: 5, ventas: 2, monto: 37000, tasa: 40 },
  { name: 'María Torres', cotizaciones: 4, ventas: 1, monto: 12000, tasa: 25 },
]

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
  const totalSales = SALES.reduce((s, v) => s + v.amount, 0)
  const totalQuotes = QUOTES.length
  const closedQuotes = QUOTES.filter((q) => q.status !== 'pendiente').length
  const globalRate = closedQuotes > 0 ? Math.round((SALES.length / closedQuotes) * 100) : 0
  const avgAmount = SALES.length > 0 ? Math.round(totalSales / SALES.length) : 0

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
          { label: 'Total ventas', value: formatCurrency(totalSales), color: '#2DC4C4' },
          { label: 'Tasa de cierre global', value: `${globalRate}%`, color: '#5DB544' },
          { label: 'Ticket promedio', value: formatCurrency(avgAmount), color: '#F47B20' },
          { label: 'Cotizaciones totales', value: totalQuotes, color: '#9B59B6' },
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
          <BarChart data={SALES_BY_MONTH} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v === 0 ? '' : `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(v: number) => [`$${v.toLocaleString('es-MX')} MXN`, 'Venta']}
              contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontFamily: 'DM Sans' }}
            />
            <Bar dataKey="monto" shape={<CustomBar />} maxBarSize={52} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#9ca3af' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: '#2DC4C4', display: 'inline-block' }} />
            Ventas regulares
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#9ca3af' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: '#F5C12E', display: 'inline-block' }} />
            Mes pico (mayo)
          </span>
        </div>
      </div>

      {/* Fuente de clientes + Destinos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>

        {/* Pie chart fuente */}
        <div className="xidhu-card">
          <SectionTitle label="Clientes" title="Fuente de adquisición" />
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={SOURCE_DISTRIBUTION}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
              >
                {SOURCE_DISTRIBUTION.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend
                formatter={(value) => <span style={{ fontSize: '0.82rem', color: '#4A4A5A' }}>{value}</span>}
              />
              <Tooltip
                formatter={(v: number, name) => [`${v} cliente${v !== 1 ? 's' : ''}`, name]}
                contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontFamily: 'DM Sans' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top destinos cotizados vs vendidos */}
        <div className="xidhu-card">
          <SectionTitle label="Destinos" title="Cotizados vs Vendidos" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {TOP_DESTINATIONS.map((d, i) => (
              <div key={d.destino}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1A1A2E' }}>
                    {i + 1}. {d.destino}
                  </span>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ fontSize: '0.78rem', color: '#2DC4C4', fontWeight: 600 }}>{d.cotizaciones} cots.</span>
                    <span style={{ fontSize: '0.78rem', color: '#5DB544', fontWeight: 600 }}>{d.ventas} ventas</span>
                  </div>
                </div>
                <div style={{ position: 'relative', height: 8, borderRadius: 9999, background: '#f3f4f6' }}>
                  <div
                    style={{
                      position: 'absolute', left: 0, top: 0, height: '100%',
                      width: `${(d.cotizaciones / 5) * 100}%`,
                      background: '#2DC4C4', borderRadius: 9999, opacity: 0.3,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute', left: 0, top: 0, height: '100%',
                      width: `${(d.ventas / 5) * 100}%`,
                      background: '#5DB544', borderRadius: 9999,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#9ca3af' }}>
              <span style={{ width: 12, height: 8, borderRadius: 3, background: '#2DC4C4', opacity: 0.4, display: 'inline-block' }} />
              Cotizadas
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#9ca3af' }}>
              <span style={{ width: 12, height: 8, borderRadius: 3, background: '#5DB544', display: 'inline-block' }} />
              Vendidas
            </span>
          </div>
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
                  <th
                    key={h}
                    style={{
                      padding: '12px 20px',
                      textAlign: 'left',
                      fontSize: '0.7rem',
                      letterSpacing: '3px',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      color: '#2DC4C4',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EXEC_STATS.map((e, i) => (
                <tr
                  key={e.name}
                  style={{ borderBottom: i < EXEC_STATS.length - 1 ? '1px solid #f9fafb' : 'none' }}
                >
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 34, height: 34, borderRadius: 9999,
                          background: i === 0 ? '#2DC4C4' : i === 1 ? '#F47B20' : '#9B59B6',
                          color: 'white', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem',
                        }}
                      >
                        {e.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: '#1A1A2E' }}>{e.name}</p>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#9ca3af' }}>
                          {i === 0 ? 'Admin' : 'Ejecutivo'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '1rem', fontWeight: 700, color: '#4A4A5A', textAlign: 'center' }}>
                    {e.cotizaciones}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '1rem', fontWeight: 700, color: '#5DB544', textAlign: 'center' }}>
                    {e.ventas}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                      <div style={{ height: 6, width: 80, borderRadius: 9999, background: '#f3f4f6', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${e.tasa}%`,
                            background: e.tasa >= 60 ? '#5DB544' : e.tasa >= 40 ? '#F5C12E' : '#E63329',
                            borderRadius: 9999,
                          }}
                        />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1A1A2E' }}>{e.tasa}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 600, fontSize: '0.875rem', color: '#1A1A2E' }}>
                    {formatCurrency(e.monto)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
