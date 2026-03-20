'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { NOTIFICATIONS } from '@/lib/mock-data'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '◈' },
  { href: '/clients', label: 'Clientes', icon: '👥' },
  { href: '/quotes', label: 'Cotizaciones', icon: '📋' },
  { href: '/follow-ups', label: 'Seguimientos', icon: '🔔' },
  { href: '/stats', label: 'Estadísticas', icon: '📊' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const unread = NOTIFICATIONS.filter((n) => !n.read).length

  return (
    <aside
      style={{ background: '#1A1A2E', width: 240, minHeight: '100vh', flexShrink: 0 }}
      className="flex flex-col justify-between py-6 px-4"
    >
      {/* Logo */}
      <div>
        <div className="mb-10 px-2">
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.8rem',
              fontWeight: 700,
              color: '#2DC4C4',
              letterSpacing: '2px',
            }}
          >
            Xidhu
          </span>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', letterSpacing: '3px', textTransform: 'uppercase', marginTop: 2 }}>
            Travel CRM
          </p>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 10,
                  color: isActive ? '#2DC4C4' : 'rgba(255,255,255,0.6)',
                  background: isActive ? 'rgba(45,196,196,0.12)' : 'transparent',
                  borderLeft: isActive ? '3px solid #2DC4C4' : '3px solid transparent',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
              >
                <span style={{ fontSize: '1rem', lineHeight: 1 }}>{item.icon}</span>
                <span>{item.label}</span>
                {item.href === '/follow-ups' && unread > 0 && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      background: '#E63329',
                      color: 'white',
                      borderRadius: 9999,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '1px 7px',
                      minWidth: 20,
                      textAlign: 'center',
                    }}
                  >
                    {unread}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Avatar + logout */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', marginBottom: 8 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9999,
              background: '#2DC4C4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.85rem',
              flexShrink: 0,
            }}
          >
            AG
          </div>
          <div>
            <p style={{ color: 'white', fontWeight: 600, fontSize: '0.85rem', margin: 0 }}>Ana García</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', margin: 0 }}>Admin</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/login')}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: 9,
            background: 'rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.5)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.8rem',
            textAlign: 'center',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)')}
          onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)')}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
