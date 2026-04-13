import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendEmail } from '@/lib/gmail'

export const dynamic = 'force-dynamic'

const USER_NAMES: Record<string, string> = {
  u1: 'Mariana',
  u2: 'Eduardo',
  u3: 'Issori',
}

function formatCurrency(n: number): string {
  return `$${(n ?? 0).toLocaleString('es-MX')} MXN`
}

function formatDateDisplay(s: string): string {
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

function todayInMexicoCity(): string {
  // Returns YYYY-MM-DD in America/Mexico_City timezone
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Mexico_City',
  })
}

export async function GET(request: Request) {
  // Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically
  // when CRON_SECRET env var is set. For local testing, send the same header.
  const authHeader = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = todayInMexicoCity()

  // Fetch quotes whose follow_up_date is exactly today and still pending
  const { data: quotes, error: quotesError } = await supabase
    .from('quotes')
    .select('*')
    .eq('status', 'pendiente')
    .eq('follow_up_date', today)

  if (quotesError) {
    return NextResponse.json({ error: quotesError.message }, { status: 500 })
  }

  if (!quotes || quotes.length === 0) {
    return NextResponse.json({
      message: 'No follow-ups for today',
      date: today,
      sent: false,
    })
  }

  // Fetch related clients in one query
  const clientIds = Array.from(new Set(quotes.map((q) => q.client_id)))
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .in('id', clientIds)

  const clientMap = new Map((clients ?? []).map((c) => [c.id, c]))

  const rows = quotes
    .map((q) => {
      const c = clientMap.get(q.client_id)
      const exec = USER_NAMES[q.created_by] ?? '—'
      return `
        <tr>
          <td style="padding:14px 12px;border-bottom:1px solid #eee;">
            <strong style="color:#1A1A2E;">${c?.full_name ?? '—'}</strong><br>
            <span style="color:#888;font-size:13px;">${c?.phone ?? ''}</span>
          </td>
          <td style="padding:14px 12px;border-bottom:1px solid #eee;color:#1A1A2E;">${q.destination ?? '—'}</td>
          <td style="padding:14px 12px;border-bottom:1px solid #eee;color:#1A1A2E;">${q.num_passengers ?? 0} pax</td>
          <td style="padding:14px 12px;border-bottom:1px solid #eee;color:#1A1A2E;font-weight:600;">${formatCurrency(q.amount)}</td>
          <td style="padding:14px 12px;border-bottom:1px solid #eee;color:#666;">${exec}</td>
        </tr>
      `
    })
    .join('')

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:720px;margin:0 auto;background:#FAFAF6;padding:24px;">
      <div style="background:#2DC4C4;color:#fff;padding:28px 32px;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;font-size:22px;font-weight:700;">Xidhu CRM — Seguimientos de hoy</h1>
        <p style="margin:8px 0 0;opacity:0.92;font-size:14px;">${formatDateDisplay(today)}</p>
      </div>
      <div style="background:#fff;padding:28px 32px;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px;">
        <p style="margin:0 0 20px;color:#1A1A2E;font-size:15px;">
          Tienes <strong style="color:#2DC4C4;">${quotes.length}</strong> seguimiento${quotes.length > 1 ? 's' : ''} programado${quotes.length > 1 ? 's' : ''} para hoy:
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#FAFAF6;">
              <th style="padding:12px;text-align:left;border-bottom:2px solid #2DC4C4;color:#1A1A2E;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Cliente</th>
              <th style="padding:12px;text-align:left;border-bottom:2px solid #2DC4C4;color:#1A1A2E;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Destino</th>
              <th style="padding:12px;text-align:left;border-bottom:2px solid #2DC4C4;color:#1A1A2E;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Pax</th>
              <th style="padding:12px;text-align:left;border-bottom:2px solid #2DC4C4;color:#1A1A2E;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Monto</th>
              <th style="padding:12px;text-align:left;border-bottom:2px solid #2DC4C4;color:#1A1A2E;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Ejecutivo</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p style="text-align:center;margin:20px 0 0;color:#9ca3af;font-size:12px;">
        Enviado automáticamente por Xidhu CRM
      </p>
    </div>
  `

  const recipients = (process.env.NOTIFY_EMAILS ?? 'mastervelasco15@gmail.com')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)

  try {
    await sendEmail({
      to: recipients,
      subject: `Xidhu CRM — ${quotes.length} seguimiento${quotes.length > 1 ? 's' : ''} para hoy`,
      html,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to send email', detail: err?.message ?? String(err) },
      { status: 500 }
    )
  }

  return NextResponse.json({
    message: 'Email sent',
    date: today,
    count: quotes.length,
    recipients,
  })
}
