import { Source } from '@/lib/mock-data'

const SOURCE_COLORS: Record<Source, { bg: string; color: string }> = {
  whatsapp:  { bg: '#dcfce7', color: '#16a34a' },
  instagram: { bg: '#fce7f3', color: '#be185d' },
  facebook:  { bg: '#dbeafe', color: '#1d4ed8' },
  referido:  { bg: '#ccfbf1', color: '#0f766e' },
  otro:      { bg: '#f3f4f6', color: '#6b7280' },
}

const LABELS: Record<Source, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  referido: 'Referido',
  otro: 'Otro',
}

export default function SourceBadge({ source }: { source: Source }) {
  const { bg, color } = SOURCE_COLORS[source]
  return (
    <span
      className="badge-source"
      style={{ background: bg, color }}
    >
      {LABELS[source]}
    </span>
  )
}
