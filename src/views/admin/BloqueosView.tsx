import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/reservasApi';
import { SelectorPiso } from '../../components/admin/SelectorPiso';
import { EmptyState, ErrorCarga } from '../../components/ui/EmptyState';
import { Icon } from '../../components/ui/Icon';
import { useCarga } from '../../hooks/useCarga';
import { useEdificios } from '../../hooks/useEdificios';
import type { Bloqueo } from '../../types/reservas';
import { diaMes, fechaDe, horaDe } from '../../utils/fechas';
import { ModalQuitarBloqueo } from './AgendaView';

/** Current and upcoming blocks. Blocks created together (a whole floor) are grouped in one row. */
export function BloqueosView() {
  const location = useLocation();
  const navigate = useNavigate();
  const { estado, recargar } = useCarga(() => adminApi.bloqueos(), [], 'No pudimos cargar los bloqueos.');
  const [quitando, setQuitando] = useState<Bloqueo | null>(null);
  const [aviso, setAviso] = useState<string | null>((location.state as { aviso?: string } | null)?.aviso ?? null);
  const edificios = useEdificios();
  // The whole list is loaded, so company, building and floor filter it here.
  const [empresa, setEmpresa] = useState<string | null>(null);
  const [edificioId, setEdificioId] = useState<number | null>(null);
  const [pisoId, setPisoId] = useState<number | null>(null);

  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);

  if (estado.tipo === 'error') return <ErrorCarga mensaje={estado.mensaje} onReintentar={recargar} />;
  const empresaDe = new Map((edificios.datos ?? []).map((e) => [e.id, e.empresa]));
  const coincide = (b: Bloqueo) =>
    (!empresa || empresaDe.get(b.edificio.id) === empresa) && (!edificioId || b.edificio.id === edificioId) && (!pisoId || b.piso.id === pisoId);
  const hayFiltro = !!(empresa || edificioId || pisoId);
  const grupos = estado.tipo === 'listo' ? agrupar(estado.datos.filter(coincide)) : null;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="t-3xl font-semibold">Bloqueos</h1>
          <p className="t-sm muted">Espacios fuera de circulación ahora o más adelante: mantenimiento, limpieza o eventos.</p>
        </div>
        <Link to="/admin/bloqueos/nuevo" className="btn btn-primary btn-lg">
          <Icon name="lock" /> Crear bloqueo
        </Link>
      </div>

      {aviso && (
        <div className="alert alert-ok" role="status">
          <Icon name="check" size={14} className="mt-[3px]" />
          <span>{aviso}</span>
          <button type="button" className="ml-auto" onClick={() => setAviso(null)} aria-label="Cerrar aviso">
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {edificios.datos && (
        <div className="card flex flex-wrap items-end gap-3 p-4">
          <SelectorPiso
            edificios={edificios.datos}
            edificioId={edificioId}
            pisoId={pisoId}
            permitirTodos
            onChange={() => undefined}
            onTodos={(e, p) => {
              setEdificioId(e);
              setPisoId(p);
            }}
            empresa={empresa}
            onEmpresa={setEmpresa}
          />
        </div>
      )}

      <section className="card overflow-hidden">
        {!grupos && <div className="sk m-4 h-[300px]" aria-busy="true" aria-label="Cargando bloqueos" />}
        {grupos && grupos.length === 0 && hayFiltro && (
          <EmptyState icon="filter" titulo="Ningún bloqueo coincide con los filtros">
            Probá con otra empresa, edificio o piso.
          </EmptyState>
        )}
        {grupos && grupos.length === 0 && !hayFiltro && (
          <EmptyState icon="lock" titulo="No hay bloqueos vigentes" acciones={<Link to="/admin/bloqueos/nuevo" className="btn btn-primary">Crear bloqueo</Link>}>
            Todos los espacios están en circulación.
          </EmptyState>
        )}
        {grupos && grupos.length > 0 && (
          <div className="tbl-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Espacios</th>
                  <th>Ubicación</th>
                  <th>Desde</th>
                  <th>Hasta</th>
                  <th>Motivo</th>
                  <th className="hidden lg:table-cell">Creado por</th>
                  <th className="text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {grupos.map((g) => {
                  const b = g[0];
                  return (
                    <tr key={b.grupo}>
                      <td>
                        <b className="mono">{g.length === 1 ? b.espacio.codigo : `${g.length} espacios`}</b>
                        {g.length > 1 && <span className="t-xs muted block">piso entero</span>}
                      </td>
                      <td className="muted">
                        {b.edificio.nombre} · {b.piso.nombre}
                      </td>
                      <td className="num">{diaMes(fechaDe(b.inicio))} {horaDe(b.inicio)}</td>
                      <td className="num">{diaMes(fechaDe(b.fin))} {horaDe(b.fin)}</td>
                      <td>
                        <span className="badge b-blk badge-sm">
                          <Icon name="lock" size={12} /> {b.motivoEtiqueta}
                        </span>
                        {b.detalle && <span className="t-xs muted block">{b.detalle}</span>}
                      </td>
                      <td className="muted hidden lg:table-cell">{b.creadoPor}</td>
                      <td className="text-right">
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => setQuitando(b)}>
                          <Icon name="trash" size={14} /> Quitar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {quitando && (
        <ModalQuitarBloqueo
          bloqueo={quitando}
          codigo={quitando.espacio.codigo}
          onCerrar={() => setQuitando(null)}
          onQuitado={() => {
            setQuitando(null);
            setAviso('Bloqueo quitado: la franja vuelve a estar disponible.');
            recargar();
          }}
        />
      )}
    </>
  );
}

function agrupar(bloqueos: Bloqueo[]): Bloqueo[][] {
  const grupos = new Map<string, Bloqueo[]>();
  for (const b of bloqueos) grupos.set(b.grupo, [...(grupos.get(b.grupo) ?? []), b]);
  return [...grupos.values()];
}
