import { useState } from 'react';
import type { EspacioEnPlano, PlanoPiso } from '../../types/reservas';
import { tipoCorto } from '../../utils/catalogo';
import { cuandoLibre } from '../../utils/fechas';
import { EstadoEspacioBadge } from '../ui/EstadoBadge';
import { Icon } from '../ui/Icon';

interface ListaEspaciosProps {
  plano: PlanoPiso;
  onAbrir: (espacio: EspacioEnPlano) => void;
  modo: 'cliente' | 'admin';
}

/** Everything the plan offers, as a sortable table: the accessible path and the one that works on small screens. */
export function ListaEspacios({ plano, onAbrir, modo }: ListaEspaciosProps) {
  const [ascendente, setAscendente] = useState(true);
  const espacios = plano.espacios
    .filter((e) => e.cumpleFiltros)
    .sort((a, b) => (ascendente ? 1 : -1) * a.codigo.localeCompare(b.codigo));

  return (
    <div className="card overflow-hidden">
      <div className="card-hd flex-wrap">
        <p className="t-xs muted">
          <b className="t-sm text-slate-900">{espacios.length} espacios reservables</b> · los servicios del piso (baño, cocina, sala de estar) no aparecen
          porque no se reservan
        </p>
        <span className="t-xs muted">Ordenado por código, {ascendente ? 'ascendente' : 'descendente'}</span>
      </div>
      <div className="tbl-scroll">
        <table className="tbl">
          <thead>
            <tr>
              <th aria-sort={ascendente ? 'ascending' : 'descending'}>
                <button type="button" className="flex items-center gap-1 uppercase text-accent" onClick={() => setAscendente((v) => !v)}>
                  Espacio <Icon name="chevDown" size={14} className={ascendente ? '' : 'rotate-180'} />
                </button>
              </th>
              <th className="hidden md:table-cell">Tipo</th>
              <th className="hidden md:table-cell">Cap.</th>
              <th className="hidden lg:table-cell">Ventana</th>
              <th className="hidden lg:table-cell">Equipamiento</th>
              <th>Estado</th>
              <th>Próximo libre</th>
              <th className="text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {espacios.map((e) => {
              const libreAhora = e.estado === 'LIBRE';
              const cuando = e.proximoLibre ? cuandoLibre(e.proximoLibre.inicio, plano.franja.inicio) : '—';
              return (
                <tr key={e.id}>
                  <td>
                    <b className="mono">{e.codigo}</b>
                    <span className="t-xs muted block md:hidden">
                      {tipoCorto(e.tipo)} · {e.capacidad}p
                    </span>
                  </td>
                  <td className="hidden md:table-cell">{e.tipoEtiqueta}</td>
                  <td className="num hidden md:table-cell">{e.capacidad}</td>
                  <td className="hidden lg:table-cell">
                    {e.ventana ? (
                      <span className="t-sm flex items-center gap-1 text-accent">
                        <Icon name="sun" size={14} /> Sí
                      </span>
                    ) : (
                      <span className="muted2">—</span>
                    )}
                  </td>
                  <td className="muted hidden lg:table-cell">{e.equipamiento.slice(0, 3).map((i) => i.split(' ')[0]).join(', ')}</td>
                  <td>
                    <EstadoEspacioBadge estado={e.estado} />
                  </td>
                  <td className={`num ${cuando === 'ahora' ? 'font-medium text-emerald-700' : ''}`}>{cuando}</td>
                  <td className="text-right">
                    {libreAhora || modo === 'admin' ? (
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => onAbrir(e)}>
                        {modo === 'admin' ? 'Gestionar' : 'Reservar'}
                      </button>
                    ) : (
                      <button type="button" className="btn btn-secondary btn-sm text-slate-400" onClick={() => onAbrir(e)} disabled={!e.proximoLibre}>
                        Ver horarios
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
