import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { catalogoApi } from '../../api/catalogoApi';
import axios from 'axios';
import { getApiErrorMessage } from '../../api/apiError';
import { adminApi } from '../../api/reservasApi';
import { SelectorPiso } from '../../components/admin/SelectorPiso';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { ErrorCarga } from '../../components/ui/EmptyState';
import { EstadoReservaBadge } from '../../components/ui/EstadoBadge';
import { FechaInput } from '../../components/ui/FechaInput';
import { Icon, type IconName } from '../../components/ui/Icon';
import { Segmented } from '../../components/ui/Segmented';
import { useCarga } from '../../hooks/useCarga';
import { pisoRecordado, useEdificios } from '../../hooks/useEdificios';
import type { MotivoBloqueo, OcupacionCalendario, ReservasAfectadasBody } from '../../types/reservas';
import { diaMes, fechaDe, fechaHora, hhmm, horaDe, horasCada30, hoyISO, minutos, minutosDelDia, proximoHabil } from '../../utils/fechas';

const MOTIVOS: { valor: MotivoBloqueo; label: string; icono: IconName }[] = [
  { valor: 'MANTENIMIENTO', label: 'Mantenimiento', icono: 'refresh' },
  { valor: 'LIMPIEZA', label: 'Limpieza', icono: 'sun' },
  { valor: 'EVENTO', label: 'Evento', icono: 'users' },
  { valor: 'OTRO', label: 'Otro', icono: 'info' },
];

/** Screen 14. A block occupies the calendar like a booking, without a customer. */
export function CrearBloqueoView() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const edificios = useEdificios();

  const [alcance, setAlcance] = useState<'ESPACIO' | 'PISO'>('ESPACIO');
  const [pisoId, setPisoId] = useState<number | null>(sp.get('piso') ? Number(sp.get('piso')) : null);
  const [espacioId, setEspacioId] = useState<number | null>(sp.get('espacio') ? Number(sp.get('espacio')) : null);
  const inicial = proximoHabil(sp.get('fecha') ?? hoyISO());
  const [fechaDesde, setFechaDesde] = useState(inicial);
  const [horaDesde, setHoraDesde] = useState('13:00');
  const [fechaHasta, setFechaHasta] = useState(inicial);
  const [horaHasta, setHoraHasta] = useState('19:00');
  const [motivo, setMotivo] = useState<MotivoBloqueo>('MANTENIMIENTO');
  const [detalle, setDetalle] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Bookings the block would cancel: the API asks before sweeping them away.
  const [afectadas, setAfectadas] = useState<ReservasAfectadasBody | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    if (!pisoId && edificios.datos) setPisoId(pisoRecordado(edificios.datos)?.pisoId ?? null);
  }, [edificios.datos, pisoId]);

  const espacios = useCarga(() => (pisoId ? catalogoApi.espaciosDePiso(pisoId) : Promise.resolve([])), [pisoId]);
  useEffect(() => {
    if (espacios.datos && !espacios.datos.some((e) => e.id === espacioId)) setEspacioId(espacios.datos.at(-1)?.id ?? null);
  }, [espacios.datos, espacioId]);
  const agenda = useCarga(
    () => (espacioId && alcance === 'ESPACIO' ? catalogoApi.agenda(espacioId, fechaDesde, fechaDesde) : Promise.resolve(null)),
    [espacioId, fechaDesde, alcance],
  );

  const edificio = edificios.datos?.find((e) => e.pisos.some((p) => p.id === pisoId)) ?? null;
  const espacio = espacios.datos?.find((e) => e.id === espacioId);
  const horas = edificio ? horasCada30(edificio.apertura, edificio.cierre) : horasCada30('08:00', '20:00');
  const inicio = fechaHora(fechaDesde, horaDesde);
  const fin = fechaHora(fechaHasta, horaHasta);
  const rangoValido = fin > inicio;

  const crear = async (e: FormEvent) => {
    e.preventDefault();
    await enviar(false);
  };

  const enviar = async (cancelarReservas: boolean) => {
    setEnviado(true);
    setError(null);
    setAfectadas(null);
    if (!rangoValido || !pisoId || (alcance === 'ESPACIO' && !espacioId)) return;
    setGuardando(true);
    try {
      const creados = await adminApi.crearBloqueo({
        alcance,
        espacioId: alcance === 'ESPACIO' ? espacioId! : undefined,
        pisoId: alcance === 'PISO' ? pisoId : undefined,
        inicio,
        fin,
        motivo,
        detalle: detalle.trim(),
        cancelarReservas,
      });
      navigate('/admin/bloqueos', {
        state: { aviso: creados.cantidad === 1 ? `Bloqueaste ${creados.bloqueos[0].espacio.codigo}.` : `Bloqueaste los ${creados.cantidad} espacios del piso.` },
      });
    } catch (err) {
      const body = axios.isAxiosError(err) ? (err.response?.data as ReservasAfectadasBody | undefined) : undefined;
      if (body?.code === 'RESERVAS_AFECTADAS') setAfectadas(body);
      else setError(getApiErrorMessage(err, 'No pudimos crear el bloqueo.'));
      setGuardando(false);
    }
  };

  if (edificios.estado.tipo === 'error') return <ErrorCarga mensaje={edificios.estado.mensaje} onReintentar={edificios.recargar} />;
  const etiquetaMotivo = MOTIVOS.find((m) => m.valor === motivo)!.label;
  const titulo = detalle.trim() ? `${etiquetaMotivo} — ${detalle.trim()}` : etiquetaMotivo;

  return (
    <>
      <div className="flex flex-col gap-2">
        <Breadcrumb items={[{ label: 'Bloqueos', to: '/admin/bloqueos' }, { label: 'Nuevo' }]} />
        <h1 className="t-3xl font-semibold">Crear bloqueo</h1>
        <p className="t-sm muted">Saca un espacio o un piso entero de circulación durante un horario.</p>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[560px_1fr]">
        <form className="card" onSubmit={crear} noValidate>
          <div className="flex flex-col gap-4 p-5">
            <div className="field">
              <span className="label">Alcance</span>
              <Segmented
                label="Alcance"
                valor={alcance}
                onChange={setAlcance}
                opciones={[
                  { valor: 'ESPACIO', label: <><Icon name="map" size={14} /> Un espacio</> },
                  { valor: 'PISO', label: <><Icon name="layers" size={14} /> Piso entero</> },
                ]}
              />
              <span className="hint">«Piso entero» crea un bloqueo por cada espacio reservable del piso.</span>
            </div>

            <div className="flex flex-wrap gap-3">
              {edificios.datos ? (
                <SelectorPiso edificios={edificios.datos} edificioId={edificio?.id ?? null} pisoId={pisoId} onChange={(_, p) => setPisoId(p)} />
              ) : (
                <div className="sk h-[58px] w-full" />
              )}
            </div>

            {alcance === 'ESPACIO' && (
              <div className="field">
                <label className="label" htmlFor="blq-espacio">
                  Espacio <span className="text-rose-600">*</span>
                </label>
                <div className="input">
                  <select id="blq-espacio" value={espacioId ?? ''} onChange={(e) => setEspacioId(Number(e.target.value))}>
                    {espacios.datos?.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.codigo} · {e.tipoEtiqueta} · {e.capacidad} {e.capacidad === 1 ? 'persona' : 'personas'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-[1fr_130px] gap-3">
              <FechaInput id="blq-desde" label="Desde *" valor={fechaDesde} onChange={(f) => { setFechaDesde(f); if (f > fechaHasta) setFechaHasta(f); }} />
              <div className="field">
                <label className="label" htmlFor="blq-hora-desde">Hora</label>
                <div className="input">
                  <select id="blq-hora-desde" value={horaDesde} onChange={(e) => setHoraDesde(e.target.value)}>
                    {horas.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <FechaInput id="blq-hasta" label="Hasta *" valor={fechaHasta} onChange={setFechaHasta} />
              <div className="field">
                <label className="label" htmlFor="blq-hora-hasta">Hora</label>
                <div className={`input ${enviado && !rangoValido ? 'input-error' : ''}`}>
                  <select id="blq-hora-hasta" value={horaHasta} onChange={(e) => setHoraHasta(e.target.value)}>
                    {horas.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
            </div>
            {enviado && !rangoValido && <span className="hint-error -mt-2">El final tiene que ser posterior al comienzo.</span>}

            <div className="field">
              <span className="label">
                Motivo <span className="text-rose-600">*</span>
              </span>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Motivo">
                {MOTIVOS.map((m) => (
                  <button
                    key={m.valor}
                    type="button"
                    role="radio"
                    aria-checked={motivo === m.valor}
                    className={`chip chip-btn ${motivo === m.valor ? 'chip-on' : ''}`}
                    onClick={() => setMotivo(m.valor)}
                  >
                    <Icon name={motivo === m.valor ? 'check' : m.icono} size={14} />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="blq-detalle">Detalle</label>
              <textarea id="blq-detalle" className="textarea" maxLength={200} value={detalle} onChange={(e) => setDetalle(e.target.value)} placeholder="Demo Day · armado de sala y ensayo" />
              <span className="hint">Se ve en la agenda. En el plano el cliente solo ve «Bloqueado»; si el bloqueo cancela reservas, va en el mail de aviso.</span>
            </div>

            {error && (
              <p className="alert alert-error" role="alert">
                <Icon name="alert" size={14} className="mt-[3px]" />
                <span>{error}</span>
              </p>
            )}
            {afectadas && (
              <div className="alert alert-warn flex-col items-stretch" role="alert">
                <span className="flex gap-2">
                  <Icon name="alert" size={14} className="mt-[3px]" />
                  <span>{afectadas.message}</span>
                </span>
                <ul className="t-xs flex flex-col gap-1 pl-6">
                  {afectadas.reservas.map((r) => (
                    <li key={r.id}>
                      <b className="mono">{r.codigo}</b> · {r.espacio} · {r.cliente} · {diaMes(fechaDe(r.inicio))} {horaDe(r.inicio)}–{horaDe(r.fin)}
                    </li>
                  ))}
                </ul>
                <span className="flex justify-end gap-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAfectadas(null)} disabled={guardando}>
                    Revisar el horario
                  </button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => enviar(true)} disabled={guardando}>
                    <Icon name="ban" size={14} /> Bloquear y cancelar {afectadas.reservas.length === 1 ? 'la reserva' : `las ${afectadas.reservas.length} reservas`}
                  </button>
                </span>
              </div>
            )}
          </div>
          <div className="modal-ft rounded-b-lg">
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              <Icon name="lock" size={14} /> {guardando ? 'Creando…' : 'Crear bloqueo'}
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-4">
          <div className="card">
            <div className="card-hd">
              <h2 className="t-sm font-semibold">Cómo queda en la agenda</h2>
              <span className="t-xs muted">
                {alcance === 'PISO' ? `todo el piso` : espacio?.codigo} · {diaMes(fechaDesde)}
              </span>
            </div>
            {alcance === 'ESPACIO' && agenda.datos && edificio ? (
              <DiaVertical
                apertura={edificio.apertura}
                cierre={edificio.cierre}
                fecha={fechaDesde}
                ocupaciones={agenda.datos.ocupaciones}
                previa={rangoValido ? { inicio, fin, titulo } : null}
              />
            ) : (
              <p className="t-sm muted p-4">
                {alcance === 'PISO'
                  ? `Se crea un bloqueo en cada uno de los ${espacios.datos?.length ?? '…'} espacios del piso. Si hay reservas en ese horario, te las mostramos antes de cancelarlas.`
                  : 'Elegí un espacio para ver su día.'}
              </p>
            )}
            <p className="t-xs muted mx-4 mb-4 flex gap-2">
              <Icon name="info" size={14} className="mt-0.5 flex-none text-amber-600" />
              El bloqueo ocupa la franja igual que una reserva: nadie puede reservar{' '}
              {alcance === 'PISO' ? 'en el piso' : espacio?.codigo} entre las {horaDesde} y las {horaHasta}.
            </p>
          </div>

          <div className="card">
            <div className="card-hd">
              <h2 className="t-sm font-semibold">Cómo lo ve el cliente en el plano</h2>
            </div>
            <div className="card-bd flex gap-3">
              <div className="tile tile-sala tile-bloqueado w-[200px]">
                <i className="tile-glyph" aria-hidden="true" />
                <span className="tile-code">{alcance === 'PISO' ? 'Todo el piso' : espacio?.codigo}</span>
                <span className="tile-lbl">Bloqueado</span>
              </div>
              <p className="t-xs muted self-center">Sin motivo ni detalle: solo el estado. El espacio no se puede abrir ni reservar.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const PX_HORA = 52;

function DiaVertical({
  apertura,
  cierre,
  fecha,
  ocupaciones,
  previa,
}: {
  apertura: string;
  cierre: string;
  fecha: string;
  ocupaciones: OcupacionCalendario[];
  previa: { inicio: string; fin: string; titulo: string } | null;
}) {
  const inicio = minutos(apertura);
  const fin = minutos(cierre);
  const y = (valor: string, borde: number) => ((fechaDe(valor) === fecha ? minutosDelDia(valor) : borde) - inicio) * (PX_HORA / 60);
  const alto = ((fin - inicio) / 60) * PX_HORA;

  const bloque = (desde: string, hasta: string) => {
    const top = Math.max(0, y(desde, 0));
    return { top: top + 2, height: Math.max(22, Math.min(alto, y(hasta, 1440)) - top - 4) };
  };

  return (
    <div className="flex p-4">
      <div className="relative w-[56px] flex-none" style={{ height: alto }}>
        {Array.from({ length: (fin - inicio) / 60 + 1 }, (_, i) => (
          <span key={i} className="cal-hora absolute right-0" style={{ top: i * PX_HORA }}>
            {hhmm(inicio + i * 60)}
          </span>
        ))}
      </div>
      <div
        className="agenda-col grilla-horas grow"
        style={{ height: alto, '--px-hora': `${PX_HORA}px` } as CSSProperties}
      >
        {ocupaciones.map((o, i) => (
          <div key={i} className={`agenda-bloque ${o.tipo === 'BLOQUEO' ? 'agenda-blq' : o.estado === 'PENDIENTE' ? 'agenda-pend' : ''}`} style={bloque(o.inicio, o.fin)}>
            <span className="num block text-[10px] text-slate-600">
              {horaDe(o.inicio)} – {horaDe(o.fin)}
            </span>
            <b className="block truncate">{o.tipo === 'BLOQUEO' ? o.motivo : o.cliente}</b>
            {o.estado && <EstadoReservaBadge estado={o.estado} />}
          </div>
        ))}
        {previa && (
          <div className="agenda-bloque agenda-blq z-[2] ring-2 ring-amber-400" style={bloque(previa.inicio, previa.fin)}>
            <span className="num block text-[10px] text-slate-600">
              {horaDe(previa.inicio)} – {fechaDe(previa.fin) === fecha ? horaDe(previa.fin) : `${diaMes(fechaDe(previa.fin))} ${horaDe(previa.fin)}`}
            </span>
            <b className="block truncate">{previa.titulo}</b>
            <span className="badge b-blk badge-sm mt-1">
              <Icon name="lock" size={12} /> Bloqueo
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
