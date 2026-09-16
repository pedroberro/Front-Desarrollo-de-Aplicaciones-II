import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { getApiErrorMessage } from '../api/apiError';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardBody } from '../components/ui/Card';
import { emailRules, passwordRules } from '../utils/validation';

type Paso = 'solicitar' | 'restablecer';

export function OlvidePasswordView() {
  const [paso, setPaso] = useState<Paso>('solicitar');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSolicitar = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    setIsLoading(true);

    try {
      await authApi.forgotPassword({ email });
      setMensaje('Si el email está registrado, vas a recibir un código para restablecer tu contraseña.');
      setPaso('restablecer');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error al enviar el código'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestablecer = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMensaje('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword({ token, nuevaPassword: newPassword });
      setMensaje('Contraseña restablecida correctamente. Ya podés iniciar sesión.');
      setNewPassword('');
      setConfirmPassword('');
      setToken('');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error al restablecer la contraseña'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardBody className="p-8">
          <h1 className="text-2xl font-bold text-center mb-2">Recuperar Contraseña</h1>

          {paso === 'solicitar' ? (
            <p className="text-center text-sm text-gray-600 mb-6">
              Ingresá el email de tu cuenta y te enviaremos un código para restablecer tu contraseña.
            </p>
          ) : (
            <p className="text-center text-sm text-gray-600 mb-6">
              Ingresá el código que recibiste por email y tu nueva contraseña.
            </p>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {mensaje && (
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {mensaje}
            </div>
          )}

          {paso === 'solicitar' ? (
            <form onSubmit={handleSolicitar} className="flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                {...emailRules}
                placeholder="tu@email.com"
              />

              <Button type="submit" isLoading={isLoading} className="w-full mt-2">
                Enviar código
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRestablecer} className="flex flex-col gap-4">
              <Input
                label="Código de verificación"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                placeholder="123456"
              />

              <Input
                label="Nueva contraseña"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="••••••"
                {...passwordRules}
              />

              <Input
                label="Confirmar contraseña"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••"
                {...passwordRules}
              />

              <Button type="submit" isLoading={isLoading} className="w-full mt-2">
                Restablecer contraseña
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-gray-600">
            <button
              type="button"
              onClick={() => {
                setError('');
                setMensaje('');
                if (paso === 'restablecer' && !mensaje.includes('restablecida')) {
                  setPaso('solicitar');
                } else {
                  navigate('/login');
                }
              }}
              className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              Volver al inicio de sesión
            </button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
