import { Megaphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Announcement } from '../lib/types';
import { Card } from '../components/ui';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: Announcement[] }>('/announcements')
      .then((res) => setAnnouncements(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Pengumuman</h1>
      <p className="mt-1 text-sm text-slate-400">Promo &amp; info terbaru dari venue tempat Anda booking.</p>

      <div className="mt-6 space-y-3">
        {loading && <p className="text-sm text-slate-500">Memuat…</p>}
        {!loading && announcements.length === 0 && <p className="text-sm text-slate-500">Belum ada pengumuman.</p>}
        {announcements.map((a) => (
          <Card key={a.id} className="flex items-start gap-3 p-4">
            <Megaphone size={18} className="mt-0.5 shrink-0 text-[#1d5fc4]" />
            <div>
              <p className="text-sm font-semibold text-white">{a.title}</p>
              <p className="mt-1 text-sm text-slate-300">{a.body}</p>
              <p className="mt-2 text-xs text-slate-500">
                {new Date(a.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                {a.venue && ` · ${a.venue.name}`}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
