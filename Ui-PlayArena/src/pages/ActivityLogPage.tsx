import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { ACTIVITY_LABELS, ROLE_LABELS, type ActivityLog, type Staff } from '../lib/types';
import { Badge, Card, Field, Input } from '../components/ui';

const selectClass =
  'w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#1d5fc4] focus:ring-2 focus:ring-[#1d5fc4]/15';

/** Aksi "merugikan"/sensitif diberi tone merah supaya gampang discan owner. */
const ACTION_TONE = (action: string): 'neutral' | 'success' | 'danger' =>
  ['booking.reject', 'booking.cancel', 'slot.block'].includes(action)
    ? 'danger'
    : action === 'payment.confirm'
      ? 'success'
      : 'neutral';

/** Log aktivitas Staff/Kasir & Petugas Lapangan — Owner-only, buat mengawasi siapa melakukan apa. */
export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: Staff[] }>('/staff').then((res) => setStaff(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (userId) params.set('user_id', userId);
    if (role) params.set('role', role);
    if (date) params.set('date', date);
    api
      .get<{ data: ActivityLog[] }>(`/manage/activity-logs?${params}`)
      .then((res) => setLogs(res.data))
      .finally(() => setLoading(false));
  }, [userId, role, date]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Log Aktivitas</h1>
      <p className="mt-1 text-sm text-slate-400">
        Jejak aksi Staff/Kasir &amp; Petugas Lapangan di venue Anda — ACC/tolak booking, konfirmasi pembayaran, walk-in, dan
        blokir slot. Membuka halaman tidak dicatat, hanya aksi yang mengubah data.
      </p>

      <Card className="mt-6 flex flex-wrap items-end gap-3 p-4">
        <Field label="Petugas" className="w-56">
          <select value={userId} onChange={(e) => setUserId(e.target.value)} className={selectClass}>
            <option value="">Semua orang</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Peran" className="w-48">
          <select value={role} onChange={(e) => setRole(e.target.value)} className={selectClass}>
            <option value="">Semua peran</option>
            <option value="petugas">Petugas Lapangan</option>
            <option value="staff">Staff / Kasir</option>
            <option value="owner">Owner / Admin</option>
          </select>
        </Field>
        <Field label="Tanggal" className="w-44">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        {(userId || role || date) && (
          <button
            onClick={() => {
              setUserId('');
              setRole('');
              setDate('');
            }}
            className="pb-2.5 text-xs font-semibold text-[#1d5fc4] hover:underline"
          >
            Reset filter
          </button>
        )}
      </Card>

      <div className="mt-4 space-y-2">
        {loading && <p className="text-sm text-slate-500">Memuat…</p>}
        {!loading && logs.length === 0 && (
          <p className="text-sm text-slate-500">Belum ada aktivitas tercatat untuk filter ini.</p>
        )}
        {logs.map((log) => (
          <Card key={log.id} className="p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-white">{log.user_name}</span>
                  <span className="text-xs text-slate-500">{ROLE_LABELS[log.user_role] ?? log.user_role}</span>
                  <Badge tone={ACTION_TONE(log.action)}>{ACTIVITY_LABELS[log.action] ?? log.action}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-300">{log.description}</p>
                {log.venue && <p className="mt-0.5 text-xs text-slate-500">{log.venue.name}</p>}
              </div>
              <span className="shrink-0 text-xs text-slate-500">
                {new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
