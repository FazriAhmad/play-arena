import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { API_BASE, api, getToken } from '../lib/api';
import { rupiah, type RevenueReport } from '../lib/types';
import { useVenue } from '../store/VenueContext';
import { Button, Card, Field, Input } from '../components/ui';

/** toISOString() konversi ke UTC dulu — di timezone +7 lewat UTC bisa geser mundur satu hari. Format manual dari komponen lokal supaya aman. */
const toLocalISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const todayISO = () => toLocalISO(new Date());
const startOfMonthISO = () => {
  const d = new Date();
  return toLocalISO(new Date(d.getFullYear(), d.getMonth(), 1));
};

/** Modul 19 — Laporan Pendapatan. Angka dihitung dari pembayaran lunas dikurangi refund yang jadi hak pelanggan. */
export default function RevenuePage() {
  const { venues, currentVenueId, setCurrentVenueId, loading: venuesLoading } = useVenue();
  const [from, setFrom] = useState(startOfMonthISO());
  const [to, setTo] = useState(todayISO());
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!currentVenueId) {
      setReport(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get<{ data: RevenueReport }>(`/manage/revenue?venue_id=${currentVenueId}&from=${from}&to=${to}`)
      .then((res) => setReport(res.data))
      .finally(() => setLoading(false));
  }, [currentVenueId, from, to]);

  const exportCsv = async () => {
    if (!currentVenueId) return;
    setExporting(true);
    try {
      const res = await fetch(
        `${API_BASE}/manage/revenue/export?venue_id=${currentVenueId}&from=${from}&to=${to}`,
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-pendapatan-${currentVenueId}-${from}_${to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan Pendapatan</h1>
          <p className="mt-1 text-sm text-slate-500">Pembayaran lunas dikurangi refund, per periode yang dipilih.</p>
        </div>
        <Button variant="ghost" onClick={exportCsv} disabled={!currentVenueId || exporting}>
          <Download size={16} /> Ekspor CSV
        </Button>
      </div>

      {venuesLoading ? (
        <p className="mt-6 text-sm text-slate-400">Memuat…</p>
      ) : venues.length === 0 ? (
        <Card className="mt-6 p-6">
          <p className="text-sm text-slate-600">Belum ada venue.</p>
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
                      : 'border-slate-300 text-slate-600 hover:border-slate-400'
                  }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          )}

          <Card className="mt-4 flex flex-wrap items-end gap-3 p-4">
            <Field label="Dari" className="w-40">
              <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="Sampai" className="w-40">
              <Input type="date" value={to} min={from} max={todayISO()} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </Card>

          {loading ? (
            <p className="mt-6 text-sm text-slate-400">Memuat laporan…</p>
          ) : !report ? null : (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Pendapatan Kotor" value={rupiah(report.summary.gross)} />
                <StatCard label="Refund" value={`-${rupiah(report.summary.refunded)}`} tone="danger" />
                <StatCard label="Pendapatan Bersih" value={rupiah(report.summary.net)} tone="primary" />
              </div>

              <DailyTrendCard daily={report.daily} />

              <div className="grid gap-6 sm:grid-cols-2">
                <ByCourtCard rows={report.by_court} />
                <ByMethodCard rows={report.by_method} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'neutral' | 'danger' | 'primary' }) {
  const colors = {
    neutral: { text: 'text-slate-900', border: 'border-l-slate-300' },
    danger: { text: 'text-rose-600', border: 'border-l-rose-400' },
    primary: { text: 'text-[#1d5fc4]', border: 'border-l-[#f97316]' },
  };
  return (
    <Card className={`border-l-4 p-5 ${colors[tone].border}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${colors[tone].text}`}>{value}</p>
    </Card>
  );
}

function DailyTrendCard({ daily }: { daily: RevenueReport['daily'] }) {
  const max = Math.max(1, ...daily.map((d) => d.gross));
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tren Pendapatan Harian</p>
      <div className="mt-5 flex h-32 items-end gap-1 overflow-x-auto">
        {daily.map((d) => (
          <div key={d.date} className="group relative flex-1" style={{ minWidth: 6 }}>
            <div
              className="mx-auto w-full rounded-t bg-[#1d5fc4]/70 transition group-hover:bg-[#1d5fc4]"
              style={{ height: `${Math.max(2, (d.gross / max) * 100)}%` }}
            />
            <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
              {new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}: {rupiah(d.gross)}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ByCourtCard({ rows }: { rows: RevenueReport['by_court'] }) {
  const max = Math.max(1, ...rows.map((r) => r.gross));
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pendapatan per Lapangan</p>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">Belum ada transaksi.</p>
      ) : (
        <div className="mt-4 space-y-2.5">
          {rows.map((r) => (
            <div key={r.court_id}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">{r.name}</span>
                <span className="text-slate-500">{rupiah(r.gross)}</span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-[#f59e0b]" style={{ width: `${(r.gross / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ByMethodCard({ rows }: { rows: RevenueReport['by_method'] }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pendapatan per Metode</p>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">Belum ada transaksi.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((r) => (
            <div key={r.method} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span className="font-medium capitalize text-slate-700">{r.method === 'manual' ? 'Transfer Manual' : r.method}</span>
              <span className="text-slate-600">
                {rupiah(r.gross)} <span className="text-xs text-slate-400">({r.transactions_count}x)</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
