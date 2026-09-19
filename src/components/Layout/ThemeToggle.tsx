import { useTheme } from '../../hooks/useTheme';
import { Icon } from '../ui/Icon';

export function ThemeToggle({ floating = false }: { floating?: boolean }) {
  const { modoOscuro, alternarModo } = useTheme();

  return (
    <button
      type="button"
      className={`theme-toggle${floating ? ' theme-toggle-floating' : ''}`}
      onClick={alternarModo}
      aria-label={modoOscuro ? 'Activar modo claro' : 'Activar modo oscuro'}
      aria-pressed={modoOscuro}
      title={modoOscuro ? 'Activar modo claro' : 'Activar modo oscuro'}
    >
      <Icon name={modoOscuro ? 'sun' : 'moon'} size={16} />
      <span className="sr-only">{modoOscuro ? 'Modo oscuro activado' : 'Modo claro activado'}</span>
    </button>
  );
}
