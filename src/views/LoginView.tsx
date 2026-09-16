import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiErrorMessage, getApiStatus } from '../api/apiError';
import { useAuth } from '../hooks/useAuth';
import { AuthHeader } from '../components/auth/AuthHeader';
import { PasswordInput } from '../components/auth/PasswordInput';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { HOME_PATH } from '../routes';

export function LoginView() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Ingresá tu email y tu contraseña.');
      return;
    }
    setEnviando(true);
    try {
      await login({ email: email.trim(), password });
      navigate(HOME_PATH, { replace: true });
    } catch (err) {
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

        <form onSubmit={handleSubmit} noValidate className="card w-full">
          <div className="card-bd flex flex-col gap-4 !p-6">
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
      </div>
    </div>
  );
}
