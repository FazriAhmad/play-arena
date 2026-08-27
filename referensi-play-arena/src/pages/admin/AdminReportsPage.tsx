import { useMemo, useState } from 'react';
import { Download, TrendingUp } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { addDays, downloadCSV, fmtDateShort, rupiah, rupiahShort, todayISO } from '../../lib/utils';
import { Button, Card, Select, SectionHeading, StatCard } from '../../components/ui';
import { BadgeDollarSign, CalendarRange, Percent, Repeat } from 'lucide-react';

const RANGE_OPTIONS = [
  { id: '7', label: '7 hari terakhir' },
  { id: '30', label: '30 hari terakhir' },
  { id: '90', label: '90 hari terakhir' },
];

export const AdminReportsPage = () => {
  const { state, courtById, venueById } = useStore();
  const staff = state.staff.find((s) => s.id === state.user.staffId);
  const myVenueIds = staff?.role === 'owner' ? state.venues.map((v) => v.id) : staff?.venueIds ?? [];
  const [range, setRange] = useState('30');
  const [venueFilter, setVenueFilter] = useState('all');

  const from = addDays(todayISO(), -Number(range) + 1);

  const scoped = useMemo(() => {
    return state.bookings.filter(
      (b) =>
        myVenueIds.includes(b.venueId) &&
        (venueFilter === 'all' || b.venueId === venueFilter) &&
        b.date >= from &&
        b.date <= todayISO() &&
        b.status !== 'rejected',
    );
  }, [state.bookings, myVenueIds, venueFilter, from]);

  const totalRevenue = scoped.reduce((s, b) => s + b.paidAmount, 0);
  const totalBookings = scoped.length;
  const avgTicket = totalBookings > 0 ? totalRevenue / totalBookings : 0;
  const cancelledCount = state.bookings.filter(
    (b) => myVenueIds.includes(b.venueId) && b.status === 'cancelled' && b.date >= from,
  ).length;

  const bySport = useMemo(() => {
    const map = new Map<string, number>();
    scoped.forEach((b) => {
      const sport = courtById(b.courtId)?.sport ?? 'Lainnya';
      map.set(sport, (map.get(sport) ?? 0) + b.paidAmount);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [scoped, courtById]);

  const byVenue = useMemo(() => {
    const map = new Map<string, number>();
    scoped.forEach((b) => {
      map.set(b.venueId, (map.get(b.venueId) ?? 0) + b.paidAmount);
    });
    return Array.from(map.entries())
      .map(([id, revenue]) => ({ venue: venueById(id)!, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [scoped, venueById]);

  const days = Array.from({ length: Number(range) }, (_, i) => addDays(from, i));
  const daily = days.map((d) => ({ d, revenue: scoped.filter((b) => b.date === d).reduce((s, b) => s + b.paidAmount, 0) }));
  const maxDaily = Math.max(...daily.map((x) => x.revenue), 1);

  const exportCSV = () => {
    const rows: (string | number)[][] = [
      ['Kode', 'Tanggal', 'Jam', 'Lapangan', 'Venue', 'Status', 'Metode Bayar', 'Total', 'Dibayar'],
      ...scoped.map((b) => [
        b.code,
        b.date,
        `${b.startHour}:00`,
        courtById(b.courtId)?.name ?? '',
        venueById(b.venueId)?.name ?? '',
        b.status,
        b.paymentMethod ?? '',
        b.total,
        b.paidAmount,
      ]),
    ];
    downloadCSV(`laporan-pendapatan-${from}-${todayISO()}.csv`, rows);
  };

  return (
    <div>
      <SectionHeading
        eyebrow="Analitik Keuangan"
        title="Laporan Pendapatan"
        description="Pantau performa pendapatan venue berdasarkan rentang waktu, olahraga, dan lokasi."
        right={
          <div className="flex gap-2">
            <Select value={venueFilter} onChange={(e) => setVenueFilter(e.target.value)} className="!w-auto">
              <option value="all">Semua Venue</option>
              {state.venues
                .filter((v) => myVenueIds.includes(v.id))
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
            </Select>
            <Select value={range} onChange={(e) => setRange(e.target.value)} className="!w-auto">
              {RANGE_OPTIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </Select>
            <Button variant="outline" onClick={exportCSV}>
              <Download size={15} /> Export CSV
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Pendapatan" value={rupiahShort(totalRevenue)} icon={<BadgeDollarSign size={18} />} tone="neon" />
        <StatCard label="Total Transaksi" value={String(totalBookings)} icon={<CalendarRange size={18} />} tone="aqua" />
        <StatCard label="Rata-rata / Booking" value={rupiah(Math.round(avgTicket))} icon={<Percent size={18} />} tone="violet" />
        <StatCard label="Booking Dibatalkan" value={String(cancelledCount)} icon={<Repeat size={18} />} tone="rose" />
      </div>

      <Card className="mb-6 p-5 sm:p-6">
        <p className="mb-4 flex items-center gap-2 font-display text-base font-bold text-white">
          <TrendingUp size={16} className="text-neon-400" /> Tren Pendapatan Harian
        </p>
        <div className="flex h-48 items-end gap-1">
          {daily.map((d) => (
            <div key={d.d} className="group relative flex-1">
              <div
                className="w-full rounded-t bg-gradient-to-t from-neon-500 to-aqua-400 transition-all"
                style={{ height: `${Math.max(3, (d.revenue / maxDaily) * 100)}%` }}
              />
              <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink-950 px-1.5 py-0.5 text-[10px] font-semibold text-white group-hover:block">
                {fmtDateShort(d.d)}: {rupiahShort(d.revenue)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <p className="mb-4 font-display text-base font-bold text-white">Pendapatan per Jenis Olahraga</p>
          <div className="space-y-3">
            {bySport.map(([sport, rev]) => (
              <div key={sport}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-white/70">{sport}</span>
                  <span className="font-semibold text-white">{rupiah(rev)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-neon-400 to-aqua-400"
                    style={{ width: `${bySport[0] ? (rev / bySport[0][1]) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <p className="mb-4 font-display text-base font-bold text-white">Pendapatan per Venue</p>
          <div className="space-y-3">
            {byVenue.map(({ venue, revenue }) => (
              <div key={venue.id} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3.5 py-2.5">
                <span className="text-sm text-white/70">{venue.name}</span>
                <span className="font-semibold text-white">{rupiah(revenue)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
