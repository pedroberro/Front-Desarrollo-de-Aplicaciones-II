import { useState, type FormEvent } from 'react';
import { getApiErrorMessage } from '../../api/apiError';
import type { DesafioSegundoFactor } from '../../types';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Input } from '../ui/Input';

interface SegundoFactorPasoProps {
  desafio: DesafioSegundoFactor;
  onConfirmar: (codigo: string) => Promise<void>;
  onVolver: () => void;
}

/** "ABCD EFGH IJKL…": easier to type into an authenticator app by hand. */
function agrupar(secreto: string): string {
  return secreto.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * Second step of an administrator sign-in (SEC-03). The first time, it shows the secret to add to
 * the authenticator app; after that, only the 6-digit code.
 */
export function SegundoFactorPaso({ desafio, onConfirmar, onVolver }: SegundoFactorPasoProps) {
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const alta = desafio.altaSegundoFactor;

  const confirmar = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(codigo)) {
      setError('El código tiene 6 dígitos.');
      return;
    }
    setEnviando(true);
    try {
      await onConfirmar(codigo);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No pudimos verificar el código. Probá de nuevo.'));
      setCodigo('');
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={confirmar} noValidate className="card w-full">
      <div className="card-bd flex flex-col gap-4 !p-6">
        <div className="flex items-start gap-2">
          <Icon name="shield" size={16} className="mt-[3px] text-accent-700" />
          <div className="flex flex-col gap-1">
            <b className="t-sm font-semibold">Verificación en dos pasos</b>
            <span className="t-sm muted">Las cuentas de administración piden un código además de la contraseña.</span>
          </div>
        </div>

        {alta && (
          <div className="alert alert-info flex-col !items-stretch gap-2">
            <span className="t-sm">
              Es tu primer ingreso: agregá Planta Libre a tu app de autenticación (Google Authenticator, Microsoft Authenticator, Authy…)
              con esta clave.
            </span>
            <code className="mono t-sm select-all rounded-md border border-slate-200 bg-white px-2.5 py-2 text-center tracking-wider">
              {agrupar(alta.secreto)}
            </code>
            <a href={alta.uri} className="link t-xs self-start">Abrir en la app del teléfono</a>
            <span className="t-xs muted">La clave se muestra una sola vez: guardala en la app antes de seguir.</span>
          </div>
        )}

        <Input
          label="Código de 6 dígitos"
          icon="lock"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
          error={error}
        />

        <Button type="submit" size="lg" className="w-full" isLoading={enviando}>
          Verificar e ingresar
        </Button>
        <button type="button" className="link t-sm self-center" onClick={onVolver} disabled={enviando}>
          Volver a ingresar la contraseña
        </button>
      </div>
    </form>
  );
}
