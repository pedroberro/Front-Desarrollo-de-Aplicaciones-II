import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Icon } from '../ui/Icon';
import { HOME_PATH } from '../../routes';
import { ThemeToggle } from './ThemeToggle';

// Sections from the wireframes that do not exist yet: shown, but not navigable.
const SECCIONES_PENDIENTES = ['Empresas', 'Mis reservas'];

export function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <header className="topbar">
      <Link to={HOME_PATH} className="brand">
        <Icon name="layers" size={20} className="text-indigo-600" />
        Planta Libre
      </Link>

      <nav className="flex grow items-center gap-6" aria-label="Secciones">
        {SECCIONES_PENDIENTES.map((seccion) => (
          <span key={seccion} className="navlink navlink-off" title="Disponible próximamente" aria-disabled="true">
            {seccion}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-2">
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
          {usuario?.nombre}
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
      </div>
    </header>
  );
}
