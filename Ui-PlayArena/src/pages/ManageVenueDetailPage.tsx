import { CalendarClock, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { rupiah, SPORTS, type BlockedSlot, type OwnerVenueDetail, type Slot } from '../lib/types';
import { useAuth } from '../store/AuthContext';
import SlotGrid from '../components/SlotGrid';
import { Badge, Button, Card, Field, Input } from '../components/ui';

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function ManageVenueDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';
  const [venue, setVenue] = useState<OwnerVenueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCourtForm, setShowCourtForm] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get<{ data: OwnerVenueDetail }>(`/manage/venues/${id}`)
      .then((res) => setVenue(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const toggleCourt = async (courtId: number, isActive: boolean) => {
    await api.post(`/manage/courts/${courtId}`, { is_active: !isActive });
    load();
  };

  const deleteCourt = async (courtId: number) => {
    if (!confirm('Hapus lapangan ini? Tindakan tidak bisa dibatalkan.')) return;
    await api.delete(`/manage/courts/${courtId}`);
    load();
  };

  if (loading) return <p className="text-sm text-slate-500">Memuat…</p>;
  if (!venue) return <p className="text-sm text-slate-500">Venue tidak ditemukan.</p>;

  return (
    <div>
      <Link to="/manage/venues" className="text-sm font-medium text-[#1d5fc4] hover:underline">
        ← Kembali ke Kelola Lapangan
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{venue.name}</h1>
        <Badge tone={venue.is_active ? 'success' : 'danger'}>{venue.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
      </div>

      {isOwner ? (
        <VenueEditForm venue={venue} onSaved={load} />
      ) : (
        <Card className="mt-4 p-5 text-sm text-slate-300">
          {venue.address && <p>{venue.address}</p>}
          <p className="mt-1 text-xs text-slate-500">
            Jam operasional {venue.open_hour}:00–{venue.close_hour}:00
          </p>
        </Card>
      )}

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Lapangan</h2>
        {isOwner && (
          <Button onClick={() => setShowCourtForm((v) => !v)}>
            <Plus size={16} /> {showCourtForm ? 'Tutup Form' : 'Tambah Lapangan'}
          </Button>
        )}
      </div>

      {isOwner && showCourtForm && (
        <CourtForm
          venueId={venue.id}
          onCreated={() => {
            setShowCourtForm(false);
            load();
          }}
        />
      )}

      <div className="mt-4 grid grid-cols-1 gap-4">
        {venue.courts.length === 0 && <p className="text-sm text-slate-500">Belum ada lapangan.</p>}
        {venue.courts.map((c) => (
          <Card key={c.id} className="overflow-hidden p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-white">{c.name}</h3>
                <Badge>{c.sport}</Badge>
              </div>
              <Badge tone={c.is_active ? 'success' : 'danger'}>{c.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
            </div>
            {c.photo_url && <img src={c.photo_url} alt={c.name} className="mt-2 h-28 w-full max-w-xs rounded-lg object-cover" />}
            <p className="mt-2 text-sm font-semibold text-[#1d5fc4]">{rupiah(c.price_per_hour)}/jam</p>
            {c.facilities && c.facilities.length > 0 && (
              <p className="mt-1 text-xs text-slate-400">Fasilitas: {c.facilities.join(', ')}</p>
            )}
            {isOwner && c.sport === 'Bulu Tangkis' && (
              <ShuttlecockPriceEditor courtId={c.id} price={c.shuttlecock_price} onSaved={load} />
            )}
            {isOwner && (
              <div className="mt-3 flex items-center gap-3">
                <button onClick={() => toggleCourt(c.id, c.is_active)} className="text-xs font-semibold text-[#1d5fc4] hover:underline">
                  {c.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                <button onClick={() => deleteCourt(c.id)} className="flex items-center gap-1 text-xs font-semibold text-rose-400 hover:underline">
                  <Trash2 size={12} /> Hapus
                </button>
              </div>
            )}

            <BlockManager courtId={c.id} />
          </Card>
        ))}
      </div>
    </div>
  );
}

/** Modul 04 — kalender & blokir slot per lapangan. Owner maupun Staff venue ini. */
function BlockManager({ courtId }: { courtId: number }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [blocks, setBlocks] = useState<BlockedSlot[]>([]);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    api.get<{ data: Slot[] }>(`/courts/${courtId}/slots?date=${date}`).then((res) => setSlots(res.data));
    api.get<{ data: BlockedSlot[] }>(`/manage/courts/${courtId}/blocked-slots`).then((res) => setBlocks(res.data));
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, date]);

  const deleteBlock = async (id: number) => {
    await api.delete(`/manage/blocked-slots/${id}`);
    load();
  };

  return (
    <div className="mt-4 border-t border-slate-800 pt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-[#1d5fc4]"
      >
        <CalendarClock size={14} /> {open ? 'Tutup Kalender & Blokir Slot' : 'Kalender & Blokir Slot'}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <Input type="date" value={date} min={todayISO()} onChange={(e) => setDate(e.target.value)} className="w-auto" />
          <SlotGrid slots={slots} />

          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Blokir Aktif</p>
            <button onClick={() => setShowForm((v) => !v)} className="text-xs font-semibold text-[#1d5fc4] hover:underline">
              {showForm ? 'Tutup' : '+ Tambah Blokir'}
            </button>
          </div>

          {blocks.length === 0 && <p className="text-xs text-slate-500">Tidak ada blokir mendatang.</p>}
          {blocks.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-lg bg-amber-500/10 px-3 py-2 text-xs">
              <span className="text-amber-400">
                {new Date(b.starts_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })} –{' '}
                {new Date(b.ends_at).toLocaleTimeString('id-ID', { timeStyle: 'short' })} · {b.reason}
              </span>
              <button onClick={() => deleteBlock(b.id)} className="font-semibold text-rose-400 hover:underline">
                Hapus
              </button>
            </div>
          ))}

          {showForm && (
            <BlockForm
              courtId={courtId}
              defaultDate={date}
              onCreated={() => {
                setShowForm(false);
                load();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function BlockForm({ courtId, defaultDate, onCreated }: { courtId: number; defaultDate: string; onCreated: () => void }) {
  const [date, setDate] = useState(defaultDate);
  const [startHour, setStartHour] = useState('8');
  const [duration, setDuration] = useState('1');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post(`/manage/courts/${courtId}/blocked-slots`, {
        date,
        start_hour: Number(startHour),
        duration_hours: Number(duration),
        reason,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menambah blokir.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-2 rounded-lg border border-slate-800 p-3 sm:grid-cols-4">
      <Field label="Tanggal">
        <Input type="date" value={date} min={todayISO()} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <Field label="Jam mulai">
        <Input type="number" min={0} max={23} value={startHour} onChange={(e) => setStartHour(e.target.value)} />
      </Field>
      <Field label="Durasi (jam)">
        <Input type="number" min={1} max={12} value={duration} onChange={(e) => setDuration(e.target.value)} />
      </Field>
      <Field label="Alasan">
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Maintenance" required />
      </Field>
      {error && <p className="col-span-full rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-400">{error}</p>}
      <div className="col-span-full">
        <Button type="submit" disabled={loading} className="text-xs">
          {loading ? 'Menyimpan…' : 'Blokir Slot Ini'}
        </Button>
      </div>
    </form>
  );
}

function VenueEditForm({ venue, onSaved }: { venue: OwnerVenueDetail; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: venue.name,
    city: venue.city ?? '',
    address: venue.address ?? '',
    admin_wa: venue.admin_wa ?? '',
    bank_name: venue.bank_name ?? '',
    bank_account_number: venue.bank_account_number ?? '',
    bank_account_holder: venue.bank_account_holder ?? '',
    lat: venue.lat?.toString() ?? '',
    lng: venue.lng?.toString() ?? '',
    open_hour: String(venue.open_hour),
    close_hour: String(venue.close_hour),
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await api.put(`/manage/venues/${venue.id}`, {
      name: form.name,
      city: form.city || null,
      address: form.address || null,
      admin_wa: form.admin_wa || null,
      bank_name: form.bank_name || null,
      bank_account_number: form.bank_account_number || null,
      bank_account_holder: form.bank_account_holder || null,
      lat: form.lat ? Number(form.lat) : null,
      lng: form.lng ? Number(form.lng) : null,
      open_hour: Number(form.open_hour),
      close_hour: Number(form.close_hour),
    });
    setSaving(false);
    setSaved(true);
    onSaved();
  };

  const toggleVenueActive = async () => {
    await api.put(`/manage/venues/${venue.id}`, { is_active: !venue.is_active });
    onSaved();
  };

  return (
    <Card className="mt-4 p-5">
      <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nama venue">
          <Input value={form.name} onChange={set('name')} required />
        </Field>
        <Field label="Kota">
          <Input value={form.city} onChange={set('city')} />
        </Field>
        <Field label="Alamat" className="sm:col-span-2">
          <Input value={form.address} onChange={set('address')} />
        </Field>
        <Field label="Nomor WA Admin" hint="Dasar link chat pelanggan untuk konfirmasi booking" className="sm:col-span-2">
          <Input value={form.admin_wa} onChange={set('admin_wa')} placeholder="0812xxxxxxx" />
        </Field>
        <Field label="Nama Bank" hint="Rekening tujuan transfer pelanggan, dikonfirmasi manual oleh admin">
          <Input value={form.bank_name} onChange={set('bank_name')} placeholder="BCA" />
        </Field>
        <Field label="Nomor Rekening">
          <Input value={form.bank_account_number} onChange={set('bank_account_number')} placeholder="1234567890" />
        </Field>
        <Field label="Atas Nama Rekening" className="sm:col-span-2">
          <Input value={form.bank_account_holder} onChange={set('bank_account_holder')} placeholder="PT PlayArena Indonesia" />
        </Field>
        <Field label="Latitude">
          <Input value={form.lat} onChange={set('lat')} />
        </Field>
        <Field label="Longitude">
          <Input value={form.lng} onChange={set('lng')} />
        </Field>
        <Field label="Jam buka">
          <Input type="number" min={0} max={23} value={form.open_hour} onChange={set('open_hour')} />
        </Field>
        <Field label="Jam tutup">
          <Input type="number" min={1} max={24} value={form.close_hour} onChange={set('close_hour')} />
        </Field>

        <div className="flex items-center gap-3 sm:col-span-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
          </Button>
          <Button type="button" variant="ghost" onClick={toggleVenueActive}>
            {venue.is_active ? 'Nonaktifkan Venue' : 'Aktifkan Venue'}
          </Button>
          {saved && <span className="text-xs font-medium text-emerald-400">Tersimpan.</span>}
        </div>
      </form>

      <QrisUploader venueId={venue.id} imageUrl={venue.qris_image_url} onSaved={onSaved} />
    </Card>
  );
}

/** QRIS milik venue (Modul 06 sementara) — endpoint upload terpisah dari form teks karena butuh multipart. */
function QrisUploader({ venueId, imageUrl, onSaved }: { venueId: number; imageUrl: string | null; onSaved: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('qris', file);
      await api.post(`/manage/venues/${venueId}/qris`, fd);
      setFile(null);
      onSaved();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-4 border-t border-slate-800 pt-4">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
        QRIS untuk Pembayaran Manual
      </span>
      <div className="flex items-center gap-4">
        {imageUrl && <img src={imageUrl} alt="QRIS" className="h-24 w-24 rounded-lg border border-slate-800 object-contain" />}
        <div className="flex items-center gap-2">
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-xs" />
          <Button type="button" onClick={upload} disabled={!file || uploading} className="px-3 py-2 text-xs">
            {uploading ? 'Mengunggah…' : imageUrl ? 'Ganti' : 'Unggah'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CourtForm({ venueId, onCreated }: { venueId: number; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [sport, setSport] = useState(SPORTS[0]);
  const [price, setPrice] = useState('');
  const [shuttlecockPrice, setShuttlecockPrice] = useState('');
  const [facilities, setFacilities] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('sport', sport);
      fd.append('price_per_hour', price);
      if (sport === 'Bulu Tangkis' && shuttlecockPrice) fd.append('shuttlecock_price', shuttlecockPrice);
      facilities
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean)
        .forEach((f) => fd.append('facilities[]', f));
      if (photo) fd.append('photo', photo);

      await api.post(`/manage/venues/${venueId}/courts`, fd);
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menambah lapangan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-4 p-5">
      <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nama lapangan">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="mis. Lapangan A" required />
        </Field>
        <Field label="Jenis olahraga">
          <select
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#1d5fc4] focus:ring-2 focus:ring-[#1d5fc4]/15"
          >
            {SPORTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Harga per jam (Rp)">
          <Input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="150000" required />
        </Field>
        {sport === 'Bulu Tangkis' && (
          <Field label="Harga Shuttlecock per Buah (Rp)" hint="Opsional — kosongkan kalau tidak jual shuttlecock">
            <Input
              type="number"
              min={0}
              value={shuttlecockPrice}
              onChange={(e) => setShuttlecockPrice(e.target.value)}
              placeholder="5000"
            />
          </Field>
        )}
        <Field label="Fasilitas" hint="Pisahkan dengan koma">
          <Input value={facilities} onChange={(e) => setFacilities(e.target.value)} placeholder="Toilet, Musholla, Parkir" />
        </Field>
        <Field label="Foto" className="sm:col-span-2" hint="Opsional, maks 5MB">
          <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} className="text-sm" />
        </Field>

        {error && (
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-400 sm:col-span-2">{error}</p>
        )}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Menyimpan…' : 'Simpan Lapangan'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

/** Modul 20 — harga shuttlecock per buah, khusus lapangan badminton. Diedit terpisah dari form lapangan supaya owner bisa ubah kapan saja tanpa mengulang seluruh form. */
function ShuttlecockPriceEditor({ courtId, price, onSaved }: { courtId: number; price: number | null; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(price ?? ''));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.post(`/manage/courts/${courtId}`, { shuttlecock_price: value === '' ? null : Number(value) });
      setEditing(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="mt-1 block text-xs text-slate-400 hover:text-[#1d5fc4] hover:underline"
      >
        Shuttlecock: {price ? `${rupiah(price)}/buah` : 'belum diatur'} (ubah)
      </button>
    );
  }

  return (
    <div className="mt-1 flex items-center gap-2">
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="5000"
        className="w-28 py-1.5 text-xs"
      />
      <button onClick={save} disabled={saving} className="text-xs font-semibold text-[#1d5fc4] hover:underline">
        {saving ? 'Menyimpan…' : 'Simpan'}
      </button>
      <button onClick={() => setEditing(false)} className="text-xs text-slate-500 hover:underline">
        Batal
      </button>
    </div>
  );
}
