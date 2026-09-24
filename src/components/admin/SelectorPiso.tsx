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
}

/** Building and floor selectors of the admin screens. Changing the building jumps to its top floor. */
export function SelectorPiso({ edificios, edificioId, pisoId, onChange, permitirTodos, onTodos }: SelectorPisoProps) {
  const edificio = edificios.find((e) => e.id === edificioId);

  return (
    <>
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
            {permitirTodos && <option value="">Todos</option>}
            {edificios.map((e) => (
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
