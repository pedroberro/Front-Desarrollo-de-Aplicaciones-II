import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../api/apiError';
import { reservasApi } from '../api/reservasApi';
import { EmptyState, ErrorCarga } from '../components/ui/EmptyState';
import { EstadoReservaBadge } from '../components/ui/EstadoBadge';
import { Icon } from '../components/ui/Icon';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../hooks/useAuth';
import { useCarga } from '../hooks/useCarga';
import type { Reserva } from '../types/reservas';
import { duracion, fechaDe, fechaLarga, horaDe, partesFecha, rangoHorario } from '../utils/fechas';

type Pestania = 'proximas' | 'historial';

export function MisReservasView() {
  const { usuario } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { estado, recargar, setDatos } = useCarga(() => reservasApi.mias(), [], 'No pudimos cargar tus reservas.');
  const [pestania, setPestania] = useState<Pestania>('proximas');
  const [aviso, setAviso] = useState<string | null>((location.state as { aviso?: string } | null)?.aviso ?? null);
  const [cancelando, setCancelando] = useState<Reserva | null>(null);
  const [detalle, setDetalle] = useState<number | null>(null);

  // The notice comes once, from the booking flow: drop it from history so a reload does not repeat it.
  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 6000);
    return () => clearTimeout(t);
  }, [aviso]);

  // Right after booking, the charge runs in the background: check a few times so the new booking
  // turns Confirmada (or Cancelada) without reloading. Silent reloads, so the list does not flash.
  const [consultasRestantes, setConsultasRestantes] = useState(aviso ? 5 : 0);
  const hayPendientes = estado.tipo === 'listo' && estado.datos.proximas.some((r) => r.estado === 'PENDIENTE');
  useEffect(() => {
    if (!hayPendientes || consultasRestantes === 0) return;
    const t = setTimeout(() => {
      reservasApi
        .mias()
        .then(setDatos)
        .catch(() => undefined)
        .finally(() => setConsultasRestantes((n) => n - 1));
    }, 2000);
    return () => clearTimeout(t);
  }, [hayPendientes, consultasRestantes, setDatos]);

  if (estado.tipo === 'error') return <ErrorCarga mensaje={estado.mensaje} onReintentar={recargar} />;
  const datos = estado.tipo === 'listo' ? estado.datos : null;
  const lista = datos ? (pestania === 'proximas' ? datos.proximas : datos.historial) : [];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="t-3xl font-semibold">Mis reservas</h1>
          <p className="t-sm muted">
            {usuario?.nombre}
            {datos && ` · ${datos.proximas.length} ${datos.proximas.length === 1 ? 'reserva próxima' : 'reservas próximas'}`}
          </p>
        </div>
        <Link to="/empresas" className="btn btn-primary btn-lg">
          <Icon name="plus" /> Nueva reserva
        </Link>
      </div>

      {aviso && (
        <div className="alert alert-ok" role="status">
          <Icon name="check" size={14} className="mt-[3px]" />
          <span>{aviso}</span>
        </div>
      )}

      <section className="card">
        <div className="px-4 pt-4">
          <div className="tabs" role="tablist">
            {(['proximas', 'historial'] as const).map((p) => (
              <button key={p} type="button" role="tab" aria-selected={pestania === p} className={`tab ${pestania === p ? 'tab-on' : ''}`} onClick={() => setPestania(p)}>
                {p === 'proximas' ? 'Próximas' : 'Historial'}
                <span className="tab-count num">{datos ? (p === 'proximas' ? datos.proximas.length : datos.historial.length) : '–'}</span>
              </button>
            ))}
          </div>
        </div>

        {!datos && (
          <div className="flex flex-col gap-3 p-4" aria-busy="true" aria-label="Cargando reservas">
            {Array.from({ length: 4 }, (_, i) => <div key={i} className="sk h-[62px]" />)}
          </div>
        )}

        {datos && lista.length === 0 && (
          pestania === 'proximas' && datos.historial.length === 0 ? (
            <EmptyState
              icon="inbox"
              titulo="Todavía no reservaste ningún espacio"
              acciones={
                <Link to="/empresas" className="btn btn-primary">
                  <Icon name="building" /> Ver empresas
                </Link>
              }
            >
              Cuando reserves un cubículo o una sala, la vas a ver acá con su estado y vas a poder cancelarla.
            </EmptyState>
          ) : (
            <EmptyState icon="calendar" titulo={pestania === 'proximas' ? 'No tenés reservas próximas' : 'Todavía no hay historial'}>
              {pestania === 'proximas' ? 'Las reservas que ya pasaron o cancelaste están en Historial.' : 'Acá aparecen las reservas finalizadas y canceladas.'}
            </EmptyState>
          )
        )}

        {lista.length > 0 && (
          <ul className="px-4">
            {lista.map((r) => (
              <FilaReserva
                key={r.id}
                reserva={r}
                accion={
                  pestania === 'proximas' && r.cancelable ? (
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => setCancelando(r)}>
                      <Icon name="ban" size={14} /> Cancelar
                    </button>
                  ) : (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDetalle(r.id)}>
                      Ver detalle
                    </button>
                  )
                }
                onDetalle={() => setDetalle(r.id)}
              />
            ))}
          </ul>
        )}

        {datos && lista.length > 0 && (
          <div className="t-xs muted flex flex-wrap justify-between gap-2 border-t border-slate-200 px-4 py-3">
            <span>
              Mostrando {lista.length} de {lista.length}
            </span>
            <span>Solo se pueden cancelar las reservas Pendientes o Confirmadas que todavía no empezaron.</span>
          </div>
        )}
      </section>

      {cancelando && (
        <ModalCancelar
          reserva={cancelando}
          onCerrar={() => setCancelando(null)}
          onCancelada={(reserva) => {
            setCancelando(null);
            if (datos) {
              setDatos({ proximas: datos.proximas.filter((r) => r.id !== reserva.id), historial: [reserva, ...datos.historial] });
            }
            setAviso(`Cancelaste la reserva ${reserva.codigo}. La franja quedó libre.`);
          }}
        />
      )}

      {detalle !== null && <ModalDetalleReserva id={detalle} onCerrar={() => setDetalle(null)} />}
    </>
  );
}

export function FilaReserva({ reserva: r, accion, onDetalle }: { reserva: Reserva; accion: ReactNode; onDetalle?: () => void }) {
  const fecha = partesFecha(fechaDe(r.inicio));
  const apagada = r.estado === 'CANCELADA' || r.estado === 'FINALIZADA';
  return (
    <li className="flex flex-wrap items-center gap-4 border-b border-slate-100 py-3.5 last:border-b-0 lg:grid lg:grid-cols-[56px_minmax(220px,260px)_240px_150px_1fr_auto]">
      <span className="date-box" aria-label={fechaLarga(fechaDe(r.inicio))}>
        <b className="num">{fecha.dia}</b>
        <span>{fecha.mes}</span>
      </span>
      <button type="button" className={`flex min-w-[220px] grow basis-0 flex-col text-left lg:grow-0 ${apagada ? 'opacity-75' : ''}`} onClick={onDetalle}>
        <span className="flex items-baseline gap-2">
          <b className="mono">{r.espacio.codigo}</b>
          <span className="t-sm muted">{r.espacio.tipoEtiqueta}</span>
        </span>
        <span className="t-sm muted">
          {r.edificio.nombre} · {r.piso.nombre}
        </span>
      </button>
      <span className="t-sm flex min-w-[190px] items-center gap-2">
        <Icon name="clock" size={14} className="text-slate-400" />
        <b className="num font-semibold">{rangoHorario(r.inicio, r.fin)}</b>
        <span className="muted num">({duracion(r.duracionMinutos)})</span>
      </span>
      <span className="min-w-[120px]">
        <EstadoReservaBadge estado={r.estado} />
      </span>
      <span className="t-xs muted flex items-center gap-1" title={r.creadaPorAdmin ? 'La cargó o modificó un administrador' : undefined}>
        {r.creadaPorAdmin && (
          <>
            <Icon name="shield" size={12} /> Cargada por un administrador
          </>
        )}
      </span>
      <span className="ml-auto">{accion}</span>
    </li>
  );
}

function ModalCancelar({ reserva, onCerrar, onCancelada }: { reserva: Reserva; onCerrar: () => void; onCancelada: (r: Reserva) => void }) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelar = async () => {
    setEnviando(true);
    try {
      onCancelada(await reservasApi.cancelar(reserva.id));
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
          <button type="button" className="btn btn-danger" onClick={cancelar} disabled={enviando}>
            <Icon name="ban" size={14} /> {enviando ? 'Cancelando…' : 'Cancelar reserva'}
          </button>
        </>
      }
    >
      <p className="t-sm muted">
        {reserva.espacio.codigo} · {reserva.edificio.nombre}, {reserva.piso.nombre} · {fechaLarga(fechaDe(reserva.inicio), false)},{' '}
        {rangoHorario(reserva.inicio, reserva.fin)}. La franja queda libre para otras personas.
      </p>
      {error && (
        <p className="alert alert-error" role="alert">
          <Icon name="alert" size={14} className="mt-[3px]" />
          <span>{error}</span>
        </p>
      )}
    </Modal>
  );
}

/** Detail of a booking with its change log: the customer sees why an administrator changed it. */
export function ModalDetalleReserva({ id, onCerrar }: { id: number; onCerrar: () => void }) {
  const { estado } = useCarga(() => reservasApi.detalle(id), [id], 'No pudimos cargar la reserva.');
  const r = estado.tipo === 'listo' ? estado.datos : null;

  return (
    <Modal
      title={r ? `Reserva ${r.codigo}` : 'Reserva'}
      badge={r && <EstadoReservaBadge estado={r.estado} />}
      ancho={520}
      onClose={onCerrar}
      footer={
        <button type="button" className="btn btn-secondary" onClick={onCerrar}>
          Cerrar
        </button>
      }
    >
      {estado.tipo === 'error' && <p className="alert alert-error">{estado.mensaje}</p>}
      {!r && estado.tipo !== 'error' && <div className="sk h-[180px]" />}
      {r && (
        <>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            {[
              ['Espacio', `${r.espacio.codigo} · ${r.espacio.tipoEtiqueta}`],
              ['Ubicación', `${r.edificio.nombre} · ${r.piso.nombre}`],
              ['Día', fechaLarga(fechaDe(r.inicio))],
              ['Horario', `${rangoHorario(r.inicio, r.fin)} (${duracion(r.duracionMinutos)})`],
              ['A nombre de', r.cliente.nombre],
              ['Creada', `${fechaLarga(fechaDe(r.creadaEl), false)}, ${horaDe(r.creadaEl)}${r.creadaPorAdmin ? ' · por un administrador' : ''}`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="t-xs muted">{k}</dt>
                <dd className="t-sm font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-col gap-2 border-t border-slate-200 pt-3">
            <h3 className="t-sm font-semibold">Historial de cambios</h3>
            {r.cambios && r.cambios.length > 0 ? (
              <ol className="flex flex-col gap-2">
                {r.cambios.map((c) => (
                  <li key={c.fecha} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="t-xs muted">
                      {fechaLarga(fechaDe(c.fecha), false)}, {horaDe(c.fecha)} · {c.autor}
                    </p>
                    <p className="t-sm mt-1">{c.detalle}</p>
                    <p className="t-sm mt-1 text-slate-600">
                      <b className="font-medium">Motivo:</b> {c.motivo}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="t-sm muted">Sin cambios desde que se creó.</p>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
