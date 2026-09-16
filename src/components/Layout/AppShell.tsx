import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';

const AUTH_SCREENS = ['/login', '/registro', '/olvide-password'];

export function AppShell() {
  const { pathname } = useLocation();

  if (AUTH_SCREENS.includes(pathname)) {
    return (
      <main className="min-h-screen bg-slate-50">
        <Outlet />
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="page mx-auto w-full max-w-[1440px]">
        <Outlet />
      </main>
    </div>
  );
}
