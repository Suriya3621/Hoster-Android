import { useState } from 'react';
import toast from 'react-hot-toast';
import { KeyRound, Info, Smartphone, ShieldCheck, Repeat } from 'lucide-react';
import { Link } from 'react-router-dom';
import ThemeSelector from '../components/settings/ThemeSelector';
import ShareManager from '../components/settings/ShareManager';
import { useServer } from '../contexts/ServerContext';
import { api } from '../services/api';

export default function Settings() {
  const { status, network, refresh } = useServer();
  const [pinInput, setPinInput] = useState(api.getPin());
  const [deviceName, setDeviceName] = useState(api.getDeviceName());

  function saveDeviceName(e) {
    e.preventDefault();
    api.setDeviceName(deviceName.trim());
    toast.success('Device name saved — reload the page to apply it');
  }

  function savePin(e) {
    e.preventDefault();
    api.setPin(pinInput.trim());
    toast.success('PIN saved');
    refresh();
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-semibold mb-1">Settings</h1>
        <p className="text-sm text-text-muted">Configure how Hoster looks and who can reach it.</p>
      </div>

      <section>
        <h2 className="text-sm font-medium text-text-muted mb-3">Theme</h2>
        <ThemeSelector />
      </section>

      <section>
        <h2 className="text-sm font-medium text-text-muted mb-3">Shared folders</h2>
        <ShareManager />
      </section>

      <section>
        <h2 className="text-sm font-medium text-text-muted mb-3 flex items-center gap-2">
          <Smartphone size={14} /> This device
        </h2>
        <div className="card p-4">
          <p className="text-sm text-text-muted mb-3">
            Other devices see this name next to live uploads (for example "Sam's Phone is uploading…").
          </p>
          <form onSubmit={saveDeviceName} className="flex gap-2">
            <input value={deviceName} onChange={(e) => setDeviceName(e.target.value)} maxLength={40} className="input flex-1" />
            <button type="submit" className="btn-primary">Save</button>
          </form>
        </div>
      </section>

      {/* Only shown inside the Hoster Android app (its user agent contains "HosterApp"). */}
      {navigator.userAgent.includes('HosterApp') && (
        <section>
          <a href="http://localhost/?change=1" className="card flex items-center gap-3 p-4 hover:border-accent/50">
            <Repeat size={18} className="text-accent" />
            <span className="flex-1 text-sm">Connect to a <span className="font-medium">different PC</span> (change server address)</span>
          </a>
        </section>
      )}

      <section>
        <Link to="/admin" className="card flex items-center gap-3 p-4 hover:border-accent/50">
          <ShieldCheck size={18} className="text-accent" />
          <span className="flex-1 text-sm">Manage shared folders in the <span className="font-medium">Admin panel</span></span>
        </Link>
      </section>

      <section>
        <h2 className="text-sm font-medium text-text-muted mb-3 flex items-center gap-2">
          <KeyRound size={14} /> Access PIN
        </h2>
        <div className="card p-4">
          <p className="text-sm text-text-muted mb-3">
            {status?.authRequired
              ? 'This server requires a PIN. Enter it here so this browser can access your files.'
              : 'No PIN is currently required — anyone on your Wi-Fi can open Hoster. Set HOSTER_PIN on the server to require one.'}
          </p>
          <form onSubmit={savePin} className="flex gap-2">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter PIN"
              className="input flex-1"
            />
            <button type="submit" className="btn-primary">
              Save
            </button>
          </form>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-text-muted mb-3 flex items-center gap-2">
          <Info size={14} /> About this server
        </h2>
        <div className="card p-4 text-sm space-y-1 text-text-muted">
          <p>Version: Hoster 1.0</p>
          <p>Local address: {network?.url || '—'}</p>
          <p>Uptime: {status ? `${Math.floor(status.uptimeSeconds / 60)} min` : '—'}</p>
        </div>
      </section>
    </div>
  );
}
