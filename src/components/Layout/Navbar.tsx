import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Icon } from '../ui/Icon';
import { LogoMark } from '../ui/Logo';
import { HOME_PATH } from '../../routes';
import { ThemeToggle } from './ThemeToggle';

interface Seccion {
  label: string;
  to: string;
  /** Other paths that belong to the section, so it stays marked while drilling down. */
  tambien?: string[];
}

const CLIENTE: Seccion[] = [
  { label: 'Empresas', to: '/empresas', tambien: ['/edificios', '/pisos'] },
  { label: 'Mis reservas', to: '/mis-reservas' },
];

const ADMIN: Seccion[] = [
  { label: 'Agenda del día', to: '/admin/agenda', tambien: ['/admin/pisos'] },
  { label: 'Reservas', to: '/admin/reservas' },
  { label: 'Bloqueos', to: '/admin/bloqueos' },
];

export function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [navAbierta, setNavAbierta] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const esAdmin = !!usuario?.permisos?.includes('RESERVAS_GESTIONAR');
  const secciones = esAdmin ? ADMIN : CLIENTE;

  useEffect(() => {
    if (!menuAbierto) return;
    const cerrar = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuAbierto(false);
    };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [menuAbierto]);

  const handleLogout = async () => {
    setMenuAbierto(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const activa = (s: Seccion) => [s.to, ...(s.tambien ?? [])].some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <header className="topbar relative">
      <Link to={HOME_PATH} className="brand">
        <LogoMark size={22} />
        Planta Libre
      </Link>
      {esAdmin && (
        <span className="admin-pill">
          <Icon name="shield" size={12} /> Admin
        </span>
      )}

      <nav className={`${navAbierta ? 'flex' : 'hidden'} menu flex-col md:static md:flex md:flex-row md:grow md:items-center md:gap-6 md:border-0 md:bg-transparent md:p-0 md:shadow-none`} aria-label="Secciones">
        {secciones.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className={`navlink menu-item md:h-auto md:w-auto md:rounded-none md:px-0 md:hover:bg-transparent ${activa(s) ? 'navlink-on' : ''}`}
            aria-current={activa(s) ? 'page' : undefined}
            onClick={() => setNavAbierta(false)}
          >
            {s.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="t-sm flex items-center gap-2 rounded-md px-2 py-1 hover:bg-slate-100"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuAbierto}
          >
            <Icon name="user" className="text-slate-500" />
            <span className="hidden sm:inline">{usuario?.nombre}</span>
            <Icon name="chevDown" size={14} className="text-slate-400" />
          </button>
          {menuAbierto && (
            <div className="menu" role="menu">
              <Link to="/perfil" className="menu-item" role="menuitem" onClick={() => setMenuAbierto(false)}>
                <Icon name="user" className="text-slate-500" />
                Mi perfil
              </Link>
              <button type="button" className="menu-item" role="menuitem" onClick={handleLogout}>
                <Icon name="logout" className="text-slate-500" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-icon md:hidden"
          onClick={() => setNavAbierta((v) => !v)}
          aria-expanded={navAbierta}
          aria-label="Abrir las secciones"
        >
          <Icon name="list" />
        </button>
      </div>
    </header>
  );
}
