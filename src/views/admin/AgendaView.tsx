import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getApiErrorMessage } from '../../api/apiError';
import { adminApi } from '../../api/reservasApi';
import { SelectorPiso } from '../../components/admin/SelectorPiso';
import { ErrorCarga } from '../../components/ui/EmptyState';
import { EstadoReservaBadge } from '../../components/ui/EstadoBadge';
import { FechaInput } from '../../components/ui/FechaInput';
import { Icon } from '../../components/ui/Icon';
import { Modal } from '../../components/ui/Modal';
import { useCarga } from '../../hooks/useCarga';
import { pisoRecordado, recordarPiso, useEdificios } from '../../hooks/useEdificios';
import type { BloqueAgenda, EspacioBreve } from '../../types/reservas';
import { tipoCorto } from '../../utils/catalogo';
import { fechaDe, fechaLarga, horaDe, hhmm, hoyISO, minutos, minutosDelDia, proximoHabil, rangoHorario, sumarDias } from '../../utils/fechas';

const PX_HORA = 56;

/** Screen 11: one day, one floor, every space in columns, with who booked each block. */
export function AgendaView() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const edificios = useEdificios();
  const lista = edificios.datos ?? [];

  const recordado = lista.length ? pisoRecordado(lista) : null;
  const pisoId = sp.get('piso') ? Number(sp.get('piso')) : recordado?.pisoId ?? null;
  const edificio = lista.find((e) => e.pisos.some((p) => p.id === pisoId)) ?? null;
  const fecha = sp.get('fecha') ?? proximoHabil(hoyISO());

  useEffect(() => {
    if (pisoId) recordarPiso(pisoId);
  }, [pisoId]);

  const agenda = useCarga(() => (pisoId ? adminApi.agenda(pisoId, fecha) : Promise.resolve(null)), [pisoId, fecha], 'No pudimos cargar la agenda.');
  const [bloqueo, setBloqueo] = useState<BloqueAgenda | null>(null);

  const ir = (cambios: Record<string, string>) => setSp((actual) => ({ ...Object.fromEntries(actual), ...cambios }));
  const moverDia = (dias: number) => {
    let dia = sumarDias(fecha, dias);
    while ([0, 6].includes(new Date(`${dia}T12:00`).getDay())) dia = sumarDias(dia, dias > 0 ? 1 : -1);
    ir({ fecha: dia });
  };

  if (edificios.estado.tipo === 'error') return <ErrorCarga mensaje={edificios.estado.mensaje} onReintentar={edificios.recargar} />;
  if (agenda.estado.tipo === 'error') return <ErrorCarga mensaje={agenda.estado.mensaje} onReintentar={agenda.recargar} />;
  const datos = agenda.datos;
  const piso = edificio?.pisos.find((p) => p.id === pisoId);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="t-3xl font-semibold">Agenda del día</h1>
          <p className="t-sm muted">
            {edificio && piso ? `${edificio.nombre} · ${piso.nombre} · ` : ''}
            {fechaLarga(fecha)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {pisoId && (
            <Link to={`/admin/pisos/${pisoId}?fecha=${fecha}`} className="btn btn-secondary btn-lg">
              <Icon name="map" /> Ver plano
            </Link>
          )}
          <Link to={`/admin/bloqueos/nuevo?piso=${pisoId ?? ''}&fecha=${fecha}`} className="btn btn-secondary btn-lg">
            <Icon name="lock" /> Crear bloqueo
          </Link>
          <Link to={`/admin/reservas/nueva?piso=${pisoId ?? ''}&fecha=${fecha}`} className="btn btn-primary btn-lg">
            <Icon name="plus" /> Nueva reserva
          </Link>
        </div>
      </div>

      <div className="card flex flex-wrap items-end gap-3 p-4">
        {lista.length > 0 ? (
          <SelectorPiso edificios={lista} edificioId={edificio?.id ?? null} pisoId={pisoId} onChange={(_, p) => ir({ piso: String(p) })} />
        ) : (
          <div className="sk h-[58px] w-[370px]" />
        )}
        <FechaInput id="agenda-dia" label="Día" valor={fecha} onChange={(f) => ir({ fecha: f })} className="w-full sm:w-[220px]" />
        <div className="flex gap-1.5">
          <button type="button" className="btn btn-secondary btn-icon h-9 w-9" onClick={() => moverDia(-1)} aria-label="Día hábil anterior">
            <Icon name="chevLeft" />
          </button>
          <button type="button" className="btn btn-secondary h-9" onClick={() => ir({ fecha: proximoHabil(hoyISO()) })}>
            Hoy
          </button>
          <button type="button" className="btn btn-secondary btn-icon h-9 w-9" onClick={() => moverDia(1)} aria-label="Día hábil siguiente">
            <Icon name="chevRight" />
          </button>
        </div>
        <ul className="t-xs muted ml-auto flex flex-col gap-1">
          <li className="flex items-center gap-2"><span className="h-3 w-5 rounded-sm border border-slate-300 border-l-[3px] border-l-accent bg-slate-100" /> Reserva confirmada</li>
          <li className="flex items-center gap-2"><span className="h-3 w-5 rounded-sm border border-dashed border-accent bg-white" /> Reserva pendiente</li>
          <li className="flex items-center gap-2"><span className="agenda-blq h-3 w-5 rounded-sm" /> Bloqueo (sin usuario)</li>
        </ul>
      </div>

      <section className="card overflow-hidden" aria-label="Agenda">
        {!datos ? (
          <div className="sk m-4 h-[560px]" aria-busy="true" aria-label="Cargando agenda" />
        ) : (
          <GrillaAgenda
            espacios={datos.espacios}
            bloques={datos.bloques}
            apertura={datos.edificio.apertura}
            cierre={datos.edificio.cierre}
            fecha={fecha}
            ahora={datos.ahora}
            onReserva={(id) => navigate(`/admin/reservas/${id}`)}
            onBloqueo={setBloqueo}
          />
        )}
        {datos && (
          <div className="t-xs muted flex flex-wrap justify-between gap-2 border-t border-slate-200 px-4 py-3">
            <span>
              {datos.espacios.length} espacios · {datos.bloques.filter((b) => b.tipo === 'RESERVA').length} reservas y{' '}
              {datos.bloques.filter((b) => b.tipo === 'BLOQUEO').length} bloqueos · el resto se ve desplazando en horizontal
            </span>
            <span>Clic en una reserva abre el formulario en modo edición; en un bloqueo, la opción de quitarlo</span>
          </div>
        )}
      </section>

      {bloqueo && (
        <ModalQuitarBloqueo
          bloqueo={bloqueo}
          codigo={datos?.espacios.find((e) => e.id === bloqueo.espacioId)?.codigo ?? ''}
          onCerrar={() => setBloqueo(null)}
          onQuitado={() => {
            setBloqueo(null);
            agenda.recargar();
          }}
        />
      )}
    </>
  );
}

interface GrillaAgendaProps {
  espacios: EspacioBreve[];
  bloques: BloqueAgenda[];
  apertura: string;
  cierre: string;
  fecha: string;
  ahora: string;
  onReserva: (id: number) => void;
  onBloqueo: (b: BloqueAgenda) => void;
}

function GrillaAgenda({ espacios, bloques, apertura, cierre, fecha, ahora, onReserva, onBloqueo }: GrillaAgendaProps) {
  const inicio = minutos(apertura);
  const fin = minutos(cierre);
  const alto = ((fin - inicio) / 60) * PX_HORA;
  const y = (valor: string, borde: number) => ((fechaDe(valor) === fecha ? minutosDelDia(valor) : borde) - inicio) * (PX_HORA / 60);
  const ahoraMin = minutosDelDia(ahora);
  const mostrarAhora = fechaDe(ahora) === fecha && ahoraMin >= inicio && ahoraMin <= fin;

  return (
    <div className="max-h-[70vh] overflow-auto">
      <div className="agenda" style={{ gridTemplateColumns: `64px repeat(${espacios.length}, minmax(128px, 1fr))` }}>
        <div className="agenda-head agenda-horas sticky left-0 z-[5]" />
        {espacios.map((e) => (
          <div key={e.id} className="agenda-head">
            <b className="mono t-sm">{e.codigo}</b>
            <p className="t-xs muted">
              {tipoCorto(e.tipo)} · {e.capacidad}p
            </p>
          </div>
        ))}

        <div className="agenda-horas sticky left-0 z-[3]" style={{ height: alto, gridRow: 2, gridColumn: 1 }}>
          {Array.from({ length: (fin - inicio) / 60 + 1 }, (_, i) => (
            <span key={i} className="cal-hora absolute right-0" style={{ top: i * PX_HORA }}>
              {hhmm(inicio + i * 60)}
            </span>
          ))}
        </div>
        {espacios.map((e, i) => (
          <div
            key={e.id}
            className="agenda-col"
            style={{
              gridRow: 2,
              gridColumn: i + 2,
              height: alto,
              backgroundImage: `repeating-linear-gradient(to bottom, var(--color-slate-200) 0 1px, transparent 1px ${PX_HORA / 2}px)`,
            }}
          >
            {bloques
              .filter((b) => b.espacioId === e.id)
              .map((b) => {
                const top = Math.max(0, y(b.inicio, 0));
                const bottom = Math.min(alto, y(b.fin, 1440));
                const reserva = b.tipo === 'RESERVA';
                return (
                  <button
                    key={`${b.tipo}-${b.id}`}
                    type="button"
                    className={`agenda-bloque ${reserva ? (b.estado === 'PENDIENTE' ? 'agenda-pend' : '') : 'agenda-blq'}`}
                    style={{ top: top + 2, height: Math.max(22, bottom - top - 4) }}
                    onClick={() => (reserva ? onReserva(b.id) : onBloqueo(b))}
                    title={reserva ? `${b.cliente?.nombre} · ${rangoHorario(b.inicio, b.fin)}` : `${b.motivoEtiqueta} · ${b.detalle}`}
                  >
                    <span className="num block text-[10px] text-slate-500">
                      {fechaDe(b.inicio) === fecha ? horaDe(b.inicio) : apertura} – {fechaDe(b.fin) === fecha ? horaDe(b.fin) : cierre}
                    </span>
                    <b className="block truncate font-semibold">{reserva ? b.cliente?.nombre : b.detalle || b.motivoEtiqueta}</b>
                    {bottom - top > 56 &&
                      (reserva && b.estado ? (
                        <span className="mt-1 inline-block">
                          <EstadoReservaBadge estado={b.estado} />
                        </span>
                      ) : (
                        !reserva && (
                          <span className="badge b-blk badge-sm mt-1">
                            <Icon name="lock" size={12} /> Bloqueo
                          </span>
                        )
                      ))}
                  </button>
                );
              })}
          </div>
        ))}

        {mostrarAhora && (
          <div className="pointer-events-none relative z-[5]" style={{ gridRow: 2, gridColumn: '2 / -1' }}>
            <div className="agenda-ahora" style={{ top: (ahoraMin - inicio) * (PX_HORA / 60) }}>
              <span>{horaDe(ahora)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ModalQuitarBloqueo({
  bloqueo,
  codigo,
  onCerrar,
  onQuitado,
}: {
  bloqueo: { id: number; inicio: string; fin: string; motivoEtiqueta: string | null; detalle: string | null };
  codigo: string;
  onCerrar: () => void;
  onQuitado: () => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quitar = async (grupo: boolean) => {
    setEnviando(true);
    try {
      await adminApi.eliminarBloqueo(bloqueo.id, grupo);
      onQuitado();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No pudimos quitar el bloqueo.'));
      setEnviando(false);
    }
  };

  return (
    <Modal
      title={`Bloqueo de ${codigo}`}
      badge={<span className="badge b-blk badge-sm"><Icon name="lock" size={12} /> {bloqueo.motivoEtiqueta}</span>}
      onClose={onCerrar}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={() => quitar(true)} disabled={enviando}>
            Quitar todo el grupo
          </button>
          <button type="button" className="btn btn-danger" onClick={() => quitar(false)} disabled={enviando}>
            <Icon name="trash" size={14} /> Quitar este bloqueo
          </button>
        </>
      }
    >
      <p className="t-sm muted">
        {bloqueo.detalle || 'Sin detalle'} · {fechaLarga(fechaDe(bloqueo.inicio), false)} {horaDe(bloqueo.inicio)} –{' '}
        {fechaDe(bloqueo.fin) === fechaDe(bloqueo.inicio) ? '' : `${fechaLarga(fechaDe(bloqueo.fin), false)} `}
        {horaDe(bloqueo.fin)}. Al quitarlo, la franja vuelve a estar disponible para reservar.
      </p>
      <p className="t-xs muted">«Quitar todo el grupo» borra también los bloqueos creados junto con este (por ejemplo, un piso entero).</p>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
    </Modal>
  );
}
