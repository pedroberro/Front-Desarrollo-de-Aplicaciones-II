import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { ThemeToggle } from './ThemeToggle';

const AUTH_SCREENS = ['/login', '/registro', '/olvide-password', '/reset-password', '/confirmar-email'];

export function AppShell() {
  const { pathname } = useLocation();

  if (AUTH_SCREENS.includes(pathname)) {
    return (
      <main className="min-h-screen bg-slate-50">
        <ThemeToggle floating />
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
