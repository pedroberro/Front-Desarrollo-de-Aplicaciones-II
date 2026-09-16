import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { getApiErrorMessage, getApiFieldErrors, getApiStatus } from '../api/apiError';
import { AuthHeader } from '../components/auth/AuthHeader';
import { PasswordInput } from '../components/auth/PasswordInput';
import { PasswordStrength } from '../components/auth/PasswordStrength';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { evaluarPassword } from '../utils/validation';
import type { LoginAviso } from '../routes';

type Campo = 'nueva' | 'confirmacion';

export function ResetPasswordView() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');

  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [tocados, setTocados] = useState<Partial<Record<Campo, boolean>>>({});
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [linkInvalido, setLinkInvalido] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (!token) return <Navigate to="/olvide-password" replace />;

  const evaluacion = evaluarPassword(nueva);
  const errores: Record<Campo, string | null> = {
    nueva: evaluacion.error,
    confirmacion: !confirmacion ? 'Repetí la nueva contraseña.' : confirmacion !== nueva ? 'Las contraseñas no coinciden.' : null,
  };
  const mostrar = (campo: Campo) =>
    (campo === 'nueva' ? errorServidor : null) ?? (tocados[campo] || (campo === 'nueva' && nueva) ? errores[campo] : null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setTocados({ nueva: true, confirmacion: true });
    if (errores.nueva || errores.confirmacion) return;
    setErrorGeneral(null);
    setEnviando(true);
    try {
      await authApi.resetPassword({ token, nuevaPassword: nueva });
      const state: LoginAviso = { aviso: 'Contraseña actualizada. Ya podés ingresar con la nueva.' };
      navigate('/login', { replace: true, state });
    } catch (err) {
      const porCampo = getApiFieldErrors(err).nuevaPassword;
      if (porCampo) setErrorServidor(porCampo);
      // The only 400 without field errors is an expired, used or unknown token.
      else if (getApiStatus(err) === 400) setLinkInvalido(true);
      else setErrorGeneral(getApiErrorMessage(err, 'No pudimos actualizar la contraseña.'));
      setEnviando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-[400px] flex-col items-center gap-8">
        <AuthHeader
          title={linkInvalido ? 'El link ya no sirve' : 'Nueva contraseña'}
          subtitle={linkInvalido ? 'Venció o ya se usó' : 'Elegí la contraseña con la que vas a ingresar'}
        />

        <div className="card w-full">
          {linkInvalido ? (
            <div className="card-bd flex flex-col gap-4 !p-6">
              <div className="alert alert-error" role="alert">
                <Icon name="alert" size={14} className="mt-[3px]" />
                <span>
                  Los links de recuperación duran <span className="num">30</span> minutos y se pueden usar una sola vez.
                  Pedí uno nuevo para continuar.
                </span>
              </div>
              <Link to="/olvide-password" className="btn btn-primary btn-lg w-full">
                Pedir un link nuevo
              </Link>
              <p className="t-sm muted text-center">
                <Link to="/login" className="link">Volver a ingresar</Link>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="card-bd flex flex-col gap-4 !p-6">
              {errorGeneral && (
                <div className="alert alert-error" role="alert">
                  <Icon name="alert" size={14} className="mt-[3px]" />
                  <span>{errorGeneral}</span>
                </div>
              )}

              <PasswordInput
                label="Nueva contraseña"
                placeholder="••••••••"
                autoComplete="new-password"
                autoFocus
                maxLength={100}
                value={nueva}
                onChange={(e) => {
                  setNueva(e.target.value);
                  setErrorServidor(null);
                }}
                onBlur={() => setTocados((t) => ({ ...t, nueva: true }))}
                below={<PasswordStrength evaluacion={evaluacion} />}
                error={mostrar('nueva')}
                hint={<>Mínimo <span className="num">8</span> caracteres, con al menos una letra y un número.</>}
              />

              <PasswordInput
                label="Repetir nueva contraseña"
                placeholder="••••••••"
                autoComplete="new-password"
                maxLength={100}
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                onBlur={() => setTocados((t) => ({ ...t, confirmacion: true }))}
                error={mostrar('confirmacion')}
              />

              <Button type="submit" size="lg" className="mt-1 w-full" isLoading={enviando}>
                Guardar contraseña
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
