import { useState, type FormEvent } from 'react';
import { getApiErrorMessage, getApiFieldErrors, getApiStatus } from '../../api/apiError';
import { usuariosApi } from '../../api/usuariosApi';
import { PasswordInput } from '../auth/PasswordInput';
import { PasswordStrength } from '../auth/PasswordStrength';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { evaluarPassword } from '../../utils/validation';

type Campo = 'actual' | 'nueva' | 'confirmacion';

interface PasswordModalProps {
  onGuardado: () => void;
  onCerrar: () => void;
}

export function PasswordModal({ onGuardado, onCerrar }: PasswordModalProps) {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [tocados, setTocados] = useState<Partial<Record<Campo, boolean>>>({});
  const [erroresServidor, setErroresServidor] = useState<Partial<Record<Campo, string>>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const evaluacion = evaluarPassword(nueva);
  const errores: Record<Campo, string | null> = {
    actual: actual ? null : 'Ingresá tu contraseña actual.',
    nueva: evaluacion.error ?? (nueva === actual ? 'La nueva contraseña tiene que ser distinta de la actual.' : null),
    confirmacion: !confirmacion ? 'Repetí la nueva contraseña.' : confirmacion !== nueva ? 'Las contraseñas no coinciden.' : null,
  };
  const mostrar = (campo: Campo) =>
    erroresServidor[campo] ?? (tocados[campo] || (campo === 'nueva' && nueva) ? errores[campo] : null);
  const tocar = (campo: Campo) => () => setTocados((t) => ({ ...t, [campo]: true }));

  const guardar = async (event: FormEvent) => {
    event.preventDefault();
    setTocados({ actual: true, nueva: true, confirmacion: true });
    if (Object.values(errores).some(Boolean)) return;
    setEnviando(true);
    setErrorGeneral(null);
    try {
      await usuariosApi.cambiarPassword({ passwordActual: actual, passwordNueva: nueva });
      onGuardado();
    } catch (err) {
      const porCampo = getApiFieldErrors(err);
      const mensaje = getApiErrorMessage(err, 'No pudimos actualizar la contraseña.');
      if (porCampo.passwordNueva) setErroresServidor({ nueva: porCampo.passwordNueva });
      // A 400 without field errors is the only business rule here: a wrong current password.
      else if (getApiStatus(err) === 400) setErroresServidor({ actual: 'La contraseña actual es incorrecta.' });
      else setErrorGeneral(mensaje);
    } finally {
      setEnviando(false);
    }
  };

  const limpiarServidor = (campo: Campo) => setErroresServidor((e) => ({ ...e, [campo]: undefined }));

  return (
    <Modal
      title="Cambiar contraseña"
      onClose={onCerrar}
      onSubmit={guardar}
      footer={
        <>
          <Button variant="secondary" onClick={onCerrar}>Cancelar</Button>
          <Button type="submit" isLoading={enviando}>Guardar</Button>
        </>
      }
    >
      {errorGeneral && (
        <div className="alert alert-error" role="alert">
          <Icon name="alert" size={14} className="mt-[3px]" />
          <span>{errorGeneral}</span>
        </div>
      )}
      <PasswordInput
        label="Contraseña actual"
        autoComplete="current-password"
        autoFocus
        value={actual}
        onChange={(e) => {
          setActual(e.target.value);
          limpiarServidor('actual');
        }}
        onBlur={tocar('actual')}
        error={mostrar('actual')}
      />
      <PasswordInput
        label="Nueva contraseña"
        autoComplete="new-password"
        maxLength={100}
        value={nueva}
        onChange={(e) => {
          setNueva(e.target.value);
          limpiarServidor('nueva');
        }}
        onBlur={tocar('nueva')}
        below={<PasswordStrength evaluacion={evaluacion} />}
        error={mostrar('nueva')}
        hint={<>Mínimo <span className="num">8</span> caracteres, con al menos una letra y un número.</>}
      />
      <PasswordInput
        label="Repetir nueva contraseña"
        autoComplete="new-password"
        maxLength={100}
        value={confirmacion}
        onChange={(e) => setConfirmacion(e.target.value)}
        onBlur={tocar('confirmacion')}
        error={mostrar('confirmacion')}
      />
    </Modal>
  );
}
