import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import Files from './pages/Files';
import Videos from './pages/Videos';
import Photos from './pages/Photos';
import Music from './pages/Music';
import Documents from './pages/Documents';
import Favorites from './pages/Favorites';
import Settings from './pages/Settings';
import Notes from './pages/Notes';
import Admin from './pages/Admin';
import PinGate from './pages/PinGate';
import { useServer } from './contexts/ServerContext';

export default function App() {
  const { pinRequired, loading } = useServer();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-surface text-text-muted text-sm">
        Connecting to Hoster…
      </div>
    );
  }

  if (pinRequired) return <PinGate />;

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/files" element={<Files />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/photos" element={<Photos />} />
        <Route path="/music" element={<Music />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
