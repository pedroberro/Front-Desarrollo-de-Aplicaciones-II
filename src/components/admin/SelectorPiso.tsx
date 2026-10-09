import { useState } from 'react';
import type { EdificioConPisos } from '../../types/reservas';
import { Icon } from '../ui/Icon';

interface SelectorPisoProps {
  edificios: EdificioConPisos[];
  edificioId: number | null;
  pisoId: number | null;
  onChange: (edificioId: number, pisoId: number) => void;
  /** Optional "all" entries, for the listing filters. */
  permitirTodos?: boolean;
  onTodos?: (edificioId: number | null, pisoId: number | null) => void;
  /**
   * For listings that can filter by company on their own (the whole list is loaded): the company
   * stays chosen with "all buildings". Without it, choosing a company jumps to its first building,
   * because the API only filters by building.
   */
  empresa?: string | null;
  onEmpresa?: (empresa: string | null) => void;
}

/**
 * Company, building and floor selectors of the admin screens, applied in cascade: the company narrows
 * the buildings, and the building narrows the floors. Changing the building jumps to its top floor.
 */
export function SelectorPiso({ edificios, edificioId, pisoId, onChange, permitirTodos, onTodos, empresa, onEmpresa }: SelectorPisoProps) {
  const edificio = edificios.find((e) => e.id === edificioId);
  // The company follows the chosen building; with "all buildings" it is kept here or by the caller.
  const [empresaLibre, setEmpresaLibre] = useState<string | null>(null);
  const empresaActual = edificio?.empresa ?? (onEmpresa ? empresa ?? null : empresaLibre);

  const empresas = [...new Set(edificios.map((e) => e.empresa))].sort((a, b) => a.localeCompare(b, 'es'));
  const delaEmpresa = edificios.filter((e) => e.pisos.length > 0 && (!empresaActual || e.empresa === empresaActual));
  const todosLosEdificios = permitirTodos && (!empresaActual || !!onEmpresa);

  const elegirEmpresa = (nombre: string | null) => {
    setEmpresaLibre(nombre);
    onEmpresa?.(nombre);
    const primero = edificios.find((e) => e.empresa === nombre && e.pisos.length > 0);
    if (permitirTodos) {
      if (!nombre || onEmpresa) return onTodos?.(null, null);
      return onTodos?.(primero?.id ?? null, null);
    }
    if (primero) onChange(primero.id, primero.pisos[0].id);
  };

  return (
    <>
      <div className="field w-full sm:w-[200px]">
        <label className="label" htmlFor="sel-empresa">Empresa</label>
        <div className="input">
          <Icon name="briefcase" className="input-icon" />
          <select id="sel-empresa" value={empresaActual ?? ''} onChange={(e) => elegirEmpresa(e.target.value || null)}>
            {permitirTodos && <option value="">Todas</option>}
            {!permitirTodos && !empresaActual && <option value="">Elegí una empresa</option>}
            {empresas.map((nombre) => (
              <option key={nombre} value={nombre}>
                {nombre}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field w-full sm:w-[210px]">
        <label className="label" htmlFor="sel-edificio">Edificio</label>
        <div className="input">
          <Icon name="building" className="input-icon" />
          <select
            id="sel-edificio"
            value={edificioId ?? ''}
            onChange={(e) => {
              const nuevo = edificios.find((x) => x.id === Number(e.target.value));
              if (!nuevo) return onTodos?.(null, null);
              if (permitirTodos) return onTodos?.(nuevo.id, null);
              onChange(nuevo.id, nuevo.pisos[0].id);
            }}
          >
            {todosLosEdificios && <option value="">Todos</option>}
            {delaEmpresa.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field w-full sm:w-[150px]">
        <label className="label" htmlFor="sel-piso">Piso</label>
        <div className="input">
          <Icon name="layers" className="input-icon" />
          <select
            id="sel-piso"
            value={pisoId ?? ''}
            disabled={!edificio}
            onChange={(e) => {
              if (!e.target.value) return onTodos?.(edificioId, null);
              if (permitirTodos) return onTodos?.(edificioId, Number(e.target.value));
              onChange(edificioId!, Number(e.target.value));
            }}
          >
            {permitirTodos && <option value="">Todos</option>}
            {edificio?.pisos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}
