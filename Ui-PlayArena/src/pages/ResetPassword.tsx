import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { Button, Card, Field, Input } from '../components/ui';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [email, setEmail] = useState(params.get('email') || '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== passwordConfirmation) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/reset-password', {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      navigate('/login');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mengubah password. Tautan mungkin sudah kedaluwarsa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#1d5fc4] to-[#f97316] font-bold text-lg text-white">
            P
          </div>
          <h1 className="mt-3 text-xl font-bold text-white">Atur Ulang Password</h1>
        </div>

        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
            </Field>
            <Field label="Password baru" hint="Minimal 8 karakter">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoFocus />
            </Field>
            <Field label="Konfirmasi password baru">
              <Input
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
            {error && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-400">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Menyimpan…' : 'Ubah Password'}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-slate-400">
            <Link to="/login" className="font-medium text-[#1d5fc4] hover:underline">
              Kembali ke halaman masuk
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
