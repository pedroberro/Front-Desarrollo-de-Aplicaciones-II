import { useEffect, useState, type FormEvent } from 'react';
import { getApiErrorMessage } from '../api/apiError';
import { usuariosApi } from '../api/usuariosApi';
import type { MedioPagoResumen, Usuario } from '../types';
import { Button } from '../components/ui/Button';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

export function PerfilView() {
  const [perfil, setPerfil] = useState<Usuario | null>(null);
  const [mediosPago, setMediosPago] = useState<MedioPagoResumen[]>([]);
  const [telefono, setTelefono] = useState('');
  const [editandoTelefono, setEditandoTelefono] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarTarjeta, setMostrarTarjeta] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [titular, setTitular] = useState('');
  const [numeroTarjeta, setNumeroTarjeta] = useState('');
  const [vencimiento, setVencimiento] = useState('');
  const [codigoSeguridad, setCodigoSeguridad] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    Promise.all([usuariosApi.obtenerPerfil(), usuariosApi.listarMediosPago()])
      .then(([usuario, tarjetas]) => {
        setPerfil(usuario);
        setTelefono(usuario.telefono);
        setMediosPago(tarjetas);
      })
      .catch((err) => setError(getApiErrorMessage(err, 'No pudimos cargar tu perfil.')))
      .finally(() => setCargando(false));
  }, []);

  const guardarTelefono = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMensaje('');
    setGuardando(true);
    try {
      const actualizado = await usuariosApi.actualizarPerfil({ telefono });
      setPerfil(actualizado);
      localStorage.setItem('usuario', JSON.stringify(actualizado));
      setEditandoTelefono(false);
      setMensaje('Teléfono actualizado correctamente.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'No pudimos actualizar el teléfono.'));
    } finally {
      setGuardando(false);
    }
  };

  const cambiarPassword = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMensaje('');
    if (passwordNueva !== confirmarPassword) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }
    setGuardando(true);
    try {
      await usuariosApi.cambiarPassword({ passwordActual, passwordNueva });
      setPasswordActual('');
      setPasswordNueva('');
      setConfirmarPassword('');
      setMostrarPassword(false);
      setMensaje('Contraseña actualizada correctamente.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'No pudimos actualizar la contraseña.'));
    } finally {
      setGuardando(false);
    }
  };

  const agregarTarjeta = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMensaje('');
    if (mediosPago.length >= 3) {
      setError('Podés guardar hasta 3 métodos de pago.');
      return;
    }
    setGuardando(true);
    try {
      const creada = await usuariosApi.agregarMedioPago({ titular, numeroTarjeta, vencimiento, codigoSeguridad });
      setMediosPago((actuales) => [...actuales, creada]);
      setTitular('');
      setNumeroTarjeta('');
      setVencimiento('');
      setCodigoSeguridad('');
      setMostrarTarjeta(false);
      setMensaje('Método de pago agregado correctamente.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'No pudimos agregar el método de pago.'));
    } finally {
      setGuardando(false);
    }
  };

  const eliminarTarjeta = async (id: number) => {
    setError('');
    setMensaje('');
    try {
      await usuariosApi.eliminarMedioPago(id);
      setMediosPago((actuales) => actuales.filter((tarjeta) => tarjeta.id !== id));
      setMensaje('Método de pago eliminado.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'No pudimos eliminar el método de pago.'));
    }
  };

  if (cargando) return <div className="py-16 text-center text-sm text-slate-500">Cargando perfil…</div>;
  if (!perfil) return <div className="py-16 text-center text-sm text-red-600">{error || 'No fue posible cargar el perfil.'}</div>;

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Mi perfil</h1>
        <p className="mt-1 text-sm text-slate-500">Tus datos de registro y tus métodos de pago.</p>
      </div>

      {(error || mensaje) && <div role="alert" className={`mb-5 rounded-lg border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{error || mensaje}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="h-fit">
          <CardHeader className="flex items-center justify-between py-3"><h2 className="font-semibold text-slate-900">Datos personales</h2><span className="text-xs text-slate-400">Nombre y email no se modifican</span></CardHeader>
          <CardBody className="space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">{perfil.fullName.slice(0, 2).toUpperCase()}</div>
              <div><p className="font-semibold text-slate-900">{perfil.fullName}</p><p className="text-xs text-slate-500">Cuenta creada el {new Date(perfil.createdAt).toLocaleDateString('es-AR')}</p></div>
            </div>
            <Dato label="Nombre completo" value={perfil.fullName} />
            <Dato label="Email" value={perfil.email} />

            {editandoTelefono ? (
              <form onSubmit={guardarTelefono} className="rounded-lg bg-slate-50 p-3">
                <Input label="Teléfono" type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} required maxLength={30} />
                <div className="mt-3 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => { setTelefono(perfil.telefono); setEditandoTelefono(false); }}>Cancelar</Button><Button type="submit" isLoading={guardando}>Guardar</Button></div>
              </form>
            ) : (
              <div className="flex items-end justify-between gap-4"><Dato label="Teléfono" value={perfil.telefono} /><button onClick={() => setEditandoTelefono(true)} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cambiar</button></div>
            )}

            <div className="flex items-end justify-between gap-4 border-t border-slate-100 pt-4"><Dato label="Contraseña" value="••••••••" /><button onClick={() => setMostrarPassword((valor) => !valor)} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cambiar contraseña</button></div>
            {mostrarPassword && (
              <form onSubmit={cambiarPassword} className="space-y-3 rounded-lg bg-slate-50 p-3">
                <Input label="Contraseña actual" type="password" value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)} required />
                <Input label="Nueva contraseña" type="password" value={passwordNueva} onChange={(e) => setPasswordNueva(e.target.value)} required minLength={6} maxLength={100} />
                <Input label="Repetir nueva contraseña" type="password" value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} required minLength={6} maxLength={100} />
                <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setMostrarPassword(false)}>Cancelar</Button><Button type="submit" isLoading={guardando}>Actualizar</Button></div>
              </form>
            )}
          </CardBody>
        </Card>

        <Card className="h-fit">
          <CardHeader className="flex items-center justify-between py-3"><h2 className="font-semibold text-slate-900">Métodos de pago</h2><span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">{mediosPago.length} de 3</span></CardHeader>
          <CardBody>
            <div className="space-y-3">
              {mediosPago.map((tarjeta) => (
                <div key={tarjeta.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                  <div><p className="font-medium text-slate-800">{tarjeta.descripcion}</p><p className="text-xs text-slate-500">{tarjeta.verificado ? 'Verificada' : 'Pendiente de verificación'}</p></div>
                  <button onClick={() => eliminarTarjeta(tarjeta.id)} className="rounded-md border border-red-200 px-2.5 py-1.5 text-sm text-red-600 hover:bg-red-50">Eliminar</button>
                </div>
              ))}
              {mediosPago.length === 0 && <p className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Todavía no agregaste ningún método de pago.</p>}
            </div>

            {!mostrarTarjeta && <Button type="button" variant="secondary" disabled={mediosPago.length >= 3} onClick={() => setMostrarTarjeta(true)} className="mt-4 w-full border border-slate-200 bg-white text-indigo-700 hover:bg-indigo-50">＋ Agregar método de pago</Button>}
            {mostrarTarjeta && (
              <form onSubmit={agregarTarjeta} className="mt-4 space-y-3 rounded-lg border border-indigo-100 bg-indigo-50/40 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Nuevo método de pago</h3>
                <Input label="Titular de la tarjeta" value={titular} onChange={(e) => setTitular(e.target.value)} required />
                <Input label="Número de tarjeta" inputMode="numeric" value={numeroTarjeta} onChange={(e) => setNumeroTarjeta(e.target.value)} required minLength={13} maxLength={19} placeholder="0000 0000 0000 0000" />
                <div className="grid grid-cols-2 gap-3"><Input label="Vencimiento" value={vencimiento} onChange={(e) => setVencimiento(e.target.value)} required maxLength={5} placeholder="MM/AA" /><Input label="Código" type="password" inputMode="numeric" value={codigoSeguridad} onChange={(e) => setCodigoSeguridad(e.target.value)} required minLength={3} maxLength={4} /></div>
                <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setMostrarTarjeta(false)}>Cancelar</Button><Button type="submit" isLoading={guardando}>Agregar</Button></div>
              </form>
            )}
          </CardBody>
        </Card>
      </div>
    </section>
  );
}

function Dato({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-medium text-slate-800">{value}</p></div>;
}
