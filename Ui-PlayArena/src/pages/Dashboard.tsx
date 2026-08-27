import { Card } from '../components/ui';
import { ROLE_LABELS } from '../lib/types';
import { useAuth } from '../store/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Halo, {user.name.split(' ')[0]} 👋</h1>
      <p className="mt-1 text-sm text-slate-500">
        Masuk sebagai <span className="font-medium text-slate-700">{ROLE_LABELS[user.role]}</span>.
      </p>

      <Card className="mt-6 p-6">
        <p className="text-sm text-slate-600">
          Modul 01 (Pengguna &amp; Role) sudah aktif. Direktori lapangan, kalender booking, dan modul lain akan
          muncul di sini begitu dibangun sesuai roadmap PRD.
        </p>
      </Card>
    </div>
  );
}
