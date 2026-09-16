import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '../api/apiError';
import { usuariosApi } from '../api/usuariosApi';
import { useAuth } from '../hooks/useAuth';
import { DatosPersonalesCard } from '../components/perfil/DatosPersonalesCard';
import { MediosPagoCard } from '../components/perfil/MediosPagoCard';
import { PasswordModal } from '../components/perfil/PasswordModal';
import { TelefonoModal } from '../components/perfil/TelefonoModal';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import type { MedioPagoResumen, Usuario } from '../types';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'listo'; usuario: Usuario; mediosPago: MedioPagoResumen[] };

export function PerfilView() {
  const { setUsuario } = useAuth();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [intento, setIntento] = useState(0);
  const [modal, setModal] = useState<'telefono' | 'password' | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    Promise.all([usuariosApi.obtenerPerfil(), usuariosApi.listarMediosPago()])
      .then(([usuario, mediosPago]) => {
        if (!vigente) return;
        setUsuario(usuario);
        setEstado({ tipo: 'listo', usuario, mediosPago });
      })
      .catch((err) => vigente && setEstado({ tipo: 'error', mensaje: getApiErrorMessage(err, 'No pudimos cargar tu perfil.') }));
    return () => {
      vigente = false;
    };
  }, [intento, setUsuario]);

  useEffect(() => {
    if (!mensaje) return;
    const timer = setTimeout(() => setMensaje(null), 4000);
    return () => clearTimeout(timer);
  }, [mensaje]);

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="t-3xl font-semibold">Mi perfil</h1>
        <p className="t-sm muted">Los datos que cargaste al registrarte y tus métodos de pago</p>
      </div>

      {mensaje && (
        <div className="alert alert-ok" role="status">
          <Icon name="check" size={14} className="mt-[3px]" />
          <span>{mensaje}</span>
        </div>
      )}

      {estado.tipo === 'cargando' && <PerfilCargando />}

      {estado.tipo === 'error' && (
        <div className="card empty">
          <div className="empty-ic">
            <Icon name="alert" />
          </div>
          <span className="t-sm font-semibold">{estado.mensaje}</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setEstado({ tipo: 'cargando' });
              setIntento((n) => n + 1);
            }}
          >
            Reintentar
          </Button>
        </div>
      )}

      {estado.tipo === 'listo' && (
        <div className="flex flex-col items-start gap-5 xl:flex-row">
          <DatosPersonalesCard
            usuario={estado.usuario}
            onCambiarTelefono={() => setModal('telefono')}
            onCambiarPassword={() => setModal('password')}
          />
          <div className="flex w-full grow flex-col gap-4">
            <MediosPagoCard
              mediosPago={estado.mediosPago}
              onCambio={(mediosPago) => setEstado((actual) => (actual.tipo === 'listo' ? { ...actual, mediosPago } : actual))}
              onMensaje={setMensaje}
            />
          </div>

          {modal === 'telefono' && (
            <TelefonoModal
              telefonoActual={estado.usuario.telefono}
              onCerrar={() => setModal(null)}
              onGuardado={(usuario) => {
                setUsuario(usuario);
                setEstado((actual) => (actual.tipo === 'listo' ? { ...actual, usuario } : actual));
                setModal(null);
                setMensaje('Teléfono actualizado.');
              }}
            />
          )}
          {modal === 'password' && (
            <PasswordModal
              onCerrar={() => setModal(null)}
              onGuardado={() => {
                setModal(null);
                setMensaje('Contraseña actualizada.');
              }}
            />
          )}
        </div>
      )}
    </>
  );
}

function PerfilCargando() {
  return (
    <div className="flex flex-col items-start gap-5 xl:flex-row" aria-busy="true" aria-label="Cargando perfil">
      <div className="card h-[380px] w-full animate-pulse bg-white xl:w-[600px]" />
      <div className="card h-[240px] w-full grow animate-pulse bg-white" />
    </div>
  );
}
