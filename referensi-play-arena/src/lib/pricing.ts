import type { Customer, Voucher } from './types';
import { DP_PCT } from './utils';

export interface Totals {
  subtotal: number;
  extrasTotal: number;
  discount: number;
  total: number;
  dpAmount: number;
  remaining: number;
}

export const memberDiscountPct = (tier: Customer['tier']) =>
  tier === 'gold' ? 15 : tier === 'silver' ? 10 : tier === 'bronze' ? 5 : 0;

export const computeTotals = (
  pricePerHour: number,
  durationHours: number,
  extras: { name: string; qty: number; price: number }[],
  discount: number,
): Totals => {
  const subtotal = pricePerHour * durationHours;
  const extrasTotal = extras.reduce((s, e) => s + e.price * e.qty, 0);
  const total = Math.max(0, subtotal + extrasTotal - discount);
  const dpAmount = Math.round(total * DP_PCT);
  return { subtotal, extrasTotal, discount, total, dpAmount, remaining: total - dpAmount };
};

export interface VoucherResult {
  ok: boolean;
  message: string;
  discount: number;
}

export const applyVoucher = (
  voucher: Voucher | undefined,
  spend: number,
  tier: Customer['tier'],
): VoucherResult => {
  if (!voucher) return { ok: false, message: 'Kode voucher tidak ditemukan', discount: 0 };
  if (!voucher.active)
    return { ok: false, message: 'Voucher sudah tidak aktif / kadaluarsa', discount: 0 };
  if (voucher.used >= voucher.quota)
    return { ok: false, message: 'Kuota voucher sudah habis', discount: 0 };
  if (spend < voucher.minSpend)
    return {
      ok: false,
      message: `Minimum belanja Rp${voucher.minSpend.toLocaleString('id-ID')} untuk kode ini`,
      discount: 0,
    };
  if (voucher.code === 'MEMBER15' && (tier === 'non-member' || tier === 'bronze'))
    return { ok: false, message: 'Kode ini khusus member Silver & Gold', discount: 0 };
  const discount =
    voucher.type === 'percent' ? Math.round((spend * voucher.value) / 100) : voucher.value;
  return {
    ok: true,
    message:
      voucher.type === 'percent'
        ? `Voucher ${voucher.code} aktif — diskon ${voucher.value}%`
        : `Voucher ${voucher.code} aktif — potongan Rp${voucher.value.toLocaleString('id-ID')}`,
    discount,
  };
};
