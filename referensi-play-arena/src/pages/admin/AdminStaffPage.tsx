import { useState } from 'react';
import { Mail, Phone, Plus, ShieldAlert, Trash2, UserCog } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import type { Staff, StaffRole } from '../../lib/types';
import { ROLE_LABEL, ROLE_PERMISSIONS } from '../../lib/permissions';
import { fmtDateShort, initials } from '../../lib/utils';
import { Badge, Button, Card, Field, Input, Modal, Select, SectionHeading, useToast } from '../../components/ui';

const ROLE_TONE: Record<StaffRole, 'neon' | 'info' | 'warn' | 'neutral'> = {
  owner: 'neon',
  admin: 'info',
  kasir: 'warn',
  staff: 'neutral',
};

const emptyStaff = (venueIds: string[]): Omit<Staff, 'id'> => ({
  name: '',
  role: 'kasir',
  email: '',
  phone: '+62',
  venueIds,
  active: true,
  joinedAt: new Date().toISOString().slice(0, 10),
});

export const AdminStaffPage = () => {
  const { state, dispatch } = useStore();
  const { push } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Omit<Staff, 'id'>>(emptyStaff([state.venues[0]?.id]));
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);

  const toggleVenue = (id: string) => {
    setForm((prev) => ({
      ...prev,
      venueIds: prev.venueIds.includes(id) ? prev.venueIds.filter((x) => x !== id) : [...prev.venueIds, id],
    }));
  };

  const save = () => {
    if (!form.name.trim() || !form.email.trim()) {
      push('Nama dan email wajib diisi', 'error');
      return;
    }
    dispatch({ type: 'ADD_STAFF', staff: { ...form, id: `st_${Date.now()}` } });
    push('Staff baru berhasil ditambahkan');
    setModalOpen(false);
    setForm(emptyStaff([state.venues[0]?.id]));
  };

  return (
    <div>
      <SectionHeading
        eyebrow="Manajemen Tim"
        title="Staff & Kasir"
        description="Kelola akses tim per venue dengan role terbatas: Owner, Admin, Kasir, Staff."
        right={
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={15} /> Tambah Staff
          </Button>
        }
      />

      <Card className="mb-6 p-5">
        <p className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
          <ShieldAlert size={16} className="text-amber-300" /> Hak Akses per Role
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(ROLE_PERMISSIONS) as StaffRole[]).map((r) => (
            <div key={r} className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
              <Badge tone={ROLE_TONE[r]} className="mb-2">
                {ROLE_LABEL[r]}
              </Badge>
              <p className="text-[11px] leading-relaxed text-white/45">{ROLE_PERMISSIONS[r].length} menu dapat diakses</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {state.staff.map((s) => (
          <Card key={s.id} className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-neon-400 to-aqua-400 text-xs font-bold text-ink-950">
                  {initials(s.name)}
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{s.name}</p>
                  <Badge tone={ROLE_TONE[s.role]}>{ROLE_LABEL[s.role]}</Badge>
                </div>
              </div>
              {s.role !== 'owner' && (
                <button onClick={() => setDeleteTarget(s)} className="text-white/30 hover:text-rose-300">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            <p className="flex items-center gap-1.5 text-xs text-white/50">
              <Mail size={12} /> {s.email}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-white/50">
              <Phone size={12} /> {s.phone}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {s.venueIds.map((vId) => (
                <span key={vId} className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-white/50">
                  {state.venues.find((v) => v.id === vId)?.name}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-white/35">Bergabung {fmtDateShort(s.joinedAt)}</p>
          </Card>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Tambah Staff Baru">
        <div className="space-y-4">
          <Field label="Nama Lengkap">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="No. Telepon">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
          </div>
          <Field label="Role / Jabatan">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}>
              <option value="admin">Admin Venue</option>
              <option value="kasir">Kasir</option>
              <option value="staff">Staff</option>
            </Select>
          </Field>
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/45">Akses Venue</p>
            <div className="flex flex-wrap gap-2">
              {state.venues.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => toggleVenue(v.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    form.venueIds.includes(v.id) ? 'border-neon-400 bg-neon-400/15 text-neon-300' : 'border-white/12 text-white/55'
                  }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={save}>
              <UserCog size={15} /> Tambah Staff
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus Staff?">
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-white/60">
              Yakin ingin menghapus akses <strong className="text-white">{deleteTarget.name}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
                Batal
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  dispatch({ type: 'REMOVE_STAFF', id: deleteTarget.id });
                  push('Staff dihapus');
                  setDeleteTarget(null);
                }}
              >
                Hapus
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
