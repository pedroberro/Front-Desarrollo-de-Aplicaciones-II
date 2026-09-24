import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { getApiErrorMessage } from '../../api/apiError';
import { adminApi } from '../../api/reservasApi';
import { SelectorPiso } from '../../components/admin/SelectorPiso';
import { EmptyState, ErrorCarga } from '../../components/ui/EmptyState';
import { EstadoReservaBadge, ETIQUETA_ESTADO_RESERVA } from '../../components/ui/EstadoBadge';
import { FechaInput } from '../../components/ui/FechaInput';
import { Icon } from '../../components/ui/Icon';
import { Modal } from '../../components/ui/Modal';
import { useCarga } from '../../hooks/useCarga';
import { useEdificios } from '../../hooks/useEdificios';
import type { EstadoReserva, Reserva, TipoEspacio } from '../../types/reservas';
import { iniciales, TIPOS_ESPACIO } from '../../utils/catalogo';
import { ahoraISO, diaMes, fechaDe, hoyISO, lunesDe, rangoHorario, sumarDias } from '../../utils/fechas';
import { ModalDetalleReserva } from '../MisReservasView';

const TAMANIO = 12;
const ESTADOS: EstadoReserva[] = ['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'FINALIZADA'];

/** Screen 11b: every booking, filtered and paged by the server, ordered by start time. */
export function ReservasAdminView() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const edificios = useEdificios();

  const lunes = lunesDe(hoyISO());
  const filtro = {
    edificioId: num(sp.get('edificio')),
    pisoId: num(sp.get('piso')),
    tipo: (sp.get('tipo') as TipoEspacio | null) ?? undefined,
    desde: sp.get('desde') ?? lunes,
    hasta: sp.get('hasta') ?? sumarDias(lunes, 6),
    estado: (sp.get('estado') as EstadoReserva | null) ?? undefined,
    q: sp.get('q') ?? undefined,
    page: num(sp.get('page')) ?? 0,
    size: TAMANIO,
  };
  const { estado, recargar } = useCarga(() => adminApi.reservas(filtro), [sp.toString()], 'No pudimos cargar las reservas.');
  const [cancelando, setCancelando] = useState<Reserva | null>(null);
  const [detalle, setDetalle] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState(filtro.q ?? '');
  const location = useLocation();
  const [aviso, setAviso] = useState<string | null>((location.state as { aviso?: string } | null)?.aviso ?? null);

  // The notice comes once, from the form: drop it from history so a reload does not repeat it.
  useEffect(() => {
    if (location.state) navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [location, navigate]);

  const poner = (cambios: Record<string, string | undefined>) =>
    setSp((actual) => {
      const nuevo = new URLSearchParams(actual);
      for (const [k, v] of Object.entries(cambios)) {
        if (v === undefined || v === '') nuevo.delete(k);
        else nuevo.set(k, v);
      }
      if (!('page' in cambios)) nuevo.delete('page');
      return nuevo;
    });

  const lista = edificios.datos ?? [];
  const edificio = lista.find((e) => e.id === filtro.edificioId);
  const piso = edificio?.pisos.find((p) => p.id === filtro.pisoId);
  const activos = [
    edificio && { label: edificio.nombre, quitar: { edificio: undefined, piso: undefined } },
    piso && { label: piso.nombre, quitar: { piso: undefined } },
    filtro.tipo && { label: TIPOS_ESPACIO.find((t) => t.valor === filtro.tipo)?.label ?? filtro.tipo, quitar: { tipo: undefined } },
    { label: `${diaMes(filtro.desde)} – ${diaMes(filtro.hasta)}`, quitar: { desde: '2000-01-01', hasta: '2100-12-31' }, fechas: true },
    filtro.estado && { label: ETIQUETA_ESTADO_RESERVA[filtro.estado], quitar: { estado: undefined } },
    filtro.q && { label: `«${filtro.q}»`, quitar: { q: undefined } },
  ].filter(Boolean) as { label: string; quitar: Record<string, string | undefined>; fechas?: boolean }[];
  const todasLasFechas = filtro.desde === '2000-01-01';

  if (estado.tipo === 'error') return <ErrorCarga mensaje={estado.mensaje} onReintentar={recargar} />;
  const pagina = estado.datos;
  const ahora = ahoraISO();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="t-3xl font-semibold">Reservas</h1>
          <p className="t-sm muted">
            {pagina ? `${pagina.totalElements} ${pagina.totalElements === 1 ? 'resultado' : 'resultados'} de ${pagina.totalGeneral} reservas` : 'Cargando…'}
          </p>
        </div>
        <Link to="/admin/reservas/nueva" className="btn btn-primary btn-lg">
          <Icon name="plus" /> Nueva reserva
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

      <div className="card flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <SelectorPiso
            edificios={lista}
            edificioId={filtro.edificioId ?? null}
            pisoId={filtro.pisoId ?? null}
            permitirTodos
            onChange={() => undefined}
            onTodos={(e, p) => poner({ edificio: e?.toString(), piso: p?.toString() })}
          />
          <div className="field w-full sm:w-[180px]">
            <label className="label" htmlFor="f-tipo">Tipo de espacio</label>
            <div className="input">
              <select id="f-tipo" value={filtro.tipo ?? ''} onChange={(e) => poner({ tipo: e.target.value })}>
                <option value="">Todos los tipos</option>
                {TIPOS_ESPACIO.map((t) => <option key={t.valor} value={t.valor}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <FechaInput id="f-desde" label="Desde" valor={todasLasFechas ? '' : filtro.desde} soloHabiles={false} onChange={(d) => poner({ desde: d, hasta: d > filtro.hasta ? d : filtro.hasta })} className="w-full sm:w-[160px]" />
          <FechaInput id="f-hasta" label="Hasta" valor={todasLasFechas ? '' : filtro.hasta} soloHabiles={false} onChange={(h) => poner({ hasta: h, desde: h < filtro.desde ? h : filtro.desde })} className="w-full sm:w-[160px]" />
          <div className="field w-full sm:w-[150px]">
            <label className="label" htmlFor="f-estado">Estado</label>
            <div className="input">
              <select id="f-estado" value={filtro.estado ?? ''} onChange={(e) => poner({ estado: e.target.value })}>
                <option value="">Todos</option>
                {ESTADOS.map((e) => <option key={e} value={e}>{ETIQUETA_ESTADO_RESERVA[e]}</option>)}
              </select>
            </div>
          </div>
          <form
            className="field w-full sm:w-[210px]"
            onSubmit={(e) => {
              e.preventDefault();
              poner({ q: busqueda.trim() });
            }}
          >
            <label className="label" htmlFor="f-q">Cliente o código</label>
            <div className="input">
              <Icon name="search" className="input-icon" />
              <input id="f-q" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Ana, R-1042…" />
            </div>
          </form>
          <button type="button" className="btn btn-ghost btn-sm ml-auto self-center" onClick={() => { setBusqueda(''); setSp({}); }}>
            <Icon name="x" size={14} /> Limpiar
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="t-xs muted">Filtros activos:</span>
          {activos.map((a) => (
            <span key={a.label} className="badge b-accent badge-sm">
              {todasLasFechas && a.fechas ? 'Todas las fechas' : a.label}
              {!(todasLasFechas && a.fechas) && (
                <button type="button" aria-label={`Quitar ${a.label}`} onClick={() => poner(a.quitar)}>
                  <Icon name="x" size={12} />
                </button>
              )}
            </span>
          ))}
        </div>
      </div>

      <section className="card overflow-hidden">
        {!pagina && <div className="sk m-4 h-[480px]" aria-busy="true" aria-label="Cargando reservas" />}
        {pagina && pagina.content.length === 0 && (
          <EmptyState icon="filter" titulo="Ninguna reserva coincide con los filtros">
            Probá ampliar el rango de fechas o quitar algún filtro.
          </EmptyState>
        )}
        {pagina && pagina.content.length > 0 && (
          <div className={`tbl-scroll ${estado.tipo === 'cargando' ? 'opacity-60' : ''}`}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Reserva</th>
                  <th>Cliente</th>
                  <th>Espacio</th>
                  <th className="hidden lg:table-cell">Ubicación</th>
                  <th>Fecha</th>
                  <th>Horario</th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagina.content.map((r) => (
                  <tr key={r.id}>
                    <td className="mono font-semibold">{r.codigo}</td>
                    <td>
                      <span className="flex items-center gap-2">
                        <span className="avatar">{iniciales(r.cliente.nombre)}</span>
                        {r.cliente.nombre}
                      </span>
                    </td>
                    <td>
                      <b className="mono">{r.espacio.codigo}</b> <span className="t-xs muted">{r.espacio.tipoEtiqueta}</span>
                    </td>
                    <td className="muted hidden lg:table-cell">
                      {r.edificio.nombre} · {r.piso.nombre.replace('Piso ', 'P').replace('Planta baja', 'PB')}
                    </td>
                    <td className="num">{diaMes(fechaDe(r.inicio))}</td>
                    <td className="num">{rangoHorario(r.inicio, r.fin)}</td>
                    <td>
                      <EstadoReservaBadge estado={r.estado} />
                    </td>
                    <td>
                      <span className="flex justify-end gap-1.5">
                        <button type="button" className="btn btn-secondary btn-sm btn-icon" onClick={() => setDetalle(r.id)} aria-label={`Ver ${r.codigo}`}>
                          <Icon name="eye" size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm btn-icon"
                          onClick={() => navigate(`/admin/reservas/${r.id}`)}
                          disabled={r.estado === 'FINALIZADA' || r.fin <= ahora}
                          aria-label={`Editar ${r.codigo}`}
                        >
                          <Icon name="pencil" size={14} />
                        </button>
                        <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => setCancelando(r)} disabled={!r.cancelable} aria-label={`Cancelar ${r.codigo}`}>
                          <Icon name="ban" size={14} />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagina && pagina.totalElements > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
            <span className="t-xs muted">Filtrado, ordenado y paginado en el servidor · {TAMANIO} por página, ordenadas por hora de inicio</span>
            <span className="flex items-center gap-2">
              <button type="button" className="btn btn-secondary btn-sm btn-icon" disabled={pagina.page === 0} onClick={() => poner({ page: String(pagina.page - 1) })} aria-label="Página anterior">
                <Icon name="chevLeft" size={14} />
              </button>
              <span className="t-sm num">
                <b>{pagina.page + 1}</b> <span className="muted">de {Math.max(1, pagina.totalPages)}</span>
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm btn-icon"
                disabled={pagina.page + 1 >= pagina.totalPages}
                onClick={() => poner({ page: String(pagina.page + 1) })}
                aria-label="Página siguiente"
              >
                <Icon name="chevRight" size={14} />
              </button>
            </span>
          </div>
        )}
      </section>

      {detalle !== null && <ModalDetalleReserva id={detalle} onCerrar={() => setDetalle(null)} />}
      {cancelando && (
        <ModalCancelarAdmin
          reserva={cancelando}
          onCerrar={() => setCancelando(null)}
          onListo={() => {
            setCancelando(null);
            recargar();
          }}
        />
      )}
    </>
  );
}

function num(valor: string | null): number | undefined {
  return valor ? Number(valor) : undefined;
}

/** Cancelling someone else's booking is an edit: it needs a reason that the customer will see. */
export function ModalCancelarAdmin({ reserva, onCerrar, onListo }: { reserva: Reserva; onCerrar: () => void; onListo: () => void }) {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const valido = motivo.trim().length >= 10;

  const cancelar = async () => {
    setEnviando(true);
    try {
      await adminApi.actualizarReserva(reserva.id, {
        usuarioId: reserva.cliente.id,
        espacioId: reserva.espacio.id,
        inicio: reserva.inicio,
        fin: reserva.fin,
        estado: 'CANCELADA',
        motivo: motivo.trim(),
      });
      onListo();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No pudimos cancelar la reserva.'));
      setEnviando(false);
    }
  };

  return (
    <Modal
      title={`Cancelar la reserva ${reserva.codigo}`}
      onClose={onCerrar}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onCerrar} disabled={enviando}>
            Volver
          </button>
          <button type="button" className="btn btn-danger" onClick={cancelar} disabled={!valido || enviando}>
            <Icon name="ban" size={14} /> Cancelar reserva
          </button>
        </>
      }
    >
      <p className="t-sm muted">
        {reserva.cliente.nombre} · {reserva.espacio.codigo} · {diaMes(fechaDe(reserva.inicio))}, {rangoHorario(reserva.inicio, reserva.fin)}. La franja queda
        libre y el cliente recibe un aviso por mail.
      </p>
      <div className="field">
        <label className="label" htmlFor="motivo-cancelar">
          Motivo <span className="text-rose-600">*</span>
        </label>
        <textarea id="motivo-cancelar" className="textarea" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Por ejemplo: corte de luz programado en el piso" />
        <span className="hint">Mínimo 10 caracteres. Se guarda con la reserva y el cliente lo ve en su detalle.</span>
      </div>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
    </Modal>
  );
}
