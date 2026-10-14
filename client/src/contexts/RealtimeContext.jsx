import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { api } from '../services/api';
import { useServer } from './ServerContext';

const RealtimeContext = createContext({ socket: null, connected: false, devices: [] });

/**
 * One live Socket.IO connection for the whole app. Used for small status
 * messages only (upload progress, notes sync, shared-folder changes, who is
 * connected) — file bytes always go over plain HTTP.
 */
export function RealtimeProvider({ children }) {
  const { pinRequired, refresh } = useServer();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    if (pinRequired) return undefined; // wait until the PIN has been entered
    const s = io({
      path: '/socket.io',
      auth: { pin: api.getPin(), deviceName: api.getDeviceName() },
      reconnectionDelayMax: 4000,
    });
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('devices:update', setDevices);
    // The Admin panel (on any device) changed what is shared: everyone reloads the list.
    s.on('shares:changed', () => refresh());
    setSocket(s);
    return () => {
      s.close();
      setSocket(null);
      setConnected(false);
    };
  }, [pinRequired, refresh]);

  return (
    <RealtimeContext.Provider value={{ socket, connected, devices }}>{children}</RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
