import { useState } from 'react';
import { Server, KeyRound } from 'lucide-react';
import { api } from '../services/api';
import { useServer } from '../contexts/ServerContext';

export default function PinGate() {
  const { refresh } = useServer();
  const [pin, setPin] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setChecking(true);
    setError(null);
    api.setPin(pin.trim());
    try {
      await api.getShares(); // any authenticated endpoint validates the PIN
      refresh();
    } catch (err) {
      setError('Incorrect PIN. Try again.');
      api.setPin('');
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-surface text-text px-4">
      <form onSubmit={submit} className="card p-6 w-full max-w-sm space-y-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-accent-soft flex items-center justify-center mx-auto">
          <Server size={22} className="text-accent" />
        </div>
        <div>
          <h1 className="font-semibold">This Hoster server is protected</h1>
          <p className="text-sm text-text-muted mt-1">Enter the PIN to access shared files.</p>
        </div>
        <div className="relative">
          <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            autoFocus
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN"
            className="input w-full pl-9 text-center"
          />
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        <button type="submit" disabled={checking} className="btn-primary w-full justify-center">
          {checking ? 'Checking…' : 'Unlock'}
        </button>
      </form>
    </div>
  );
}
