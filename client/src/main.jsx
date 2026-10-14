import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { ServerProvider } from './contexts/ServerContext.jsx';
import { RealtimeProvider } from './contexts/RealtimeContext.jsx';
import { UploadProvider } from './contexts/UploadContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <ServerProvider>
        <RealtimeProvider>
          <UploadProvider>
        <BrowserRouter>
          <App />
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: 'var(--surface-raised)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
              },
            }}
          />
        </BrowserRouter>
          </UploadProvider>
        </RealtimeProvider>
      </ServerProvider>
    </ThemeProvider>
  </React.StrictMode>
);
