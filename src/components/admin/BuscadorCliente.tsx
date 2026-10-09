import { useEffect, useRef, useState } from 'react';
import { adminApi } from '../../api/reservasApi';
import type { ClienteRef } from '../../types/reservas';
import { iniciales } from '../../utils/catalogo';
import { Icon } from '../ui/Icon';

interface BuscadorClienteProps {
  valor: ClienteRef | null;
  onChange: (cliente: ClienteRef) => void;
  error?: string;
}

/** "Reservar para": search customers by name or email while typing. */
export function BuscadorCliente({ valor, onChange, error }: BuscadorClienteProps) {
  const [texto, setTexto] = useState(valor?.nombre ?? '');
  const [abierto, setAbierto] = useState(false);
  const [resultados, setResultados] = useState<ClienteRef[]>([]);
  const [activo, setActivo] = useState(0);
  const cajaRef = useRef<HTMLDivElement>(null);

  useEffect(() => setTexto(valor?.nombre ?? ''), [valor]);

  useEffect(() => {
    if (!abierto) return;
    let vigente = true;
    // Debounced: one request after the user stops typing, not one per key.
    const t = setTimeout(() => {
      adminApi
        .buscarClientes(texto === valor?.nombre ? '' : texto)
        .then((r) => {
          if (!vigente) return;
          setResultados(r);
          setActivo(0);
        })
        .catch(() => vigente && setResultados([]));
    }, 220);
    return () => {
      vigente = false;
      clearTimeout(t);
    };
  }, [texto, abierto, valor?.nombre]);

  useEffect(() => {
    const cerrar = (e: MouseEvent) => {
      if (!cajaRef.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, []);

  const elegir = (c: ClienteRef) => {
    onChange(c);
    setTexto(c.nombre);
    setAbierto(false);
  };

  return (
    <div className="field relative" ref={cajaRef}>
      <label className="label" htmlFor="buscar-cliente">
        Reservar para <span className="text-rose-600">*</span>
      </label>
      <div className={`input ${error ? 'input-error' : ''}`}>
        <Icon name="search" className="input-icon" />
        <input
          id="buscar-cliente"
          role="combobox"
          aria-expanded={abierto}
          aria-controls="clientes-lista"
          aria-autocomplete="list"
          autoComplete="off"
          value={texto}
          placeholder="Buscar por nombre o email"
          onFocus={() => setAbierto(true)}
          onChange={(e) => {
            setTexto(e.target.value);
            setAbierto(true);
          }}
          onKeyDown={(e) => {
            if (!abierto) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActivo((a) => Math.min(resultados.length - 1, a + 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActivo((a) => Math.max(0, a - 1));
            } else if (e.key === 'Enter' && resultados[activo]) {
              e.preventDefault();
              elegir(resultados[activo]);
            } else if (e.key === 'Escape') {
              setAbierto(false);
            }
          }}
        />
        {abierto && <span className="t-xs muted2 whitespace-nowrap">{resultados.length} coincidencias</span>}
      </div>
      {error && <span className="hint-error">{error}</span>}
      {abierto && resultados.length > 0 && (
        <ul id="clientes-lista" role="listbox" className="combo">
          {resultados.map((c, i) => (
            <li key={c.id} role="option" aria-selected={valor?.id === c.id}>
              <button
                type="button"
                className={`combo-item ${i === activo ? 'combo-item-on' : ''}`}
                onMouseEnter={() => setActivo(i)}
                onClick={() => elegir(c)}
              >
                <span className="avatar">{iniciales(c.nombre)}</span>
                <span className="flex grow flex-col">
                  <b className="t-sm font-semibold">{c.nombre}</b>
                  <span className="t-xs muted">{c.email}</span>
                </span>
                {valor?.id === c.id && <Icon name="check" className="text-accent" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
