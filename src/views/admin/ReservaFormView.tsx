import axios from 'axios';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { catalogoApi } from '../../api/catalogoApi';
import { getApiErrorMessage } from '../../api/apiError';
import { adminApi, reservasApi } from '../../api/reservasApi';
import { BarraOcupacion } from '../../components/admin/BarraOcupacion';
import { BuscadorCliente } from '../../components/admin/BuscadorCliente';
import { SelectorPiso } from '../../components/admin/SelectorPiso';
import { haySuperposicion } from '../../components/espacio/CalendarioSemanal';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { ErrorCarga } from '../../components/ui/EmptyState';
import { EstadoReservaBadge, ETIQUETA_ESTADO_RESERVA } from '../../components/ui/EstadoBadge';
import { FechaInput } from '../../components/ui/FechaInput';
import { Icon } from '../../components/ui/Icon';
import { Segmented } from '../../components/ui/Segmented';
import { useCarga } from '../../hooks/useCarga';
import { pisoRecordado, useEdificios } from '../../hooks/useEdificios';
import type { ClienteRef, EstadoReserva, Franja, FranjaTomadaBody } from '../../types/reservas';
import { iniciales } from '../../utils/catalogo';
import { duracion, fechaCorta, fechaDe, fechaHora, horaDe, horasCada30, hoyISO, minutos, proximoHabil, rangoHorario } from '../../utils/fechas';
import { ModalCancelarAdmin } from './ReservasAdminView';

const MOTIVO_MINIMO = 10;

/** Screen 13. One form for both modes; editing someone else's booking asks why, and the customer sees it. */
export function ReservaFormView() {
  const { reservaId } = useParams();
  const id = reservaId ? Number(reservaId) : null;
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const edificios = useEdificios();
  const original = useCarga(() => (id ? reservasApi.detalle(id) : Promise.resolve(null)), [id], 'No pudimos cargar la reserva.');

  const [cliente, setCliente] = useState<ClienteRef | null>(null);
  const [pisoId, setPisoId] = useState<number | null>(null);
  const [espacioId, setEspacioId] = useState<number | null>(null);
  const [estado, setEstado] = useState<EstadoReserva>('PENDIENTE');
  const [fecha, setFecha] = useState(proximoHabil(sp.get('fecha') ?? hoyISO()));
  const [desde, setDesde] = useState('09:00');
  const [hasta, setHasta] = useState('10:00');
  const [motivo, setMotivo] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tomada, setTomada] = useState<FranjaTomadaBody | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  // Initial values: the booking being edited, or what the agenda passed in the URL.
  useEffect(() => {
    const r = original.datos;
    if (r) {
      setCliente(r.cliente);
      setPisoId(r.piso.id);
      setEspacioId(r.espacio.id);
      setEstado(r.estado);
      setFecha(fechaDe(r.inicio));
      setDesde(horaDe(r.inicio));
      setHasta(horaDe(r.fin));
    }
  }, [original.datos]);

  useEffect(() => {
    if (id || pisoId || !edificios.datos) return;
    const desdeUrl = sp.get('piso') ? Number(sp.get('piso')) : null;
    setPisoId(desdeUrl ?? pisoRecordado(edificios.datos)?.pisoId ?? null);
    if (sp.get('espacio')) setEspacioId(Number(sp.get('espacio')));
    if (sp.get('desde')) setDesde(sp.get('desde')!);
    if (sp.get('hasta')) setHasta(sp.get('hasta')!);
  }, [edificios.datos, id, pisoId, sp]);

  const espacios = useCarga(() => (pisoId ? catalogoApi.espaciosDePiso(pisoId) : Promise.resolve([])), [pisoId]);
  const agenda = useCarga(() => (espacioId ? catalogoApi.agenda(espacioId, fecha, fecha) : Promise.resolve(null)), [espacioId, fecha]);

  const edificio = edificios.datos?.find((e) => e.pisos.some((p) => p.id === pisoId)) ?? null;
  const piso = edificio?.pisos.find((p) => p.id === pisoId);
  const espacio = espacios.datos?.find((e) => e.id === espacioId) ?? null;
  const horas = edificio ? horasCada30(edificio.apertura, edificio.cierre) : horasCada30('08:00', '20:00');
  const franja: Franja | null = minutos(hasta) > minutos(desde) ? { inicio: fechaHora(fecha, desde), fin: fechaHora(fecha, hasta) } : null;
  const conflicto = !!franja && !!agenda.datos && estado !== 'CANCELADA' && haySuperposicion(agenda.datos.ocupaciones, franja, id);

  const r = original.datos;
  const hayCambios =
    !r || !franja || r.cliente.id !== cliente?.id || r.espacio.id !== espacioId || r.estado !== estado || r.inicio !== franja.inicio || r.fin !== franja.fin;

  const errores = {
    cliente: !cliente ? 'Elegí a quién es la reserva' : undefined,
    espacio: !espacioId ? 'Elegí el espacio' : undefined,
    horario: !franja ? 'El horario de fin tiene que ser posterior al de inicio' : undefined,
    motivo: id && motivo.trim().length < MOTIVO_MINIMO ? `Obligatorio al editar una reserva ajena. Mínimo ${MOTIVO_MINIMO} caracteres.` : undefined,
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviado(true);
    setError(null);
    setTomada(null);
    if (Object.values(errores).some(Boolean) || !cliente || !espacioId || !franja) return;
    setGuardando(true);
    const body = { usuarioId: cliente.id, espacioId, inicio: franja.inicio, fin: franja.fin, estado: id ? estado : undefined, motivo: motivo.trim() || undefined };
    try {
      const guardada = id ? await adminApi.actualizarReserva(id, body) : await adminApi.crearReserva(body);
      navigate('/admin/reservas', {
        state: { aviso: id ? `Guardaste los cambios de ${guardada.codigo}. ${guardada.cliente.nombre} recibe un aviso por mail.` : `Creaste la reserva ${guardada.codigo} para ${guardada.cliente.nombre}.` },
      });
    } catch (err) {
      const data = axios.isAxiosError(err) ? (err.response?.data as FranjaTomadaBody | undefined) : undefined;
      if (data?.code === 'FRANJA_OCUPADA') setTomada(data);
      else setError(getApiErrorMessage(err, 'No pudimos guardar la reserva.'));
      agenda.recargar();
      setGuardando(false);
    }
  };

  if (original.estado.tipo === 'error') return <ErrorCarga mensaje={original.estado.mensaje} onReintentar={original.recargar} />;
  if (edificios.estado.tipo === 'error') return <ErrorCarga mensaje={edificios.estado.mensaje} onReintentar={edificios.recargar} />;
  if (id && !r) return <div className="sk h-[560px]" aria-busy="true" aria-label="Cargando reserva" />;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Breadcrumb items={[{ label: 'Reservas', to: '/admin/reservas' }, { label: r ? r.codigo : 'Nueva' }]} />
          <h1 className="t-3xl font-semibold">{id ? 'Editar reserva' : 'Nueva reserva'}</h1>
        </div>
        <Segmented
          label="Modo"
          valor={id ? 'editar' : 'crear'}
          onChange={(v) => v === 'crear' && navigate('/admin/reservas/nueva')}
          opciones={[{ valor: 'crear', label: 'Crear' }, { valor: 'editar', label: 'Editar', disabled: !id }]}
        />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form className="card" onSubmit={guardar} noValidate>
          <div className="card-hd">
            <h2 className="t-sm font-semibold">Datos de la reserva</h2>
            {r && <span className="mono t-xs muted">{r.codigo}</span>}
          </div>
          <div className="flex flex-col gap-4 p-5">
            {id && (
              <div className="alert alert-warn">
                <Icon name="alert" size={14} className="mt-[3px]" />
                <span>
                  <b className="font-semibold">Estás editando una reserva de otra persona</b>
                  <br />
                  Al guardar es obligatorio indicar un motivo. Se registra junto a la reserva y el cliente lo ve en su detalle.
                </span>
              </div>
            )}

            <BuscadorCliente valor={cliente} onChange={setCliente} error={enviado ? errores.cliente : undefined} />

            <div className="flex flex-wrap gap-3">
              {edificios.datos ? (
                <SelectorPiso
                  edificios={edificios.datos}
                  edificioId={edificio?.id ?? null}
                  pisoId={pisoId}
                  onChange={(_, p) => {
                    setPisoId(p);
                    setEspacioId(null);
                  }}
                />
              ) : (
                <div className="sk h-[58px] w-full" />
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
              <div className="field">
                <label className="label" htmlFor="form-espacio">
                  Espacio <span className="text-rose-600">*</span>
                </label>
                <div className={`input ${enviado && errores.espacio ? 'input-error' : ''}`}>
                  <select id="form-espacio" value={espacioId ?? ''} onChange={(e) => setEspacioId(e.target.value ? Number(e.target.value) : null)}>
                    <option value="">Elegí un espacio</option>
                    {espacios.datos?.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.codigo} · {e.tipoEtiqueta} · {e.capacidad} {e.capacidad === 1 ? 'persona' : 'personas'}
                      </option>
                    ))}
                  </select>
                </div>
                {enviado && errores.espacio && <span className="hint-error">{errores.espacio}</span>}
              </div>
              <div className="field">
                <label className="label" htmlFor="form-estado">Estado</label>
                <div className="input">
                  <select id="form-estado" value={estado} disabled={!id} onChange={(e) => setEstado(e.target.value as EstadoReserva)}>
                    {(['PENDIENTE', 'CONFIRMADA', 'CANCELADA'] as const).map((e) => (
                      <option key={e} value={e}>{ETIQUETA_ESTADO_RESERVA[e]}</option>
                    ))}
                  </select>
                </div>
                {!id && <span className="hint">Toda reserva nueva nace pendiente</span>}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_150px_150px_150px]">
              <FechaInput id="form-fecha" label="Fecha *" valor={fecha} onChange={setFecha} />
              <div className="field">
                <label className="label" htmlFor="form-desde">Desde</label>
                <div className="input">
                  <Icon name="clock" className="input-icon" />
                  <select id="form-desde" value={desde} onChange={(e) => setDesde(e.target.value)}>
                    {horas.slice(0, -1).map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label className="label" htmlFor="form-hasta">Hasta</label>
                <div className={`input ${enviado && errores.horario ? 'input-error' : ''}`}>
                  <select id="form-hasta" value={hasta} onChange={(e) => setHasta(e.target.value)}>
                    {horas.slice(1).map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <span className="label">Duración</span>
                <div className="input bg-slate-50 text-slate-500">{franja ? duracion(minutos(hasta) - minutos(desde)) : '—'}</div>
              </div>
            </div>
            {enviado && errores.horario && <span className="hint-error -mt-2">{errores.horario}</span>}

            {id && (
              <div className="field">
                <label className="label" htmlFor="form-motivo">
                  Motivo del cambio <span className="text-rose-600">*</span>
                </label>
                <textarea
                  id="form-motivo"
                  className={`textarea ${enviado && errores.motivo ? 'textarea-error' : ''}`}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Por ejemplo: se adelanta la reunión de equipo por pedido del cliente"
                />
                <span className={enviado && errores.motivo ? 'hint-error' : 'hint'}>
                  Obligatorio al editar una reserva que no es tuya. Mínimo {MOTIVO_MINIMO} caracteres.
                </span>
              </div>
            )}

            {error && (
              <p className="alert alert-error" role="alert">
                <Icon name="alert" size={14} className="mt-[3px]" />
                <span>{error}</span>
              </p>
            )}
            {tomada && (
              <div className="alert alert-error flex-col" role="alert">
                <span>{tomada.message}</span>
                {tomada.alternativas.length > 0 && (
                  <span className="flex flex-wrap items-center gap-2">
                    Libres cerca:
                    {tomada.alternativas.map((a) => (
                      <button
                        key={a.inicio}
                        type="button"
                        className="chip-ok px-2.5"
                        onClick={() => {
                          const largo = Math.min(minutos(hasta) - minutos(desde), minutos(horaDe(a.fin)) - minutos(horaDe(a.inicio)));
                          setDesde(horaDe(a.inicio));
                          setHasta(horas.find((h) => minutos(h) === minutos(horaDe(a.inicio)) + largo) ?? horaDe(a.fin));
                          setTomada(null);
                        }}
                      >
                        <span className="num">{rangoHorario(a.inicio, a.fin)}</span>
                      </button>
                    ))}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 px-5 py-4">
            {r?.cancelable && (
              <button type="button" className="btn btn-danger" onClick={() => setCancelando(true)}>
                <Icon name="ban" size={14} /> Cancelar reserva
              </button>
            )}
            <span className="grow" />
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
              Descartar
            </button>
            <button type="submit" className="btn btn-primary" disabled={guardando || (!!id && !hayCambios)}>
              {guardando ? 'Guardando…' : id ? 'Guardar cambios' : 'Crear reserva'}
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-4">
          <div className="card">
            <div className="card-hd">
              <h2 className="t-sm font-semibold">Resumen</h2>
              <EstadoReservaBadge estado={id ? estado : 'PENDIENTE'} />
            </div>
            <div className="card-bd flex flex-col gap-3">
              {cliente ? (
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <span className="avatar avatar-lg">{iniciales(cliente.nombre)}</span>
                  <span className="flex flex-col">
                    <b className="t-sm font-semibold">{cliente.nombre}</b>
                    <span className="t-xs muted">{cliente.email}</span>
                  </span>
                </div>
              ) : (
                <p className="t-sm muted border-b border-slate-100 pb-3">Todavía no elegiste el cliente.</p>
              )}
              <p className="t-sm flex items-center gap-2.5">
                <Icon name="building" className="text-slate-400" /> {edificio?.nombre ?? '—'} · {piso?.nombre ?? '—'}
              </p>
              <p className="t-sm flex items-center gap-2.5">
                <Icon name="map" className="text-slate-400" /> <b className="mono">{espacio?.codigo ?? '—'}</b>
                {espacio && <span className="muted">· {espacio.capacidad} {espacio.capacidad === 1 ? 'persona' : 'personas'}</span>}
              </p>
              <p className="t-sm flex items-center gap-2.5">
                <Icon name="calendar" className="text-slate-400" /> {fechaCorta(fecha, false)} · <span className="num">{desde} – {hasta}</span>
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-hd">
              <h2 className="t-sm font-semibold">Ocupación de {espacio?.codigo ?? 'el espacio'} ese día</h2>
            </div>
            <div className="card-bd flex flex-col gap-2">
              {agenda.datos && edificio ? (
                <>
                  <BarraOcupacion
                    apertura={edificio.apertura}
                    cierre={edificio.cierre}
                    fecha={fecha}
                    ocupaciones={agenda.datos.ocupaciones.filter((o) => o.reservaId !== id)}
                    esta={franja}
                    conflicto={conflicto}
                  />
                  <p className={`t-xs ${conflicto ? 'text-rose-600' : 'muted'}`}>
                    {conflicto
                      ? 'La franja elegida se superpone con otra reserva o un bloqueo: al guardar se va a rechazar.'
                      : 'La franja elegida no se superpone con otra reserva ni con un bloqueo.'}
                  </p>
                </>
              ) : (
                <p className="t-sm muted">Elegí un espacio para ver su día.</p>
              )}
            </div>
          </div>

          {!id && (
            <div className="rounded-lg border border-dashed border-slate-300 p-4">
              <h3 className="t-sm font-semibold">Reserva a nombre de un cliente</h3>
              <p className="t-xs muted mt-1">
                Para pedidos que llegan por teléfono o por mail. Queda <b>Pendiente</b> y el cliente recibe un aviso; se valida contra el mismo motor de
                disponibilidad que usa el cliente.
              </p>
            </div>
          )}
        </div>
      </div>

      {cancelando && r && (
        <ModalCancelarAdmin
          reserva={r}
          onCerrar={() => setCancelando(false)}
          onListo={() => navigate('/admin/reservas', { state: { aviso: `Cancelaste la reserva ${r.codigo}.` } })}
        />
      )}
    </>
  );
}
