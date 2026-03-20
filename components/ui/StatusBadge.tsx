import { QuoteStatus } from '@/lib/mock-data'

export default function StatusBadge({ status }: { status: QuoteStatus }) {
  return <span className={`badge-${status}`}>{status}</span>
}
