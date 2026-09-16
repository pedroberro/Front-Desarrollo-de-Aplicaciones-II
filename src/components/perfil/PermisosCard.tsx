import { Badge } from '../ui/Badge';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Icon } from '../ui/Icon';
import type { Rol } from '../../types';

const ROLES: Record<Rol, string> = { CLIENTE: 'Cliente', PROVEEDOR: 'Proveedor', ADMIN: 'Administrador' };

// Labels for the permission codes the backend sends; unknown codes are shown as they come.
const PERMISOS: Record<string, string> = {
  PERFIL_EDITAR: 'Editar su perfil',
  MEDIOS_PAGO_GESTIONAR: 'Gestionar sus métodos de pago',
  ESPACIOS_VER: 'Ver espacios',
  ESPACIOS_GESTIONAR_PROPIOS: 'Gestionar sus espacios',
  ESPACIOS_GESTIONAR: 'Gestionar todos los espacios',
  RESERVAS_CREAR: 'Crear reservas',
  RESERVAS_VER_PROPIAS: 'Ver sus reservas',
  RESERVAS_VER_DE_SUS_ESPACIOS: 'Ver las reservas de sus espacios',
  RESERVAS_VER_TODAS: 'Ver todas las reservas',
  USUARIOS_VER: 'Ver usuarios',
  USUARIOS_BLOQUEAR: 'Bloquear usuarios',
};

export function PermisosCard({ rol, permisos }: { rol: Rol; permisos: string[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <h2 className="t-sm font-semibold">Permisos de la cuenta</h2>
          <Badge tone={rol === 'ADMIN' ? 'accent' : 'neutral'}>{ROLES[rol] ?? rol}</Badge>
        </div>
        <span className="t-xs muted">Dependen de tu rol</span>
      </CardHeader>
      <CardBody>
        <ul className="grid gap-2 sm:grid-cols-2">
          {permisos.map((permiso) => (
            <li key={permiso} className="t-sm flex items-center gap-2 text-slate-700">
              <Icon name="check" size={14} className="text-emerald-600" />
              {PERMISOS[permiso] ?? permiso}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
