import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { getApiCode, getApiErrorMessage, getApiStatus } from '../api/apiError';
import { useAuth } from '../hooks/useAuth';
import { AuthHeader } from '../components/auth/AuthHeader';
import { PasswordInput } from '../components/auth/PasswordInput';
import { SegundoFactorPaso } from '../components/auth/SegundoFactorPaso';
import type { DesafioSegundoFactor } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Icon } from '../components/ui/Icon';
import { HOME_PATH, type LoginAviso } from '../routes';

export function LoginView() {
  const navigate = useNavigate();
  const aviso = (useLocation().state as LoginAviso | null)?.aviso;
  const { login, completarSegundoFactor } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  // Email of an account that exists but is not confirmed yet, to offer a new link.
  const [pendiente, setPendiente] = useState<string | null>(null);
  const [reenvio, setReenvio] = useState<'idle' | 'enviando' | 'enviado' | 'error'>('idle');
  // Administrators: the password was right and the authenticator code is still missing.
  const [desafio, setDesafio] = useState<DesafioSegundoFactor | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setPendiente(null);
    setReenvio('idle');
    if (!email.trim() || !password) {
      setError('Ingresá tu email y tu contraseña.');
      return;
    }
    setEnviando(true);
    try {
      const pendienteSegundoFactor = await login({ email: email.trim(), password });
      if (pendienteSegundoFactor) {
        setDesafio(pendienteSegundoFactor);
        setPassword('');
        return;
      }
      navigate(HOME_PATH, { replace: true });
    } catch (err) {
      if (getApiCode(err) === 'EMAIL_NO_CONFIRMADO') {
        setPendiente(email.trim());
        return;
      }
      setError(
        getApiStatus(err) === 401
          ? 'Email o contraseña incorrectos.'
          : getApiErrorMessage(err, 'No pudimos iniciar sesión. Probá de nuevo en un momento.')
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-[400px] flex-col items-center gap-8">
        <AuthHeader title="Planta Libre" subtitle="Reservá tu espacio de trabajo" />

        {desafio ? (
          <SegundoFactorPaso
            desafio={desafio}
            onConfirmar={async (codigo) => {
              await completarSegundoFactor(desafio.desafio, codigo);
              navigate(HOME_PATH, { replace: true });
            }}
            onVolver={() => setDesafio(null)}
          />
        ) : (
        <form onSubmit={handleSubmit} noValidate className="card w-full">
          <div className="card-bd flex flex-col gap-4 !p-6">
            {pendiente && (
              <div className="alert alert-info flex-col !items-stretch" role="alert">
                <div className="flex items-start gap-2">
                  <Icon name="mail" size={14} className="mt-[3px] text-accent-700" />
                  <span className="text-slate-700">
                    Confirmá tu email para ingresar. Te enviamos un link a{' '}
                    <span className="font-medium text-slate-900">{pendiente}</span> cuando te registraste.
                  </span>
                </div>
                {reenvio === 'enviado' ? (
                  <span className="t-xs text-emerald-700">Te enviamos otro link. Revisá también la carpeta de spam.</span>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="self-start"
                    isLoading={reenvio === 'enviando'}
                    onClick={async () => {
                      setReenvio('enviando');
                      try {
                        await authApi.reenviarConfirmacion(pendiente);
                        setReenvio('enviado');
                      } catch {
                        setReenvio('error');
                      }
                    }}
                  >
                    Reenviar link
                  </Button>
                )}
                {reenvio === 'error' && <span className="t-xs text-rose-700">No pudimos reenviarlo. Probá de nuevo en unos minutos.</span>}
              </div>
            )}

            {aviso && !error && !pendiente && (
              <div className="alert alert-ok" role="status">
                <Icon name="check" size={14} className="mt-[3px]" />
                <span>{aviso}</span>
              </div>
            )}

            <Input
              label="Email"
              type="email"
              icon="mail"
              placeholder="ana.ruiz@empresa.com"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="field">
              <PasswordInput
                label="Contraseña"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={error}
              />
              <Link to="/olvide-password" className="link t-sm self-end">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button type="submit" size="lg" className="mt-1 w-full" isLoading={enviando}>
              Ingresar
            </Button>

            <div className="my-1 flex items-center gap-3">
              <div className="h-px grow bg-slate-200" />
              <span className="t-xs muted2">o</span>
              <div className="h-px grow bg-slate-200" />
            </div>

            <p className="t-sm muted text-center">
              ¿No tenés cuenta?{' '}
              <Link to="/registro" className="link">
                Crear cuenta
              </Link>
            </p>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
