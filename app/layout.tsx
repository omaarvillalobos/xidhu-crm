import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Xidhu CRM',
  description: 'Sistema de gestión de clientes y cotizaciones — Xidhu Travel',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
