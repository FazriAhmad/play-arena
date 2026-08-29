import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { Button, Card, Field, Input } from '../components/ui';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api.post<{ message: string }>('/forgot-password', { email });
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mengirim tautan reset.');
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
          <h1 className="mt-3 text-xl font-bold text-white">Lupa Password</h1>
          <p className="mt-1 text-sm text-slate-400">Masukkan email akun Anda, kami kirim tautan reset.</p>
        </div>

        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" autoFocus />
            </Field>
            {message && <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400">{message}</p>}
            {error && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-400">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Mengirim…' : 'Kirim Tautan Reset'}
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
