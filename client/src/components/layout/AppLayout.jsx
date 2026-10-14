import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import TopBar from './TopBar';
import UploadCenter from '../uploads/UploadCenter';

export default function AppLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface text-text">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>
      <MobileNav />
      <UploadCenter />
    </div>
  );
}
