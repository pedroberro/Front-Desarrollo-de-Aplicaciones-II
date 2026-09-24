import { useEffect, useId, type FormEvent, type ReactNode } from 'react';
import { Icon } from './Icon';

interface ModalProps {
  title: string;
  subtitulo?: string;
  badge?: ReactNode;
  /** Wider dialogs, e.g. the booking summary. */
  ancho?: number;
  children: ReactNode;
  footer: ReactNode;
  onClose: () => void;
  /** When set, the body and footer form a single <form>, so Enter submits. */
  onSubmit?: (event: FormEvent) => void;
}

export function Modal({ title, subtitulo, badge, ancho, children, footer, onClose, onSubmit }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const content = (
    <>
      <div className="modal-bd">{children}</div>
      <div className="modal-ft">{footer}</div>
    </>
  );

  return (
    <div className="scrim" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} style={ancho ? { width: ancho } : undefined}>
        <div className="modal-hd">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2.5">
              <h2 id={titleId} className="t-lg font-semibold">{title}</h2>
              {badge}
            </div>
            {subtitulo && <p className="t-sm muted">{subtitulo}</p>}
          </div>
          <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" />
          </button>
        </div>
        {onSubmit ? <form onSubmit={onSubmit} noValidate>{content}</form> : content}
      </div>
    </div>
  );
}
