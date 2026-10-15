import type { EspacioDetalle, EstadoEspacio } from '../../types/reservas';
import { ICONO_SERVICIO, iconoEquipamiento } from '../../utils/catalogo';
import { EstadoEspacioBadge } from '../ui/EstadoBadge';
import { Icon } from '../ui/Icon';

/** Screen 7, under the plan: everything about the space the customer is about to book. */
export function DetalleEspacio({ espacio, estado }: { espacio: EspacioDetalle; estado: EstadoEspacio }) {
  const sala = espacio.tipo !== 'CUBICULO';
  const c = espacio.condiciones;
  const atributos = [
    ['Código', espacio.codigo],
    ['Tipo', espacio.tipoEtiqueta],
    ['Capacidad', `${espacio.capacidad} ${espacio.capacidad === 1 ? 'persona' : 'personas'}`],
    ['Superficie', `${String(espacio.superficie).replace('.', ',')} m²`],
    ['Orientación', espacio.orientacion],
    ['Ventana', espacio.ventana ? 'Sí, con cortina' : 'No'],
    ['Ubicación', espacio.ubicacion],
    ['Nivel de ruido', espacio.ruido],
    ['Climatización', espacio.climatizacion],
  ];

  return (
    <section className="card" aria-label={`Detalle de ${espacio.codigo}`}>
      <div className="card-hd flex-wrap">
        <div className="flex flex-wrap items-center gap-2.5">
          <b className="mono t-lg">{espacio.codigo}</b>
          <span className="t-sm muted">
            {espacio.tipoEtiqueta} · {espacio.piso.nombre} · {espacio.edificio.nombre}
          </span>
          <EstadoEspacioBadge estado={estado} />
        </div>
        <span className="t-xs muted">Detalle del espacio seleccionado</span>
      </div>

      <div className="grid gap-6 p-4 lg:grid-cols-[minmax(0,420px)_1fr]">
        <div className="flex flex-col gap-2">
          <Foto sala={sala} ventana={espacio.ventana} etiqueta="foto 1 de 4 del espacio" grande />
          <div className="grid grid-cols-3 gap-2">
            <Foto sala={sala} ventana={false} />
            <Foto sala={false} ventana />
            <Foto sala ventana={espacio.ventana} />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <p className="t-base leading-6 text-slate-700">{espacio.descripcion}</p>

          <dl className="grid grid-cols-2 gap-x-4 sm:grid-cols-3">
            {atributos.map(([k, v]) => (
              <div key={k} className="border-b border-slate-200 py-2.5">
                <dt className="t-xs muted">{k}</dt>
                <dd className="t-sm font-medium">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-col gap-2">
            <h3 className="t-sm font-semibold">Equipamiento</h3>
            <div className="flex flex-wrap gap-1.5">
              {espacio.equipamiento.map((item) => (
                <span key={item} className="chip chip-lg">
                  <Icon name={iconoEquipamiento(item)} size={14} />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="t-sm font-semibold">Servicios del piso más cercanos</h3>
            <div className="flex flex-wrap gap-1.5">
              {espacio.serviciosCercanos.map((s) => (
                <span key={s.nombre} className="chip chip-lg">
                  <Icon name={ICONO_SERVICIO[s.tipo] ?? 'info'} size={14} />
                  {s.nombre} · <span className="num">{s.metros} m</span>
                </span>
              ))}
            </div>
            <p className="t-xs muted">Los servicios se ven en el plano con trama gris y no se reservan.</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="t-sm mb-2 font-semibold">Condiciones de uso</h3>
            <ul className="t-xs muted grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
              <li>· Franja mínima de {c.minimaMinutos} min, máxima de {c.maximaMinutos / 60} h, en bloques de {c.pasoMinutos} min.</li>
              <li>· Se puede cancelar hasta que empieza, desde Mis reservas.</li>
              <li>
                · El edificio abre de lunes a viernes de <span className="num">{espacio.edificio.apertura}</span> a{' '}
                <span className="num">{espacio.edificio.cierre}</span>.
              </li>
              <li>· Se reserva con hasta {c.anticipacionMaximaDias} días de anticipación; nace pendiente y se confirma al acreditarse el pago.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Placeholder photo in the wireframe style: a desk with a monitor, or a meeting table, and maybe a window. */
function Foto({ sala, ventana, etiqueta, grande = false }: { sala: boolean; ventana: boolean; etiqueta?: string; grande?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-md border border-slate-200 bg-accent-50 ${grande ? 'h-[270px]' : 'h-[92px]'}`}>
      <svg viewBox="0 0 420 270" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <rect x="0" y="196" width="420" height="74" fill="#e2e8f0" />
        {ventana && (
          <g>
            <rect x="250" y="26" width="146" height="146" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="3" />
            <path d="M323 26v146M250 99h146" stroke="#7dd3fc" strokeWidth="3" />
          </g>
        )}
        <rect x="48" y="60" width="176" height="92" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
        {sala ? (
          <g>
            <rect x="70" y="170" width="280" height="22" rx="4" fill="#94a3b8" />
            {[92, 152, 212, 272, 322].map((x) => <circle key={x} cx={x} cy="208" r="12" fill="#a5b4fc" />)}
          </g>
        ) : (
          <g>
            <rect x="60" y="160" width="300" height="10" fill="#94a3b8" />
            <rect x="74" y="170" width="8" height="46" fill="#94a3b8" />
            <rect x="338" y="170" width="8" height="46" fill="#94a3b8" />
            <rect x="130" y="100" width="90" height="56" rx="4" fill="#334155" />
            <rect x="170" y="156" width="10" height="6" fill="#334155" />
            <rect x="238" y="136" width="18" height="24" rx="3" fill="#86efac" />
            <ellipse cx="170" cy="214" rx="24" ry="30" fill="#a5b4fc" />
            <rect x="160" y="170" width="20" height="36" rx="8" fill="#c7d2fe" />
          </g>
        )}
      </svg>
      {etiqueta && <span className="cover-tag">[{etiqueta}]</span>}
    </div>
  );
}
