'use client'

import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { Quote, Client, formatCurrency, formatDate, todayStr } from '@/lib/mock-data'
import { getStoredQuotes, getStoredClients } from '@/lib/store'
import { getCurrentUser } from '@/lib/auth'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const INPUT_STYLE = {
  width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb',
  borderRadius: 10, fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif",
  outline: 'none', boxSizing: 'border-box' as const, color: '#1A1A2E',
}

const EXEC_OPTIONS = [
  { value: '', label: 'Todos los ejecutivos' },
  { value: 'u1', label: 'Mariana' },
  { value: 'u2', label: 'Eduardo' },
  { value: 'u3', label: 'Issori' },
]

const EXEC_NAMES: Record<string, string> = { u1: 'Mariana', u2: 'Eduardo', u3: 'Issori' }
const MES_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

type PeriodKey = 'mes' | 'mesAnterior' | 'año' | 'todos' | 'custom'

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: 'mes',         label: 'Este mes' },
  { key: 'mesAnterior', label: 'Mes anterior' },
  { key: 'año',         label: 'Este año' },
  { key: 'todos',       label: 'Todo' },
  { key: 'custom',      label: 'Personalizado' },
]

function toIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function rangeFor(key: PeriodKey): { from: string; to: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  if (key === 'mes') {
    return { from: toIso(new Date(y, m, 1)), to: toIso(new Date(y, m + 1, 0)) }
  }
  if (key === 'mesAnterior') {
    return { from: toIso(new Date(y, m - 1, 1)), to: toIso(new Date(y, m, 0)) }
  }
  if (key === 'año') {
    return { from: toIso(new Date(y, 0, 1)), to: toIso(new Date(y, 11, 31)) }
  }
  return { from: '', to: '' }
}

export default function EarningsPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [period, setPeriod] = useState<PeriodKey>('mes')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [execFilter, setExecFilter] = useState('')

  useEffect(() => {
    const user = getCurrentUser()
    getStoredQuotes().then((all) => {
      const filtered = user?.role === 'admin' ? all : all.filter((q) => q.created_by === user?.id)
      setQuotes(filtered)
    })
    getStoredClients().then(setClients)
    const r = rangeFor('mes')
    setDateFrom(r.from)
    setDateTo(r.to)
  }, [])

  const onPeriodChange = (key: PeriodKey) => {
    setPeriod(key)
    if (key !== 'custom') {
      const r = rangeFor(key)
      setDateFrom(r.from)
      setDateTo(r.to)
    }
  }

  // Solo cuentan las ganadas
  const ganadas = useMemo(() => quotes.filter((q) => q.status === 'ganada'), [quotes])

  const filtered = useMemo(() => {
    return ganadas.filter((q) => {
      const date = q.created_at?.slice(0, 10) ?? ''
      const matchDate = (!dateFrom || date >= dateFrom) && (!dateTo || date <= dateTo)
      const matchExec = !execFilter || q.created_by === execFilter
      return matchDate && matchExec
    })
  }, [ganadas, dateFrom, dateTo, execFilter])

  const totals = useMemo(() => {
    const ingreso = filtered.reduce((s, q) => s + (q.amount ?? 0), 0)
    const conCosto = filtered.filter((q) => q.cost != null)
    const costo = conCosto.reduce((s, q) => s + (q.cost ?? 0), 0)
    const ingresoConCosto = conCosto.reduce((s, q) => s + (q.amount ?? 0), 0)
    const ganancia = ingresoConCosto - costo
    const margen = ingresoConCosto > 0 ? (ganancia / ingresoConCosto) * 100 : 0
    return { ingreso, costo, ganancia, margen, sinCosto: filtered.length - conCosto.length }
  }, [filtered])

  // Gráfica por mes (12 meses retrocedidos desde hoy)
  const chartData = useMemo(() => {
    const now = new Date()
    const buckets: { mes: string; ingreso: number; costo: number; ganancia: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      buckets.push({ mes: `${MES_LABELS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, ingreso: 0, costo: 0, ganancia: 0 })
    }
    const monthIndex = (d: Date) => {
      const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
      return 11 - diff
    }
    filtered.forEach((q) => {
      if (!q.created_at) return
      const d = new Date(q.created_at)
      const i = monthIndex(d)
      if (i >= 0 && i < 12) {
        buckets[i].ingreso += q.amount ?? 0
        if (q.cost != null) {
          buckets[i].costo += q.cost
          buckets[i].ganancia += (q.amount ?? 0) - q.cost
        }
      }
    })
    return buckets
  }, [filtered])

  const clientName = (id: string) => clients.find((c) => c.id === id)?.full_name ?? '—'

  const exportExcel = () => {
    const wb = XLSX.utils.book_new()
    const rows = filtered.map((q) => {
      const ingreso = q.amount ?? 0
      const costo = q.cost ?? null
      const ganancia = costo != null ? ingreso - costo : null
      const margen = costo != null && ingreso > 0 ? ((ingreso - costo) / ingreso) * 100 : null
      return {
        Cliente: clientName(q.client_id),
        Destino: q.destination,
        'Fecha cotización': q.created_at ? formatDate(q.created_at) : '—',
        Ejecutivo: EXEC_NAMES[q.created_by] ?? '—',
        Ingreso: ingreso,
        Costo: costo ?? '',
        Ganancia: ganancia ?? '',
        'Margen %': margen != null ? Number(margen.toFixed(2)) : '',
      }
    })
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ 'Sin datos': '' }])
    XLSX.utils.book_append_sheet(wb, ws, 'Ganancias')
    XLSX.writeFile(wb, `Ganancias_Xidhu_${todayStr()}.xlsx`)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p className="label-ui" style={{ marginBottom: 4 }}>Reporte</p>
          <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Ganancias</h1>
        </div>
        <button
          onClick={exportExcel}
          style={{ background: 'rgba(45,196,196,0.1)', color: '#2DC4C4', border: '1.5px solid #2DC4C4', borderRadius: 9999, padding: '10px 20px', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
        >
          ↓ Exportar Excel
        </button>
      </div>

      {/* Filtros de período */}
      <div className="xidhu-card" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p.key}
              onClick={() => onPeriodChange(p.key)}
              style={{
                background: period === p.key ? '#2DC4C4' : 'white',
                color: period === p.key ? 'white' : '#4A4A5A',
                border: period === p.key ? '1.5px solid #2DC4C4' : '1.5px solid #e5e7eb',
                borderRadius: 9999, padding: '7px 14px',
                fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
            <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Del</span>
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPeriod('custom') }} style={{ ...INPUT_STYLE, maxWidth: 150 }} />
            <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>al</span>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPeriod('custom') }} style={{ ...INPUT_STYLE, maxWidth: 150 }} />
          </div>
          <select value={execFilter} onChange={(e) => setExecFilter(e.target.value)} style={{ ...INPUT_STYLE, maxWidth: 200 }}>
            {EXEC_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Ingresos brutos', value: formatCurrency(totals.ingreso), color: '#2DC4C4', bg: '#E8F9F9' },
          { label: 'Costos totales',  value: formatCurrency(totals.costo),   color: '#E63329', bg: '#FDEEEE' },
          { label: 'Ganancia neta',   value: formatCurrency(totals.ganancia), color: '#5DB544', bg: '#EAF7E4' },
          { label: 'Margen %',        value: `${totals.margen.toFixed(1)}%`,   color: '#F5C12E', bg: '#FEF9E7' },
        ].map((kpi) => (
          <div key={kpi.label} className="xidhu-card" style={{ background: kpi.bg, border: 'none' }}>
            <p className="label-ui" style={{ marginBottom: 6, color: kpi.color }}>{kpi.label}</p>
            <p style={{ margin: 0, fontWeight: 700, color: '#1A1A2E', fontSize: '1.5rem' }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {totals.sinCosto > 0 && (
        <div style={{ background: '#FEF9E7', borderLeft: '4px solid #F5C12E', borderRadius: 8, padding: '10px 16px', marginBottom: 20, fontSize: '0.85rem', color: '#92400e' }}>
          ⚠️ Hay <strong>{totals.sinCosto}</strong> cotización{totals.sinCosto !== 1 ? 'es' : ''} ganada{totals.sinCosto !== 1 ? 's' : ''} sin costo registrado — no se incluye{totals.sinCosto !== 1 ? 'n' : ''} en el cálculo de ganancia. Edítala{totals.sinCosto !== 1 ? 's' : ''} en Cotizaciones para agregar el costo.
        </div>
      )}

      {/* Gráfica */}
      <div className="xidhu-card" style={{ marginBottom: 24 }}>
        <p className="label-ui" style={{ marginBottom: 4 }}>Tendencia</p>
        <h2 style={{ margin: '0 0 20px', fontSize: '1.1rem' }}>Ganancia por mes (últimos 12)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="mes" stroke="#9ca3af" style={{ fontSize: '0.78rem' }} />
            <YAxis stroke="#9ca3af" style={{ fontSize: '0.78rem' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10 }} />
            <Bar dataKey="ganancia" radius={[6, 6, 0, 0]}>
              {chartData.map((_, i) => <Cell key={i} fill="#5DB544" />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla */}
      <div className="xidhu-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6' }}>
          <p className="label-ui" style={{ marginBottom: 4 }}>Detalle</p>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Cotizaciones ganadas ({filtered.length})</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f3f4f6', background: '#FAFAF6' }}>
                {['Cliente', 'Destino', 'Fecha', 'Ejecutivo', 'Ingreso', 'Costo', 'Ganancia', 'Margen'].map((h) => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.7rem', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 600, color: '#2DC4C4', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((q, i) => {
                const ingreso = q.amount ?? 0
                const costo = q.cost
                const ganancia = costo != null ? ingreso - costo : null
                const margen = costo != null && ingreso > 0 ? ((ingreso - costo) / ingreso) * 100 : null
                return (
                  <tr key={q.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                    <td style={{ padding: '14px 20px', fontSize: '0.875rem', fontWeight: 500, color: '#1A1A2E' }}>{clientName(q.client_id)}</td>
                    <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: '#4A4A5A' }}>✈️ {q.destination}</td>
                    <td style={{ padding: '14px 20px', fontSize: '0.8rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>{q.created_at ? formatDate(q.created_at) : '—'}</td>
                    <td style={{ padding: '14px 20px', fontSize: '0.8rem' }}>
                      <span style={{ background: '#EAF7F7', color: '#2DC4C4', borderRadius: 9999, padding: '3px 10px', fontWeight: 600, fontSize: '0.75rem' }}>
                        {EXEC_NAMES[q.created_by] ?? '—'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: '#1A1A2E', fontWeight: 600, whiteSpace: 'nowrap' }}>{formatCurrency(ingreso)}</td>
                    <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: costo != null ? '#E63329' : '#d1d5db', whiteSpace: 'nowrap' }}>
                      {costo != null ? formatCurrency(costo) : '— sin registrar'}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '0.875rem', fontWeight: 700, color: ganancia != null ? (ganancia >= 0 ? '#3a8a27' : '#c0221a') : '#d1d5db', whiteSpace: 'nowrap' }}>
                      {ganancia != null ? formatCurrency(ganancia) : '—'}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: '#4A4A5A', whiteSpace: 'nowrap' }}>
                      {margen != null ? `${margen.toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    Sin cotizaciones ganadas en el período seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ borderTop: '2px solid #f3f4f6', background: '#FAFAF6' }}>
                  <td colSpan={4} style={{ padding: '12px 20px', fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600 }}>
                    Totales
                  </td>
                  <td style={{ padding: '12px 20px', fontWeight: 700, fontSize: '0.9rem', color: '#1A1A2E', whiteSpace: 'nowrap' }}>
                    {formatCurrency(totals.ingreso)}
                  </td>
                  <td style={{ padding: '12px 20px', fontWeight: 700, fontSize: '0.9rem', color: '#E63329', whiteSpace: 'nowrap' }}>
                    {formatCurrency(totals.costo)}
                  </td>
                  <td style={{ padding: '12px 20px', fontWeight: 700, fontSize: '0.9rem', color: '#3a8a27', whiteSpace: 'nowrap' }}>
                    {formatCurrency(totals.ganancia)}
                  </td>
                  <td style={{ padding: '12px 20px', fontWeight: 700, fontSize: '0.9rem', color: '#4A4A5A', whiteSpace: 'nowrap' }}>
                    {totals.margen.toFixed(1)}%
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
