import { useState } from 'react';
import { Check, Crown, Sparkles, Ticket } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { MEMBERSHIP_PLANS } from '../../data/seed';
import { rupiah, fmtDateShort } from '../../lib/utils';
import { Badge, Button, Card, Modal, SectionHeading, useToast } from '../../components/ui';

export const MembershipPage = () => {
  const { state, dispatch, customerById } = useStore();
  const { push } = useToast();
  const [confirmPlan, setConfirmPlan] = useState<(typeof MEMBERSHIP_PLANS)[number] | null>(null);
  const customer = customerById(state.user.customerId ?? '');

  const subscribe = () => {
    if (!confirmPlan || !customer) return;
    const until = new Date();
    until.setMonth(until.getMonth() + 1);
    dispatch({
      type: 'PATCH_CUSTOMER',
      id: customer.id,
      patch: { tier: confirmPlan.id as any, membershipUntil: until.toISOString().slice(0, 10) },
    });
    push(`Selamat! Kamu sekarang ${confirmPlan.name} hingga ${fmtDateShort(until.toISOString().slice(0, 10))}.`);
    setConfirmPlan(null);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="mb-10 text-center">
        <Badge tone="neon" className="mb-4">
          <Crown size={12} /> Membership Bulanan
        </Badge>
        <h1 className="font-display text-4xl font-black text-white">Main lebih hemat tiap bulan</h1>
        <p className="mx-auto mt-3 max-w-xl text-white/50">
          Berlangganan sekali, nikmati diskon otomatis di semua venue, prioritas slot prime time, dan gratis sewa perlengkapan.
        </p>
        {customer && (
          <p className="mt-4 text-sm text-white/60">
            Status kamu saat ini:{' '}
            <strong className="text-neon-300">
              {customer.tier === 'non-member' ? 'Non-Member' : `${customer.tier[0].toUpperCase()}${customer.tier.slice(1)} Member`}
            </strong>
            {customer.membershipUntil && ` · berlaku sampai ${fmtDateShort(customer.membershipUntil)}`}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {MEMBERSHIP_PLANS.map((plan) => (
          <Card key={plan.id} className={`relative overflow-hidden border p-6 bg-gradient-to-b ${plan.color}`}>
            {plan.id === 'silver' && (
              <Badge tone="neon" className="absolute right-4 top-4">
                Terpopuler
              </Badge>
            )}
            <p className="font-display text-lg font-bold text-white">{plan.name}</p>
            <p className="mt-2">
              <span className="font-display text-3xl font-black text-white">{rupiah(plan.price)}</span>
              <span className="text-sm text-white/40">/bulan</span>
            </p>
            <ul className="mt-5 space-y-2.5">
              {plan.perks.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-white/65">
                  <Check size={15} className="mt-0.5 shrink-0 text-neon-400" /> {p}
                </li>
              ))}
            </ul>
            <Button className="mt-6 w-full" variant={plan.id === 'silver' ? 'primary' : 'outline'} onClick={() => setConfirmPlan(plan)}>
              <Sparkles size={15} /> Pilih {plan.name}
            </Button>
          </Card>
        ))}
      </div>

      <div className="mt-16">
        <SectionHeading eyebrow="Bonus" title="Voucher aktif untukmu" description="Kombinasikan dengan membership untuk hemat maksimal." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {state.vouchers
            .filter((v) => v.active)
            .map((v) => (
              <Card key={v.code} className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neon-400/10 text-neon-300">
                  <Ticket size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-sm font-bold text-white">{v.code}</p>
                    <Badge tone="neon">{v.type === 'percent' ? `${v.value}%` : rupiah(v.value)}</Badge>
                  </div>
                  <p className="text-xs text-white/50">{v.description}</p>
                  <p className="mt-1 text-[11px] text-white/35">
                    Min. belanja {rupiah(v.minSpend)} · berlaku s/d {fmtDateShort(v.expiresAt)} · sisa kuota {v.quota - v.used}
                  </p>
                </div>
              </Card>
            ))}
        </div>
      </div>

      <Modal open={!!confirmPlan} onClose={() => setConfirmPlan(null)} title="Konfirmasi Membership">
        {confirmPlan && (
          <div className="space-y-4">
            <p className="text-sm text-white/60">
              Kamu akan berlangganan <strong className="text-white">{confirmPlan.name}</strong> seharga{' '}
              <strong className="text-neon-300">{rupiah(confirmPlan.price)}/bulan</strong>. Pembayaran disimulasikan otomatis lunas.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmPlan(null)}>
                Batal
              </Button>
              <Button onClick={subscribe}>Konfirmasi & Bayar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
