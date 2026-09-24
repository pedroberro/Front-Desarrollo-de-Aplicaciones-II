import { useRef } from 'react';
import { esFinDeSemana, fechaCorta, proximoHabil } from '../../utils/fechas';
import { Icon } from './Icon';

interface FechaInputProps {
  valor: string;
  onChange: (fecha: string) => void;
  label?: string;
  /** Weekends snap to the next Monday: the buildings are closed. */
  soloHabiles?: boolean;
  className?: string;
  id?: string;
}

/**
 * Shows the date as the design reads ("mié 26 ago 2026") while the native picker does the work:
 * the real input sits invisible on top, so keyboard and screen readers still get a date field.
 */
export function FechaInput({ valor, onChange, label, soloHabiles = true, className = '', id }: FechaInputProps) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div className={`field ${className}`}>
      {label && <label className="label" htmlFor={id}>{label}</label>}
      <div className="input relative cursor-pointer" onClick={() => ref.current?.showPicker?.()}>
        <Icon name="calendar" className="input-icon" />
        <span className="num grow truncate" aria-hidden="true">
          {valor ? fechaCorta(valor) : 'Elegí una fecha'}
        </span>
        <input
          ref={ref}
          id={id}
          type="date"
          value={valor}
          aria-label={label ?? 'Fecha'}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => {
            const fecha = e.target.value;
            if (!fecha) return;
            onChange(soloHabiles && esFinDeSemana(fecha) ? proximoHabil(fecha) : fecha);
          }}
        />
      </div>
    </div>
  );
}
