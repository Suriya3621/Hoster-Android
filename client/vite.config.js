import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The API base is also configurable at runtime (see src/services/api.js),
// but proxying /api during `npm run dev` means the client and server can
// share an origin, which keeps the LAN URL simple: http://<ip>:5173
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // equivalent to --host: binds 0.0.0.0 so LAN devices can connect
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4173',
        changeOrigin: true,
        // Adds X-Forwarded-For so the server can tell the host PC apart from
        // phones (needed for the Admin panel's "host PC only" rule).
        xfwd: true,
      },
      // Live channel (upload progress, notes sync, device presence).
      '/socket.io': {
        target: 'http://localhost:4173',
        changeOrigin: true,
        ws: true,
        xfwd: true,
      },
    },
  },
  preview: {
    host: true,
    port: 5173,
  },
});
