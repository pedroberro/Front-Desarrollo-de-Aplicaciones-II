import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { getApiErrorMessage } from '../api/apiError';
import { AuthHeader } from '../components/auth/AuthHeader';
import { CorreoEnviado } from '../components/auth/CorreoEnviado';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Input } from '../components/ui/Input';
import { validarEmail } from '../utils/validation';

export function OlvidePasswordView() {
  const [email, setEmail] = useState('');
  const [tocado, setTocado] = useState(false);
  const [enviadoA, setEnviadoA] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const errorEmail = validarEmail(email);

  const enviar = async (destino: string) => {
    setError(null);
    setEnviando(true);
    try {
      await authApi.forgotPassword({ email: destino });
      setEnviadoA(destino);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No pudimos enviar el link. Probá de nuevo en un momento.'));
    } finally {
      setEnviando(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setTocado(true);
    if (!errorEmail) enviar(email.trim());
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-[400px] flex-col items-center gap-8">
        <AuthHeader
          title="Recuperar contraseña"
          subtitle={enviadoA ? 'Revisá tu correo' : 'Te enviamos un link para crear una contraseña nueva'}
        />

        <div className="card w-full">
          {enviadoA ? (
            <CorreoEnviado onReenviar={() => authApi.forgotPassword({ email: enviadoA })}>
              Si hay una cuenta con <span className="font-medium text-slate-900">{enviadoA}</span>, te enviamos un link
              para crear una contraseña nueva. Vence en <span className="num">30</span> minutos.
            </CorreoEnviado>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="card-bd flex flex-col gap-4 !p-6">
              {error && (
                <div className="alert alert-error" role="alert">
                  <Icon name="alert" size={14} className="mt-[3px]" />
                  <span>{error}</span>
                </div>
              )}

              <Input
                label="Email"
                type="email"
                icon="mail"
                placeholder="ana.ruiz@empresa.com"
                autoComplete="email"
                autoFocus
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTocado(true)}
                error={tocado ? errorEmail : null}
                hint="El email con el que te registraste."
              />

              <Button type="submit" size="lg" className="mt-1 w-full" isLoading={enviando}>
                Enviar link
              </Button>

              <p className="t-sm muted text-center">
                ¿Te acordaste? <Link to="/login" className="link">Ingresar</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
