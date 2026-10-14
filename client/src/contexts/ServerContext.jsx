import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';

const ServerContext = createContext(null);

export function ServerProvider({ children }) {
  const [status, setStatus] = useState(null);
  const [network, setNetwork] = useState(null);
  const [shares, setShares] = useState([]);
  const [online, setOnline] = useState(false);
  const [pinRequired, setPinRequired] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const s = await api.getStatus();
      setStatus(s);
      setOnline(true);
      setPinRequired(Boolean(s.authRequired) && !api.hasPin());

      const [net, shareData] = await Promise.all([api.getNetwork(), api.getShares()]);
      setNetwork(net);
      setShares(shareData.shares || []);
    } catch (err) {
      setOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <ServerContext.Provider
      value={{ status, network, shares, online, pinRequired, loading, refresh }}
    >
      {children}
    </ServerContext.Provider>
  );
}

export function useServer() {
  const ctx = useContext(ServerContext);
  if (!ctx) throw new Error('useServer must be used within ServerProvider');
  return ctx;
}
