import { useMemo, useState } from 'react';
import { Building2, MapPin, Pencil, Phone, Plus, Power } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import type { Venue } from '../../lib/types';
import { FACILITIES } from '../../data/seed';
import { Badge, Button, Card, Field, Input, Modal, SectionHeading, Textarea, useToast } from '../../components/ui';

const emptyVenue = (): Omit<Venue, 'id'> => ({
  name: '',
  city: '',
  district: '',
  address: '',
  phone: '+62',
  lat: -6.2,
  lng: 106.8,
  cover: '/images/futsal.jpg',
  facilities: [],
  openHour: 7,
  closeHour: 22,
  description: '',
  active: true,
});

export const AdminVenuesPage = () => {
  const { state, dispatch } = useStore();
  const { push } = useToast();
  const staff = state.staff.find((s) => s.id === state.user.staffId);
  const myVenueIds = staff?.role === 'owner' ? state.venues.map((v) => v.id) : staff?.venueIds ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Venue | null>(null);
  const [form, setForm] = useState<Omit<Venue, 'id'>>(emptyVenue());

  const venues = useMemo(() => state.venues.filter((v) => myVenueIds.includes(v.id)), [state.venues, myVenueIds]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyVenue());
    setModalOpen(true);
  };

  const openEdit = (v: Venue) => {
    setEditing(v);
    setForm(v);
    setModalOpen(true);
  };

  const toggleFacility = (f: string) => {
    setForm((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(f) ? prev.facilities.filter((x) => x !== f) : [...prev.facilities, f],
    }));
  };

  const save = () => {
    if (!form.name.trim() || !form.address.trim()) {
      push('Nama dan alamat venue wajib diisi', 'error');
      return;
    }
    if (editing) {
      dispatch({ type: 'PATCH_VENUE', id: editing.id, patch: form });
      push('Venue berhasil diperbarui');
    } else {
      dispatch({ type: 'ADD_VENUE', venue: { ...form, id: `v_${Date.now()}` } });
      push('Venue baru berhasil ditambahkan');
    }
    setModalOpen(false);
  };

  return (
    <div>
      <SectionHeading
        eyebrow="Multi Venue"
        title="Kelola Venue"
        description="Tambahkan venue baru atau perbarui informasi venue yang sudah ada."
        right={
          <Button onClick={openAdd}>
            <Plus size={15} /> Tambah Venue
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {venues.map((v) => (
          <Card key={v.id} className="overflow-hidden">
            <div className="relative h-36">
              <img src={v.cover} className="h-full w-full object-cover" alt={v.name} />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 to-transparent" />
              <Badge tone={v.active ? 'success' : 'danger'} className="absolute right-3 top-3">
                {v.active ? 'Aktif' : 'Nonaktif'}
              </Badge>
              <p className="absolute bottom-3 left-4 font-display text-lg font-bold text-white">{v.name}</p>
            </div>
            <div className="p-5">
              <p className="flex items-center gap-1.5 text-xs text-white/50">
                <MapPin size={13} /> {v.address}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-white/50">
                <Phone size={13} /> {v.phone}
              </p>
              <p className="mt-2 text-xs text-white/40">
                Jam operasional {String(v.openHour).padStart(2, '0')}:00 – {String(v.closeHour).padStart(2, '0')}:00 ·{' '}
                {state.courts.filter((c) => c.venueId === v.id).length} lapangan
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {v.facilities.slice(0, 5).map((f) => (
                  <span key={f} className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-white/50">
                    {f}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(v)}>
                  <Pencil size={13} /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="subtle"
                  onClick={() => {
                    dispatch({ type: 'PATCH_VENUE', id: v.id, patch: { active: !v.active } });
                    push(`Venue ${v.active ? 'dinonaktifkan' : 'diaktifkan'}`);
                  }}
                >
                  <Power size={13} /> {v.active ? 'Nonaktifkan' : 'Aktifkan'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Venue' : 'Tambah Venue Baru'} wide>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nama Venue">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Nomor Telepon">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Kota">
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </Field>
          <Field label="Kecamatan / Area">
            <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
          </Field>
          <Field label="Alamat Lengkap" className="sm:col-span-2">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="Jam Buka">
            <Input type="number" min={0} max={23} value={form.openHour} onChange={(e) => setForm({ ...form, openHour: Number(e.target.value) })} />
          </Field>
          <Field label="Jam Tutup">
            <Input type="number" min={1} max={24} value={form.closeHour} onChange={(e) => setForm({ ...form, closeHour: Number(e.target.value) })} />
          </Field>
          <Field label="Deskripsi" className="sm:col-span-2">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
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
            <Building2 size={15} /> {editing ? 'Simpan Perubahan' : 'Tambah Venue'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
