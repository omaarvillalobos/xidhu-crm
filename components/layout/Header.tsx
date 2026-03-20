'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NOTIFICATIONS } from '@/lib/mock-data'

const BREADCRUMBS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/clients': 'Clientes',
  '/quotes': 'Cotizaciones',
  '/follow-ups': 'Seguimientos',
  '/stats': 'Estadísticas',
}

export default function Header() {
  const pathname = usePathname()
  const unread = NOTIFICATIONS.filter((n) => !n.read).length
  const section = BREADCRUMBS[pathname] ?? 'CRM'

  return (
    <header
      style={{
        background: 'white',
        borderBottom: '1px solid #f0f0f0',
        padding: '0 32px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Xidhu CRM</span>
        <span style={{ color: '#d1d5db' }}>/</span>
        <span style={{ color: '#1A1A2E', fontWeight: 600, fontSize: '0.9rem' }}>{section}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Bell */}
        <Link href="/follow-ups" style={{ position: 'relative', textDecoration: 'none' }}>
          <span style={{ fontSize: '1.2rem' }}>🔔</span>
          {unread > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -4,
                right: -6,
                background: '#E63329',
                color: 'white',
                borderRadius: 9999,
                fontSize: '0.6rem',
                fontWeight: 700,
                padding: '1px 5px',
                minWidth: 18,
                textAlign: 'center',
              }}
            >
              {unread}
            </span>
          )}
        </Link>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9999,
              background: '#2DC4C4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.8rem',
            }}
          >
            AG
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#1A1A2E' }}>Ana García</span>
        </div>
      </div>
    </header>
  )
}
