import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Field, Input } from '../components/ui';
import { useAuth } from '../store/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.password_confirmation) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }
    setLoading(true);
    const res = await register(form);
    setLoading(false);
    if (res.ok) {
      navigate('/');
    } else {
      setError(res.message || 'Gagal mendaftar.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#1d5fc4] to-[#f97316] font-bold text-lg text-white">
            P
          </div>
          <h1 className="mt-3 text-xl font-bold text-slate-900">Daftar Akun Pelanggan</h1>
          <p className="mt-1 text-sm text-slate-500">Booking lapangan online jadi lebih cepat.</p>
        </div>

        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <Field label="Nama lengkap">
              <Input value={form.name} onChange={set('name')} placeholder="Nama Anda" autoFocus />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={set('email')} placeholder="you@email.com" />
            </Field>
            <Field label="Nomor HP">
              <Input value={form.phone} onChange={set('phone')} placeholder="0812xxxxxxx" />
            </Field>
            <Field label="Password" hint="Minimal 8 karakter">
              <Input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />
            </Field>
            <Field label="Konfirmasi password">
              <Input
                type="password"
                value={form.password_confirmation}
                onChange={set('password_confirmation')}
                placeholder="••••••••"
              />
            </Field>
            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Mendaftarkan…' : 'Daftar'}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-slate-500">
            Sudah punya akun?{' '}
            <Link to="/login" className="font-medium text-[#1d5fc4] hover:underline">
              Masuk
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
