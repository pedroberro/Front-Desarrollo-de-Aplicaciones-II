import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../api/apiError';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardBody } from '../components/ui/Card';

export function LoginRegistroView() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname !== '/registro';
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [agregarMedioPago, setAgregarMedioPago] = useState(false);
  const [titular, setTitular] = useState('');
  const [numeroTarjeta, setNumeroTarjeta] = useState('');
  const [vencimiento, setVencimiento] = useState('');
  const [codigoSeguridad, setCodigoSeguridad] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await login({ email, password });
        navigate('/espacios');
      } else {
        await register({
          nombre,
          email,
          telefono,
          password,
          // El backend exige este campo, aunque las altas públicas siempre se crean como CLIENTE.
          rol: 'CLIENTE',
          medioPago: agregarMedioPago
            ? { titular, numeroTarjeta, vencimiento, codigoSeguridad }
            : undefined,
        });
        navigate('/login', { replace: true });
      }
    } catch (err) {
      setError(getApiErrorMessage(err, isLogin ? 'No pudimos iniciar sesión.' : 'No pudimos crear la cuenta.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardBody className="p-7 sm:p-8">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-lg font-bold text-white">◇</div>
            <h1 className="text-xl font-bold text-slate-900">{isLogin ? 'Ingresar' : 'Crear cuenta'}</h1>
            <p className="mt-1 text-xs text-slate-500">
              {isLogin ? 'Reservá tu espacio de trabajo' : 'Completá tus datos para comenzar a reservar'}
            </p>
          </div>

          {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <Input label="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} maxLength={100} placeholder="Ana Ruiz" />
                <Input label="Teléfono" type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} required maxLength={30} placeholder="11 5555 4218" />
              </>
            )}

            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="ana.ruiz@empresa.com" />
            <Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} maxLength={100} placeholder="••••••••" />

            {isLogin ? (
              <div className="-mt-2 text-right">
                <button type="button" onClick={() => navigate('/olvide-password')} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">¿Olvidaste tu contraseña?</button>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" checked={agregarMedioPago} onChange={(e) => setAgregarMedioPago(e.target.checked)} className="mt-1 accent-indigo-600" />
                  <span><span className="block text-sm font-medium text-slate-800">Agregar método de pago</span><span className="block text-xs text-slate-500">Es opcional; podés hacerlo también desde tu perfil.</span></span>
                </label>
                {agregarMedioPago && (
                  <div className="mt-4 space-y-3 border-t border-slate-200 pt-3">
                    <Input label="Titular de la tarjeta" value={titular} onChange={(e) => setTitular(e.target.value)} required placeholder="Como figura en la tarjeta" />
                    <Input label="Número de tarjeta" inputMode="numeric" value={numeroTarjeta} onChange={(e) => setNumeroTarjeta(e.target.value)} required minLength={13} maxLength={19} placeholder="0000 0000 0000 0000" />
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Vencimiento" value={vencimiento} onChange={(e) => setVencimiento(e.target.value)} required maxLength={5} placeholder="MM/AA" />
                      <Input label="Código" type="password" inputMode="numeric" value={codigoSeguridad} onChange={(e) => setCodigoSeguridad(e.target.value)} required minLength={3} maxLength={4} placeholder="•••" />
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button type="submit" isLoading={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {isLogin ? 'Ingresar' : 'Crear cuenta'}
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-600">
            {isLogin ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
            <button type="button" onClick={() => navigate(isLogin ? '/registro' : '/login')} className="font-semibold text-indigo-600 hover:text-indigo-700">
              {isLogin ? 'Crear cuenta' : 'Ingresar'}
            </button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
