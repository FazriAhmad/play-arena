import { useMemo, useState } from 'react';
import { CalendarClock, Clock, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { addDays, fmtDateLong, hourLabel, todayISO } from '../../lib/utils';
import { Button, Card, Field, Input, Modal, Select, SectionHeading, Textarea, useToast } from '../../components/ui';

export const AdminSchedulePage = () => {
  const { state, dispatch } = useStore();
  const { push } = useToast();
  const staff = state.staff.find((s) => s.id === state.user.staffId);
  const myVenueIds = staff?.role === 'owner' ? state.venues.map((v) => v.id) : staff?.venueIds ?? [];
  const myVenues = state.venues.filter((v) => myVenueIds.includes(v.id));
  const myCourts = state.courts.filter((c) => myVenueIds.includes(c.venueId));

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    courtId: myCourts[0]?.id ?? '',
    date: addDays(todayISO(), 1),
    startHour: 10,
    durationHours: 1,
    reason: 'Maintenance rutin',
  });

  const blocks = useMemo(
    () => state.blocks.filter((b) => myCourts.some((c) => c.id === b.courtId)).sort((a, b) => (a.date < b.date ? -1 : 1)),
    [state.blocks, myCourts],
  );

  const saveHours = (venueId: string, openHour: number, closeHour: number) => {
    dispatch({ type: 'PATCH_VENUE', id: venueId, patch: { openHour, closeHour } });
    push('Jam operasional diperbarui');
  };

  const addBlock = () => {
    if (!form.courtId) {
      push('Pilih lapangan terlebih dahulu', 'error');
      return;
    }
    dispatch({
      type: 'ADD_BLOCK',
      block: { id: `bl_${Date.now()}`, ...form },
    });
    push('Slot berhasil diblokir');
    setModalOpen(false);
  };

  return (
    <div className="space-y-10">
      <div>
        <SectionHeading eyebrow="Jam Operasional" title="Atur jam buka & tutup venue" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {myVenues.map((v) => (
            <Card key={v.id} className="p-5">
              <p className="font-display text-sm font-bold text-white">{v.name}</p>
              <div className="mt-3 flex items-center gap-3">
                <Field label="Buka" className="flex-1">
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={v.openHour}
                    onChange={(e) => saveHours(v.id, Number(e.target.value), v.closeHour)}
                  />
                </Field>
                <Field label="Tutup" className="flex-1">
                  <Input
                    type="number"
                    min={1}
                    max={24}
                    value={v.closeHour}
                    onChange={(e) => saveHours(v.id, v.openHour, Number(e.target.value))}
                  />
                </Field>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-white/40">
                <Clock size={12} /> Total {v.closeHour - v.openHour} jam operasional/hari
              </p>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <SectionHeading
          eyebrow="Blokir Slot"
          title="Slot diblokir (maintenance / event internal)"
          description="Slot yang diblokir tidak bisa dibooking pelanggan."
          right={
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={15} /> Blokir Slot Baru
            </Button>
          }
        />
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-left text-xs uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-4 py-3">Lapangan</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Jam</th>
                  <th className="px-4 py-3">Alasan</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {blocks.map((b) => {
                  const court = state.courts.find((c) => c.id === b.courtId);
                  return (
                    <tr key={b.id}>
                      <td className="px-4 py-3 font-medium text-white">{court?.name}</td>
                      <td className="px-4 py-3 text-white/60">{fmtDateLong(b.date)}</td>
                      <td className="px-4 py-3 text-white/60">
                        {hourLabel(b.startHour)}–{hourLabel(b.startHour + b.durationHours)}
                      </td>
                      <td className="px-4 py-3 text-white/60">{b.reason}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            dispatch({ type: 'REMOVE_BLOCK', id: b.id });
                            push('Blokir slot dihapus');
                          }}
                          className="text-rose-300 hover:text-rose-200"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {blocks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-white/40">
                      Belum ada slot yang diblokir.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Blokir Slot Baru">
        <div className="space-y-4">
          <Field label="Lapangan">
            <Select value={form.courtId} onChange={(e) => setForm({ ...form, courtId: e.target.value })}>
              {myCourts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tanggal">
              <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
                <input
                  type="date"
                  value={form.date}
                  min={todayISO()}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-xl border border-white/12 bg-ink-900/80 px-3 py-2.5 text-sm text-white outline-none focus:border-neon-400/60"
                />
              </div>
            </Field>
            <Field label="Jam Mulai">
              <Select value={form.startHour} onChange={(e) => setForm({ ...form, startHour: Number(e.target.value) })}>
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {hourLabel(h)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Durasi (jam)">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 6].map((h) => (
                <button
                  key={h}
                  onClick={() => setForm({ ...form, durationHours: h })}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                    form.durationHours === h ? 'border-neon-400 bg-neon-400/15 text-neon-300' : 'border-white/12 text-white/50'
                  }`}
                >
                  {h} jam
                </button>
              ))}
            </div>
          </Field>
          <Field label="Alasan">
            <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={addBlock}>
              <CalendarClock size={15} /> Blokir Slot
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
