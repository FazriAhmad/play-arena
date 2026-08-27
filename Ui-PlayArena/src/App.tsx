import { useEffect, useState } from 'react';
import { api } from './lib/api';

function App() {
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [appName, setAppName] = useState('');

  useEffect(() => {
    api
      .get<{ ok: boolean; app: string }>('/ping')
      .then((res) => {
        setAppName(res.app);
        setStatus('ok');
      })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="text-center">
        <h1 className="font-bold text-2xl">PlayArena</h1>
        <p className="mt-2 text-slate-400 text-sm">
          {status === 'checking' && 'Menghubungkan ke backend…'}
          {status === 'ok' && `Terhubung ke ${appName} ✓`}
          {status === 'error' && 'Backend belum jalan — start Api-PlayArena dulu.'}
        </p>
      </div>
    </div>
  );
}

export default App;
