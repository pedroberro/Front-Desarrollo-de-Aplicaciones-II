import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface EmptyStateProps {
  icon: IconName;
  titulo: string;
  children?: ReactNode;
  acciones?: ReactNode;
}

/** One icon, one sentence that explains why it is empty, and the action that gets the user unstuck. */
export function EmptyState({ icon, titulo, children, acciones }: EmptyStateProps) {
  return (
    <div className="empty py-12">
      <div className="empty-ic h-12 w-12">
        <Icon name={icon} size={20} />
      </div>
      <h3 className="t-lg font-semibold">{titulo}</h3>
      {children && <p className="t-sm muted max-w-[380px]">{children}</p>}
      {acciones && <div className="mt-1 flex flex-wrap justify-center gap-2">{acciones}</div>}
    </div>
  );
}

export function ErrorCarga({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  return (
    <div className="card">
      <EmptyState
        icon="alert"
        titulo={mensaje}
        acciones={
          <button type="button" className="btn btn-secondary btn-sm" onClick={onReintentar}>
            <Icon name="refresh" size={14} />
            Reintentar
          </button>
        }
      />
    </div>
  );
}
