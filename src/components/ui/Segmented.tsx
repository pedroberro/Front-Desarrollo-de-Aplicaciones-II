import type { ReactNode } from 'react';

interface Opcion<T extends string> {
  valor: T;
  label: ReactNode;
  disabled?: boolean;
}

interface SegmentedProps<T extends string> {
  opciones: Opcion<T>[];
  valor: T;
  onChange: (valor: T) => void;
  label: string;
}

export function Segmented<T extends string>({ opciones, valor, onChange, label }: SegmentedProps<T>) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="radio"
          aria-checked={o.valor === valor}
          disabled={o.disabled}
          className={`seg-i ${o.valor === valor ? 'seg-on' : ''}`}
          onClick={() => onChange(o.valor)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
