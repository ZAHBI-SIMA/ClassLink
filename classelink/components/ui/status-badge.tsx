import { cn } from '@/lib/utils'
import type { SchoolStatus, PaymentStatus } from '@/types'

type Status = SchoolStatus | PaymentStatus | string

const SCHOOL_STATUS: Record<SchoolStatus, { label: string; cls: string }> = {
  TRIAL:     { label: 'Essai',    cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  ACTIVE:    { label: 'Actif',    cls: 'bg-green-100 text-green-700 border-green-200' },
  SUSPENDED: { label: 'Suspendu', cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  CANCELLED: { label: 'Résilié', cls: 'bg-red-100 text-red-700 border-red-200' },
}

const PAYMENT_STATUS: Record<PaymentStatus, { label: string; cls: string }> = {
  PENDING:  { label: 'En attente', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  SUCCESS:  { label: 'Payé',      cls: 'bg-green-100 text-green-700 border-green-200' },
  FAILED:   { label: 'Échoué',   cls: 'bg-red-100 text-red-700 border-red-200' },
  REFUNDED: { label: 'Remboursé', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
}

const ALL_STATUS: Record<string, { label: string; cls: string }> = {
  ...SCHOOL_STATUS,
  ...PAYMENT_STATUS,
}

interface Props {
  status: Status
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const config = ALL_STATUS[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600 border-gray-200' }

  return (
    <span className={cn(
      'inline-flex items-center font-medium rounded-full border',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
      config.cls
    )}>
      {config.label}
    </span>
  )
}
