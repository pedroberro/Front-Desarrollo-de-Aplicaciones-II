import type { ReactNode } from 'react';
import { Button } from '../ui/Button';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Icon } from '../ui/Icon';
import type { Rol, Usuario } from '../../types';

const ROLES: Record<Rol, string> = { CLIENTE: 'Cliente', PROVEEDOR: 'Proveedor', ADMIN: 'Administrador' };

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
}

function mesYAnio(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
}

interface DatosPersonalesCardProps {
  usuario: Usuario;
  onCambiarTelefono: () => void;
  onCambiarPassword: () => void;
}

export function DatosPersonalesCard({ usuario, onCambiarTelefono, onCambiarPassword }: DatosPersonalesCardProps) {
  return (
    <Card className="w-full flex-none xl:w-[600px]">
      <CardHeader>
        <h2 className="t-sm font-semibold">Datos personales</h2>
        <span className="t-xs muted text-right">Solo se pueden modificar el teléfono y la contraseña</span>
      </CardHeader>
      <CardBody className="!px-4 !pt-2 !pb-4">
        <div className="flex items-center gap-3.5 pt-3 pb-4">
          <span className="grid h-14 w-14 flex-none place-items-center rounded-full bg-indigo-50 text-lg font-semibold text-indigo-700">
            {iniciales(usuario.nombre)}
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="t-xl font-semibold">{usuario.nombre}</span>
            {usuario.createdAt && (
              <span className="t-sm muted">
                {ROLES[usuario.rol] ?? 'Usuario'} desde <span className="num">{mesYAnio(usuario.createdAt)}</span>
              </span>
            )}
          </div>
        </div>

        <Dato label="Nombre completo" valor={usuario.nombre} accion={<NoSeModifica />} />
        <Dato label="Email" valor={usuario.email} accion={<NoSeModifica />} />
        <Dato
          label="Teléfono"
          valor={<span className="mono">{usuario.telefono || '—'}</span>}
          accion={
            <Button variant="secondary" size="sm" onClick={onCambiarTelefono}>
              <Icon name="pencil" size={14} />
              Cambiar
            </Button>
          }
        />
        <Dato
          label="Contraseña"
          valor={<span className="mono tracking-[2px]">••••••••••</span>}
          accion={
            <Button variant="secondary" size="sm" onClick={onCambiarPassword}>
              Cambiar contraseña
            </Button>
          }
          ultimo
        />
      </CardBody>
    </Card>
  );
}

function Dato({ label, valor, accion, ultimo }: { label: string; valor: ReactNode; accion: ReactNode; ultimo?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 py-3 ${ultimo ? '' : 'border-b border-slate-100'}`}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="t-xs muted">{label}</span>
        <span className="t-base truncate font-medium">{valor}</span>
      </div>
      {accion}
    </div>
  );
}

function NoSeModifica() {
  return (
    <span className="t-xs muted2 inline-flex flex-none items-center gap-[5px]">
      <Icon name="lock" size={14} />
      No se modifica
    </span>
  );
}
