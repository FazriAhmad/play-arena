import type { BookingStatus, PaymentStatus } from '../lib/types';
import { Badge } from './ui';

export const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Menunggu Konfirmasi',
  confirmed: 'Terkonfirmasi',
  rejected: 'Ditolak',
  cancelled: 'Dibatalkan',
  completed: 'Selesai',
};

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  unpaid: 'Belum Bayar',
  awaiting_verification: 'Menunggu Verifikasi',
  dp_paid: 'DP Terbayar',
  paid: 'Lunas',
  refunded: 'Refund Diproses',
};

export const StatusBadge = ({ status }: { status: BookingStatus }) => {
  const tone = {
    pending: 'warn',
    confirmed: 'success',
    rejected: 'danger',
    cancelled: 'neutral',
    completed: 'info',
  } as const;
  return <Badge tone={tone[status]}>{STATUS_LABEL[status]}</Badge>;
};

export const PaymentBadge = ({ status }: { status: PaymentStatus }) => {
  const tone = {
    unpaid: 'danger',
    awaiting_verification: 'warn',
    dp_paid: 'info',
    paid: 'success',
    refunded: 'violet',
  } as const;
  return <Badge tone={tone[status]}>{PAYMENT_LABEL[status]}</Badge>;
};
