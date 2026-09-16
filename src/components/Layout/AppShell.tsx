import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';

export function AppShell() {
  const { pathname } = useLocation();
  const isAuthScreen = ['/login', '/registro', '/olvide-password'].includes(pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      {!isAuthScreen && <Navbar />}
      <main className={isAuthScreen ? 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8' : 'mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'}>
        <Outlet />
      </main>
    </div>
  );
}
