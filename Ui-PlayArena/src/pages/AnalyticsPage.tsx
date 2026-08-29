import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { DAY_LABELS, type AnalyticsData } from '../lib/types';
import { useVenue } from '../store/VenueContext';
import { Card } from '../components/ui';

/** Modul 18 — Dashboard Analitik. Grafik dirender pakai div/CSS polos (tanpa library chart baru), cukup untuk data yang sesederhana ini. */
export default function AnalyticsPage() {
  const { venues, currentVenueId, currentVenue, setCurrentVenueId, loading: venuesLoading } = useVenue();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [trendDays, setTrendDays] = useState<7 | 30>(7);

  useEffect(() => {
    if (!currentVenueId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get<{ data: AnalyticsData }>(`/manage/analytics?venue_id=${currentVenueId}`)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [currentVenueId]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Dashboard Analitik</h1>
      <p className="mt-1 text-sm text-slate-400">Ringkasan performa venue dari booking yang benar-benar terjadi (terkonfirmasi/selesai).</p>

      {venuesLoading ? (
        <p className="mt-6 text-sm text-slate-500">Memuat…</p>
      ) : venues.length === 0 ? (
        <Card className="mt-6 p-6">
          <p className="text-sm text-slate-300">Belum ada venue.</p>
        </Card>
      ) : (
        <>
          {venues.length > 1 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {venues.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setCurrentVenueId(v.id)}
                  className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
                    v.id === currentVenueId
                      ? 'border-[#1d5fc4] bg-[#1d5fc4]/10 text-[#1d5fc4]'
                      : 'border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <p className="mt-6 text-sm text-slate-500">Memuat data analitik…</p>
          ) : !data ? null : (
            <div className="mt-6 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <OccupancyCard rate={data.occupancy_rate} venueName={currentVenue?.name} />
                <TopCourtsCard courts={data.top_courts} />
              </div>

              <TrendCard trend={data.trend} days={trendDays} onDaysChange={setTrendDays} />

              <HeatmapCard heatmap={data.heatmap} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OccupancyCard({ rate, venueName }: { rate: number; venueName?: string }) {
  const pct = Math.round(rate * 100);
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tingkat Okupansi</p>
      <p className="mt-1 text-xs text-slate-500">{venueName} · 30 hari terakhir</p>
      <p className="mt-3 text-4xl font-bold text-white">{pct}%</p>
      <div className="mt-3 h-2 w-full rounded-full bg-slate-800">
        <div className="h-2 rounded-full bg-[#1d5fc4]" style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-500">Jam lapangan terpakai dibanding total jam operasional yang tersedia.</p>
    </Card>
  );
}

function TopCourtsCard({ courts }: { courts: AnalyticsData['top_courts'] }) {
  const max = Math.max(1, ...courts.map((c) => c.bookings_count));
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Lapangan Paling Laris</p>
      <p className="mt-1 text-xs text-slate-500">90 hari terakhir</p>
      {courts.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Belum ada data booking.</p>
      ) : (
        <div className="mt-4 space-y-2.5">
          {courts.map((c) => (
            <div key={c.court_id}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-200">{c.name}</span>
                <span className="text-slate-400">{c.bookings_count} booking</span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-slate-800">
                <div
                  className="h-2 rounded-full bg-[#f59e0b]"
                  style={{ width: `${(c.bookings_count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function TrendCard({
  trend,
  days,
  onDaysChange,
}: {
  trend: AnalyticsData['trend'];
  days: 7 | 30;
  onDaysChange: (d: 7 | 30) => void;
}) {
  const sliced = trend.slice(-days);
  const max = Math.max(1, ...sliced.map((d) => d.count));

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tren Booking</p>
          <p className="mt-1 text-xs text-slate-500">Jumlah booking per hari</p>
        </div>
        <div className="flex gap-1">
          {([7, 30] as const).map((d) => (
            <button
              key={d}
              onClick={() => onDaysChange(d)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                days === d ? 'bg-[#1d5fc4] text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {d} hari
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex h-32 items-end gap-1">
        {sliced.map((d) => (
          <div key={d.date} className="group relative flex-1">
            <div
              className="mx-auto w-full rounded-t bg-[#1d5fc4]/70 transition group-hover:bg-[#1d5fc4]"
              style={{ height: `${Math.max(2, (d.count / max) * 100)}%` }}
            />
            <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
              {new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}: {d.count}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function HeatmapCard({ heatmap }: { heatmap: AnalyticsData['heatmap'] }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const byKey = new Map(heatmap.map((h) => [`${h.day_of_week}-${h.hour}`, h.count]));
  const max = Math.max(1, ...heatmap.map((h) => h.count));

  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Jam Paling Laris</p>
      <p className="mt-1 text-xs text-slate-500">90 hari terakhir · warna lebih pekat = lebih sering dibooking</p>

      {heatmap.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Belum ada data booking.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-separate border-spacing-0.5 text-center text-[10px]">
            <thead>
              <tr>
                <th className="w-8" />
                {DAY_LABELS.map((d) => (
                  <th key={d} className="pb-1 font-medium text-slate-400">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hours.map((h) => (
                <tr key={h}>
                  <td className="pr-1 text-right text-slate-500">{h}</td>
                  {DAY_LABELS.map((_, dow) => {
                    const count = byKey.get(`${dow}-${h}`) ?? 0;
                    const alpha = count === 0 ? 0.04 : 0.15 + (count / max) * 0.85;
                    return (
                      <td key={dow} title={count > 0 ? `${count} booking` : undefined}>
                        <div
                          className="h-4 w-6 rounded-sm"
                          style={{ backgroundColor: `rgba(29, 95, 196, ${alpha})` }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
