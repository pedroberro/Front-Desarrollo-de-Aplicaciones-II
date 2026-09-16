import type { ReactNode } from 'react';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';

interface MedioPagoRowProps {
  ultimos4: string;
  vencimiento: string;
  titular: string;
  principal?: boolean;
  acciones: ReactNode;
}

export function MedioPagoRow({ ultimos4, vencimiento, titular, principal, acciones }: MedioPagoRowProps) {
  return (
    <div className="row-item">
      <span className="card-chip">
        <Icon name="card" size={14} />
      </span>
      <div className="flex min-w-0 grow flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="t-sm mono font-medium whitespace-nowrap">•••• •••• •••• {ultimos4}</span>
          {principal && <Badge tone="accent">Principal</Badge>}
        </div>
        <span className="t-xs muted truncate">
          Vence <span className="num">{vencimiento}</span> · {titular}
        </span>
      </div>
      {acciones}
    </div>
  );
}

interface AgregarMedioPagoRowProps {
  descripcion: string;
  icono?: 'plus' | 'card';
  trailing?: 'plus' | 'chevRight';
  disabled?: boolean;
  onClick: () => void;
}

export function AgregarMedioPagoRow({ descripcion, icono = 'plus', trailing = 'chevRight', disabled, onClick }: AgregarMedioPagoRowProps) {
  return (
    <button type="button" className="row-item row-add" onClick={onClick} disabled={disabled}>
      <span className={`card-chip ${disabled ? '!border-transparent !bg-slate-100 !text-slate-400' : '!border-transparent'}`}>
        <Icon name={icono} size={14} />
      </span>
      <span className="flex grow flex-col gap-px">
        <span className={`t-sm font-medium ${disabled ? 'muted' : ''}`}>Agregar método de pago</span>
        {!disabled && <span className="t-xs muted">{descripcion}</span>}
      </span>
      {!disabled && <Icon name={trailing} className="text-slate-400" />}
    </button>
  );
}
