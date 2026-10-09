import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '../../api/apiError';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface CorreoEnviadoProps {
  /** What was sent and to whom. */
  children: ReactNode;
  onReenviar: () => Promise<void>;
}

/** Card body shown after the app mails a link (password recovery, email confirmation). */
export function CorreoEnviado({ children, onReenviar }: CorreoEnviadoProps) {
  const [enviando, setEnviando] = useState(false);
  const [reenviado, setReenviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reenviar = async () => {
    setError(null);
    setReenviado(false);
    setEnviando(true);
    try {
      await onReenviar();
      setReenviado(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No pudimos reenviar el link. Probá de nuevo en un momento.'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="card-bd flex flex-col gap-4 !p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-accent-50 text-accent-700">
          <Icon name="mail" />
        </span>
        <p className="t-sm text-slate-700">{children}</p>
      </div>
      <p className="t-xs muted">¿No llegó? Revisá la carpeta de spam o pedí otro link.</p>

      {error && (
        <div className="alert alert-error" role="alert">
          <Icon name="alert" size={14} className="mt-[3px]" />
          <span>{error}</span>
        </div>
      )}
      {reenviado && (
        <div className="alert alert-ok" role="status">
          <Icon name="check" size={14} className="mt-[3px]" />
          <span>Te enviamos otro link.</span>
        </div>
      )}

      <Button variant="secondary" className="w-full" isLoading={enviando} onClick={reenviar}>
        Reenviar link
      </Button>
      <p className="t-sm muted text-center">
        <Link to="/login" className="link">Volver a ingresar</Link>
      </p>
    </div>
  );
}
