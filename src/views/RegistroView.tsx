import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiErrorMessage, getApiFieldErrors, getApiStatus } from '../api/apiError';
import { useAuth } from '../hooks/useAuth';
import { useEmailDisponible } from '../hooks/useEmailDisponible';
import { AuthHeader } from '../components/auth/AuthHeader';
import { PasswordInput } from '../components/auth/PasswordInput';
import { PasswordStrength } from '../components/auth/PasswordStrength';
import { PhoneField } from '../components/auth/PhoneField';
import { MedioPagoModal } from '../components/medioPago/MedioPagoModal';
import { AgregarMedioPagoRow, MedioPagoRow } from '../components/medioPago/MedioPagoRow';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Input } from '../components/ui/Input';
import type { MedioPagoRequest } from '../types';
import { HOME_PATH } from '../routes';
import { PREFIJO_DEFAULT, unirTelefono } from '../utils/telefono';
import { evaluarPassword, validarEmail, validarNombre, validarTelefono } from '../utils/validation';

type Campo = 'nombre' | 'email' | 'telefono' | 'password';

export function RegistroView() {
  const navigate = useNavigate();
  const { register, login } = useAuth();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [prefijo, setPrefijo] = useState(PREFIJO_DEFAULT);
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [medioPago, setMedioPago] = useState<MedioPagoRequest | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  const [tocados, setTocados] = useState<Partial<Record<Campo, boolean>>>({});
  const [erroresServidor, setErroresServidor] = useState<Partial<Record<Campo, ReactNode>>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const { estado: estadoEmail, verificar: verificarEmail } = useEmailDisponible(email);

  const evaluacion = evaluarPassword(password);
  const errores: Record<Campo, string | null> = {
    nombre: validarNombre(nombre),
    email: validarEmail(email),
    telefono: validarTelefono(telefono),
    password: evaluacion.error,
  };
  const valido = Object.values(errores).every((e) => e === null) && estadoEmail !== 'ocupado';

  const tocar = (campo: Campo) => () => setTocados((t) => ({ ...t, [campo]: true }));
  const cambiar = (campo: Campo, setter: (v: string) => void) => (valor: string) => {
    setter(valor);
    setErroresServidor((e) => ({ ...e, [campo]: undefined }));
  };
  // The password reports as you type once there is something to judge; the rest wait for blur.
  const mostrar = (campo: Campo): ReactNode =>
    erroresServidor[campo] ?? ((tocados[campo] || (campo === 'password' && password)) ? errores[campo] : null);

  const emailOcupado = (
    <>
      Ya existe una cuenta con este email.{' '}
      <Link to="/login" className="text-rose-600 underline">Ingresar</Link>
    </>
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!valido) {
      setTocados({ nombre: true, email: true, telefono: true, password: true });
      return;
    }
    setErrorGeneral(null);
    setEnviando(true);
    const credenciales = { email: email.trim(), password };
    try {
      await register({
        nombre: nombre.trim(),
        ...credenciales,
        telefono: unirTelefono(prefijo, telefono),
        rol: 'CLIENTE',
        medioPago: medioPago ?? undefined,
      });
    } catch (err) {
      manejarErrorRegistro(err);
      setEnviando(false);
      return;
    }
    try {
      await login(credenciales);
      navigate(HOME_PATH, { replace: true });
    } catch {
      navigate('/login', { replace: true });
    }
  };

  const manejarErrorRegistro = (err: unknown) => {
    if (getApiStatus(err) === 409) {
      setErroresServidor({ email: emailOcupado });
      return;
    }
    const porCampo = getApiFieldErrors(err);
    const deCampos: Partial<Record<Campo, string>> = {};
    for (const campo of ['nombre', 'email', 'telefono', 'password'] as Campo[]) {
      if (porCampo[campo]) deCampos[campo] = porCampo[campo];
    }
    setErroresServidor(deCampos);
    if (Object.keys(deCampos).length === 0) {
      setErrorGeneral(getApiErrorMessage(err, 'No pudimos crear la cuenta. Probá de nuevo en un momento.'));
    }
  };

  const completarMedioPago = (datos: MedioPagoRequest) => {
    setMedioPago(datos);
    setModalAbierto(false);
  };

  return (
    <div className="flex min-h-screen justify-center px-4 py-12">
      <div className="flex w-full max-w-[440px] flex-col items-center gap-6">
        <AuthHeader title="Crear cuenta" subtitle="Con una cuenta reservás en cualquiera de las empresas" />

        <form onSubmit={handleSubmit} noValidate className="card w-full">
          <div className="card-bd flex flex-col gap-4 !p-6">
            {errorGeneral && (
              <div className="alert alert-error" role="alert">
                <Icon name="alert" size={14} className="mt-[3px]" />
                <span>{errorGeneral}</span>
              </div>
            )}

            <Input
              label="Nombre completo"
              showRequired
              icon="user"
              placeholder="Ana Ruiz"
              autoComplete="name"
              autoFocus
              maxLength={100}
              value={nombre}
              onChange={(e) => cambiar('nombre', setNombre)(e.target.value)}
              onBlur={tocar('nombre')}
              error={mostrar('nombre')}
            />

            <Input
              label="Email"
              showRequired
              type="email"
              icon="mail"
              placeholder="ana.ruiz@empresa.com"
              autoComplete="email"
              maxLength={255}
              value={email}
              onChange={(e) => cambiar('email', setEmail)(e.target.value)}
              onBlur={() => {
                tocar('email')();
                // Only a well-formed email without a known answer is worth a request.
                if (!errores.email && (estadoEmail === 'sin-verificar' || estadoEmail === 'error')) verificarEmail(email);
              }}
              error={mostrar('email') ?? (estadoEmail === 'ocupado' ? emailOcupado : null)}
              hint={estadoEmail === 'verificando' ? 'Verificando…' : 'Con este email vas a iniciar sesión.'}
            />

            <PhoneField
              showRequired
              prefijo={prefijo}
              numero={telefono}
              onPrefijoChange={setPrefijo}
              onNumeroChange={cambiar('telefono', setTelefono)}
              onBlur={tocar('telefono')}
              error={mostrar('telefono') as string | null}
              hint="Lo usamos si hay que avisarte de un bloqueo sobre tu reserva."
            />

            <PasswordInput
              label="Contraseña"
              showRequired
              toggle
              placeholder="••••••••"
              autoComplete="new-password"
              maxLength={100}
              value={password}
              onChange={(e) => cambiar('password', setPassword)(e.target.value)}
              onBlur={tocar('password')}
              below={<PasswordStrength evaluacion={evaluacion} />}
              error={mostrar('password')}
              hint={<>Mínimo <span className="num">8</span> caracteres, con al menos una letra y un número.</>}
            />

            <div className="mt-1 h-px bg-slate-200" />

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="t-sm font-semibold">Método de pago</span>
                <Badge>opcional</Badge>
              </div>
              {medioPago ? (
                <MedioPagoRow
                  ultimos4={medioPago.numeroTarjeta.replace(/\s/g, '').slice(-4)}
                  vencimiento={medioPago.vencimiento}
                  titular={medioPago.titular}
                  acciones={
                    <>
                      <Button variant="secondary" size="sm" onClick={() => setModalAbierto(true)}>
                        <Icon name="pencil" size={14} />
                        Editar
                      </Button>
                      <Button variant="danger" size="sm" className="btn-icon" onClick={() => setMedioPago(null)} aria-label="Quitar método de pago">
                        <Icon name="trash" size={14} />
                      </Button>
                    </>
                  }
                />
              ) : (
                <AgregarMedioPagoRow
                  icono="card"
                  trailing="plus"
                  descripcion="Podés dejarlo para después: se pide recién al confirmar una reserva paga."
                  onClick={() => setModalAbierto(true)}
                />
              )}
            </div>

            <Button type="submit" size="lg" className="mt-1 w-full" disabled={!valido} isLoading={enviando}>
              Crear cuenta
            </Button>

            <p className="t-sm muted text-center">
              ¿Ya tenés cuenta?{' '}
              <Link to="/login" className="link">
                Ingresar
              </Link>
            </p>
          </div>
        </form>
      </div>

      {modalAbierto && (
        <MedioPagoModal
          modo="crear"
          inicial={medioPago ?? undefined}
          onCompletar={completarMedioPago}
          onCerrar={() => setModalAbierto(false)}
        />
      )}
    </div>
  );
}
