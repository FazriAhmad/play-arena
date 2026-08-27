import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Field, Input } from '../components/ui';
import { useAuth } from '../store/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(loginValue, password);
    setLoading(false);
    if (res.ok) {
      navigate(res.user?.role === 'pelanggan' ? '/' : '/dashboard');
    } else {
      setError(res.message || 'Email/nomor HP atau password salah.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1d5fc4] font-bold text-lg text-white">
            P
          </div>
          <h1 className="mt-3 text-xl font-bold text-slate-900">PlayArena</h1>
          <p className="mt-1 text-sm text-slate-500">Masuk untuk booking lapangan atau kelola venue.</p>
        </div>

        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <Field label="Email atau nomor HP">
              <Input
                value={loginValue}
                onChange={(e) => setLoginValue(e.target.value)}
                placeholder="you@email.com atau 0812xxxxxxx"
                autoFocus
              />
            </Field>
            <Field label="Password">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </Field>
            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Memeriksa…' : 'Masuk'}
            </Button>
          </form>
          <div className="mt-4 flex items-center justify-between text-xs">
            <Link to="/forgot-password" className="font-medium text-[#1d5fc4] hover:underline">
              Lupa password?
            </Link>
            <Link to="/register" className="font-medium text-[#1d5fc4] hover:underline">
              Belum punya akun? Daftar
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
