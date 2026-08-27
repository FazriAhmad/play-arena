import { useMemo, useState } from 'react';
import { Pencil, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import type { Court, SportType } from '../../lib/types';
import { SPORTS } from '../../lib/types';
import { FACILITIES, SPORT_IMAGE } from '../../data/seed';
import { rupiah } from '../../lib/utils';
import { Badge, Button, Card, Field, Input, Modal, Select, SectionHeading, Toggle, useToast } from '../../components/ui';

const emptyCourt = (venueId: string): Omit<Court, 'id'> => ({
  venueId,
  name: '',
  sport: 'Futsal',
  pricePerHour: 100000,
  image: SPORT_IMAGE.Futsal,
  facilities: [],
  indoor: true,
  surface: '',
  active: true,
});

export const AdminCourtsPage = () => {
  const { state, dispatch } = useStore();
  const { push } = useToast();
  const staff = state.staff.find((s) => s.id === state.user.staffId);
  const myVenueIds = staff?.role === 'owner' ? state.venues.map((v) => v.id) : staff?.venueIds ?? [];

  const [venueFilter, setVenueFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Court | null>(null);
  const [form, setForm] = useState<Omit<Court, 'id'>>(emptyCourt(myVenueIds[0] ?? ''));
  const [deleteTarget, setDeleteTarget] = useState<Court | null>(null);

  const courts = useMemo(
    () =>
      state.courts.filter(
        (c) => myVenueIds.includes(c.venueId) && (venueFilter === 'all' || c.venueId === venueFilter),
      ),
    [state.courts, myVenueIds, venueFilter],
  );

  const openAdd = () => {
    setEditing(null);
    setForm(emptyCourt(venueFilter !== 'all' ? venueFilter : myVenueIds[0] ?? ''));
    setModalOpen(true);
  };

  const openEdit = (c: Court) => {
    setEditing(c);
    setForm(c);
    setModalOpen(true);
  };

  const toggleFacility = (f: string) => {
    setForm((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(f) ? prev.facilities.filter((x) => x !== f) : [...prev.facilities, f],
    }));
  };

  const save = () => {
    if (!form.name.trim() || !form.venueId) {
      push('Nama lapangan dan venue wajib diisi', 'error');
      return;
    }
    if (editing) {
      dispatch({ type: 'PATCH_COURT', id: editing.id, patch: form });
      push('Data lapangan berhasil diperbarui');
    } else {
      dispatch({ type: 'ADD_COURT', court: { ...form, id: `c_${Date.now()}` } });
      push('Lapangan baru berhasil ditambahkan');
    }
    setModalOpen(false);
  };

  return (
    <div>
      <SectionHeading
        eyebrow="Data Master"
        title="Kelola Data Lapangan"
        description="Nama, jenis olahraga, harga per jam, foto, dan fasilitas tiap lapangan."
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
            <Button onClick={openAdd}>
              <Plus size={15} /> Tambah Lapangan
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {courts.map((c) => (
          <Card key={c.id} className="overflow-hidden">
            <div className="relative h-32">
              <img src={c.image} className="h-full w-full object-cover" alt={c.name} />
              <Badge tone={c.active ? 'success' : 'danger'} className="absolute right-3 top-3">
                {c.active ? 'Aktif' : 'Nonaktif'}
              </Badge>
              <Badge tone="neon" className="absolute left-3 top-3">
                {c.sport}
              </Badge>
            </div>
            <div className="p-4">
              <p className="truncate font-display text-sm font-bold text-white">{c.name}</p>
              <p className="text-xs text-white/40">{state.venues.find((v) => v.id === c.venueId)?.name}</p>
              <p className="mt-2 font-display text-base font-bold text-neon-300">
                {rupiah(c.pricePerHour)}
                <span className="text-xs font-normal text-white/40"> /jam</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {c.facilities.slice(0, 3).map((f) => (
                  <span key={f} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/45">
                    {f}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                  <Pencil size={12} /> Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => setDeleteTarget(c)}>
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Lapangan' : 'Tambah Lapangan Baru'} wide>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Venue">
            <Select value={form.venueId} onChange={(e) => setForm({ ...form, venueId: e.target.value })}>
              {state.venues
                .filter((v) => myVenueIds.includes(v.id))
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Nama Lapangan">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Jenis Olahraga">
            <Select
              value={form.sport}
              onChange={(e) => setForm({ ...form, sport: e.target.value as SportType, image: SPORT_IMAGE[e.target.value as SportType] })}
            >
              {SPORTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Harga per Jam (Rp)">
            <Input type="number" value={form.pricePerHour} onChange={(e) => setForm({ ...form, pricePerHour: Number(e.target.value) })} />
          </Field>
          <Field label="Jenis Permukaan">
            <Input value={form.surface} onChange={(e) => setForm({ ...form, surface: e.target.value })} placeholder="Rumput sintetis, vinyl, dsb." />
          </Field>
          <Field label="Foto Lapangan">
            <div className="flex flex-wrap gap-2">
              {Object.entries(SPORT_IMAGE).map(([sport, img]) => (
                <button
                  key={sport}
                  type="button"
                  onClick={() => setForm({ ...form, image: img })}
                  className={`h-12 w-16 overflow-hidden rounded-lg border-2 ${form.image === img ? 'border-neon-400' : 'border-transparent'}`}
                >
                  <img src={img} className="h-full w-full object-cover" alt={sport} />
                </button>
              ))}
            </div>
          </Field>
          <div className="sm:col-span-2">
            <Toggle checked={form.indoor} onChange={(v) => setForm({ ...form, indoor: v })} label="Lapangan Indoor" description="Nonaktifkan jika lapangan outdoor / terbuka" />
          </div>
          <div className="sm:col-span-2">
            <Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Tampilkan ke pelanggan" description="Lapangan nonaktif tidak akan muncul di pencarian" />
          </div>
          <div className="sm:col-span-2">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/45">Fasilitas</p>
            <div className="flex flex-wrap gap-2">
              {FACILITIES.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFacility(f)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    form.facilities.includes(f) ? 'border-neon-400 bg-neon-400/15 text-neon-300' : 'border-white/12 text-white/55'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>
            Batal
          </Button>
          <Button onClick={save}>
            <ShoppingBag size={15} /> {editing ? 'Simpan Perubahan' : 'Tambah Lapangan'}
          </Button>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus Lapangan?">
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-white/60">
              Yakin ingin menghapus <strong className="text-white">{deleteTarget.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
                Batal
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  dispatch({ type: 'REMOVE_COURT', id: deleteTarget.id });
                  push('Lapangan berhasil dihapus');
                  setDeleteTarget(null);
                }}
              >
                <Trash2 size={14} /> Hapus
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
