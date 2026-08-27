import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BadgeDollarSign,
  Building2,
  CalendarCheck2,
  Percent,
  Users,
} from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { addDays, fmtDateShort, rupiah, rupiahShort, todayISO } from '../../lib/utils';
import { Badge, Button, Card, SectionHeading, StatCard } from '../../components/ui';
import { StatusBadge } from '../../components/StatusBadges';

export const AdminDashboardPage = () => {
  const { state, courtById, venueById } = useStore();
  const staff = state.staff.find((s) => s.id === state.user.staffId);
  const myVenueIds = staff?.role === 'owner' ? state.venues.map((v) => v.id) : staff?.venueIds ?? [];

  const scoped = useMemo(
    () => state.bookings.filter((b) => myVenueIds.includes(b.venueId)),
    [state.bookings, myVenueIds],
  );

  const today = todayISO();
  const todayBookings = scoped.filter((b) => b.date === today);
  const todayRevenue = todayBookings.reduce((s, b) => s + b.paidAmount, 0);

  const last30 = useMemo(() => {
    const from = addDays(today, -29);
    return scoped.filter((b) => b.date >= from && b.date <= today && b.status !== 'rejected');
  }, [scoped, today]);
  const monthRevenue = last30.reduce((s, b) => s + b.paidAmount, 0);

  const pending = scoped.filter((b) => b.status === 'pending');
  const awaitingPayment = scoped.filter((b) => b.paymentStatus === 'awaiting_verification');

  const totalSlotsToday = myVenueIds.reduce((sum, vId) => {
    const venue = venueById(vId);
    const courts = state.courts.filter((c) => c.venueId === vId).length;
    return sum + (venue ? (venue.closeHour - venue.openHour) * courts : 0);
  }, 0);
  const bookedSlotsToday = todayBookings.reduce((s, b) => s + b.durationHours, 0);
  const occupancy = totalSlotsToday > 0 ? Math.round((bookedSlotsToday / totalSlotsToday) * 100) : 0;

  const chartDays = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  const chartData = chartDays.map((d) => ({
    d,
    revenue: scoped.filter((b) => b.date === d).reduce((s, b) => s + b.paidAmount, 0),
  }));
  const maxRevenue = Math.max(...chartData.map((c) => c.revenue), 1);

  const venuePerf = myVenueIds
    .map((vId) => ({
      venue: venueById(vId)!,
      revenue: last30.filter((b) => b.venueId === vId).reduce((s, b) => s + b.paidAmount, 0),
      count: last30.filter((b) => b.venueId === vId).length,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const recentBookings = scoped
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 6);

  const recentNotifs = state.notifications.slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Dashboard Analitik</h1>
          <p className="mt-1 text-sm text-white/50">Ringkasan performa venue dan booking hari ini.</p>
        </div>
        <Link to="/admin/booking">
          <Button variant="aqua">
            <CalendarCheck2 size={15} /> {pending.length} booking menunggu
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pendapatan Hari Ini" value={rupiah(todayRevenue)} delta={`${todayBookings.length} booking`} icon={<BadgeDollarSign size={18} />} tone="neon" />
        <StatCard label="Pendapatan 30 Hari" value={rupiahShort(monthRevenue)} delta={`${last30.length} transaksi`} icon={<Activity size={18} />} tone="aqua" />
        <StatCard label="Okupansi Hari Ini" value={`${occupancy}%`} delta={`${bookedSlotsToday}/${totalSlotsToday} slot jam`} icon={<Percent size={18} />} tone="violet" />
        <StatCard label="Perlu Ditindak" value={String(pending.length + awaitingPayment.length)} delta={`${pending.length} approval · ${awaitingPayment.length} pembayaran`} icon={<AlertCircle size={18} />} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card className="p-5 sm:p-6">
          <SectionHeading eyebrow="Tren" title="Pendapatan 14 hari terakhir" />
          <div className="flex h-52 items-end gap-2">
            {chartData.map((c) => (
              <div key={c.d} className="group flex flex-1 flex-col items-center gap-2">
                <div className="relative flex h-40 w-full items-end overflow-hidden rounded-t-md bg-white/[0.04]">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-neon-500 to-aqua-400 transition-all"
                    style={{ height: `${Math.max(4, (c.revenue / maxRevenue) * 100)}%` }}
                  />
                  <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink-950 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 shadow group-hover:opacity-100">
                    {rupiahShort(c.revenue)}
                  </span>
                </div>
                <span className="text-[9px] text-white/30">{fmtDateShort(c.d).split(',')[0]}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionHeading eyebrow="Ranking" title="Performa venue (30 hari)" />
          <div className="space-y-3">
            {venuePerf.map(({ venue, revenue, count }, i) => (
              <div key={venue.id} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/8 text-xs font-bold text-white/60">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{venue.name}</p>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-neon-400 to-aqua-400"
                      style={{ width: `${venuePerf[0].revenue ? (revenue / venuePerf[0].revenue) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-white">{rupiahShort(revenue)}</p>
                  <p className="text-[10px] text-white/35">{count}x booking</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-display text-base font-bold text-white">Booking Terbaru</p>
            <Link to="/admin/booking" className="flex items-center gap-1 text-xs font-semibold text-aqua-300 hover:underline">
              Lihat semua <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{courtById(b.courtId)?.name}</p>
                  <p className="text-xs text-white/40">
                    {b.code} · {fmtDateShort(b.date)} {String(b.startHour).padStart(2, '0')}:00
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-bold text-white/70">{rupiah(b.total)}</span>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users size={16} className="text-neon-400" />
            <p className="font-display text-base font-bold text-white">Notifikasi Sistem</p>
          </div>
          <div className="space-y-3">
            {recentNotifs.map((n) => (
              <div key={n.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                <div className="mb-1 flex items-center justify-between">
                  <Badge tone={n.channel === 'whatsapp' ? 'success' : n.channel === 'email' ? 'info' : 'neutral'}>
                    {n.channel.toUpperCase()}
                  </Badge>
                  <span className="text-[10px] text-white/30">{fmtDateShort(n.at.slice(0, 10))}</span>
                </div>
                <p className="text-xs font-semibold text-white/80">{n.subject}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-white/45">{n.body}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <Building2 className="text-aqua-300" size={20} />
          <div>
            <p className="text-sm font-semibold text-white">{myVenueIds.length} venue dikelola</p>
            <p className="text-xs text-white/45">{state.courts.filter((c) => myVenueIds.includes(c.venueId)).length} lapangan aktif</p>
          </div>
        </div>
        <Link to="/admin/venue">
          <Button variant="outline" size="sm">
            Kelola Venue
          </Button>
        </Link>
      </Card>
    </div>
  );
};
