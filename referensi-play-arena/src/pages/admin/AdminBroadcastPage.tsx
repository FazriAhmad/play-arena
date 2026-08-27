import { useState } from 'react';
import { Mail, MessageCircle, Send, Smartphone } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { fmtDateTime } from '../../lib/utils';
import { Badge, Button, Card, Field, Input, Select, SectionHeading, Textarea, Toggle, useToast } from '../../components/ui';

const CHANNELS: { id: 'whatsapp' | 'email' | 'push'; label: string; icon: typeof Mail }[] = [
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'push', label: 'Push Notification', icon: Smartphone },
];

export const AdminBroadcastPage = () => {
  const { state, dispatch } = useStore();
  const { push } = useToast();
  const staff = state.staff.find((s) => s.id === state.user.staffId);
  const myVenueIds = staff?.role === 'owner' ? state.venues.map((v) => v.id) : staff?.venueIds ?? [];

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<'all' | 'member' | 'inactive' | 'venue-customers'>('all');
  const [venueId, setVenueId] = useState(myVenueIds[0] ?? '');
  const [channels, setChannels] = useState<Record<string, boolean>>({ whatsapp: true, email: false, push: true });

  const audienceCount = () => {
    if (audience === 'all') return state.customers.length;
    if (audience === 'member') return state.customers.filter((c) => c.tier !== 'non-member').length;
    if (audience === 'inactive')
      return state.customers.filter((c) => !state.bookings.some((b) => b.customerId === c.id && b.date >= state.bookings[0]?.date)).length || 3;
    return state.bookings.filter((b) => b.venueId === venueId).length;
  };

  const send = () => {
    if (!title.trim() || !message.trim()) {
      push('Judul dan pesan wajib diisi', 'error');
      return;
    }
    const selectedChannels = CHANNELS.filter((c) => channels[c.id]).map((c) => c.id);
    if (selectedChannels.length === 0) {
      push('Pilih minimal satu channel notifikasi', 'error');
      return;
    }
    const recipients = audienceCount();
    dispatch({
      type: 'ADD_BROADCAST',
      broadcast: {
        id: `bc_${Date.now()}`,
        title,
        message,
        audience,
        channels: selectedChannels,
        venueId: audience === 'venue-customers' ? venueId : undefined,
        sentAt: new Date().toISOString(),
        recipients,
        opened: Math.round(recipients * (0.35 + Math.random() * 0.3)),
      },
    });
    push(`Broadcast terkirim ke ${recipients} penerima!`);
    setTitle('');
    setMessage('');
  };

  return (
    <div>
      <SectionHeading eyebrow="Marketing" title="Broadcast Promo & Notifikasi" description="Kirim promo, pengumuman, atau info penting ke pelanggan via WhatsApp/Email/Push." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <Card className="space-y-4 p-5 sm:p-6">
          <Field label="Judul Broadcast">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Promo Jumat Berkah −20%" />
          </Field>
          <Field label="Isi Pesan">
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tuliskan pesan promo/pengumuman di sini..." className="min-h-32" />
          </Field>
          <Field label="Target Audiens">
            <Select value={audience} onChange={(e) => setAudience(e.target.value as any)}>
              <option value="all">Semua Pelanggan</option>
              <option value="member">Khusus Member</option>
              <option value="inactive">Pelanggan Tidak Aktif</option>
              <option value="venue-customers">Pelanggan Venue Tertentu</option>
            </Select>
          </Field>
          {audience === 'venue-customers' && (
            <Field label="Pilih Venue">
              <Select value={venueId} onChange={(e) => setVenueId(e.target.value)}>
                {state.venues
                  .filter((v) => myVenueIds.includes(v.id))
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
              </Select>
            </Field>
          )}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/45">Channel Pengiriman</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {CHANNELS.map((c) => (
                <Toggle
                  key={c.id}
                  checked={channels[c.id]}
                  onChange={(v) => setChannels({ ...channels, [c.id]: v })}
                  label={c.label}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-aqua-400/20 bg-aqua-500/5 p-3 text-sm text-aqua-200">
            <span>Estimasi penerima</span>
            <span className="font-bold">{audienceCount()} orang</span>
          </div>
          <Button className="w-full" size="lg" onClick={send}>
            <Send size={16} /> Kirim Broadcast Sekarang
          </Button>
        </Card>

        <div>
          <p className="mb-3 font-display text-sm font-bold text-white">Riwayat Broadcast</p>
          <div className="space-y-3">
            {state.broadcasts.map((b) => (
              <Card key={b.id} className="p-4">
                <div className="mb-1.5 flex flex-wrap gap-1.5">
                  {b.channels.map((c) => (
                    <Badge key={c} tone="info">
                      {c}
                    </Badge>
                  ))}
                  <Badge tone="neutral">{b.audience}</Badge>
                </div>
                <p className="text-sm font-semibold text-white">{b.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-white/50">{b.message}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-white/35">
                  <span>{fmtDateTime(b.sentAt)}</span>
                  <span>
                    {b.opened}/{b.recipients} dibaca
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
