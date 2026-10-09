import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { catalogoApi } from '../../api/catalogoApi';
import { getApiErrorMessage } from '../../api/apiError';
import { adminApi, reservasApi } from '../../api/reservasApi';
import { SelectorPiso } from '../../components/admin/SelectorPiso';
import { CalendarioSemanal, haySuperposicion } from '../../components/espacio/CalendarioSemanal';
import { CabeceraEspacio, diasHabiles, NavegadorSemana } from '../../components/espacio/PanelEspacio';
import { FiltrosFranja } from '../../components/plano/FiltrosFranja';
import { ListaEspacios } from '../../components/plano/ListaEspacios';
import { PlanoPiso, Referencias } from '../../components/plano/PlanoPiso';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { ErrorCarga } from '../../components/ui/EmptyState';
import { EstadoReservaBadge } from '../../components/ui/EstadoBadge';
import { Icon } from '../../components/ui/Icon';
import { Modal } from '../../components/ui/Modal';
import { Segmented } from '../../components/ui/Segmented';
import { useCarga } from '../../hooks/useCarga';
import { recordarPiso, useEdificios } from '../../hooks/useEdificios';
import { useFiltroPlano } from '../../hooks/useFiltroPlano';
import type { EspacioEnPlano, Franja, OcupacionCalendario, Reserva } from '../../types/reservas';
import { iniciales } from '../../utils/catalogo';
import { fechaDe, fechaLarga, horaDe, lunesDe, rangoHorario, sumarDias } from '../../utils/fechas';

/** Screen 12: the plan from above. The administrator opens any space, and moves or deletes bookings. */
export function AdminPlanoView() {
  const pisoId = Number(useParams().pisoId);
  const navigate = useNavigate();
  const f = useFiltroPlano();
  const edificios = useEdificios();
  const plano = useCarga(() => catalogoApi.plano(pisoId, f.filtro), [pisoId, f.clave], 'No pudimos cargar el plano del piso.');
  const datos = plano.datos;

  useEffect(() => {
    recordarPiso(pisoId);
  }, [pisoId]);

  useEffect(() => {
    if (datos && !f.filtro.fecha) f.fijarFranja(fechaDe(datos.franja.inicio), horaDe(datos.franja.inicio), horaDe(datos.franja.fin));
  }, [datos, f]);

  const espacio = datos?.espacios.find((e) => e.id === f.espacioId) ?? null;
  const [semana, setSemana] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [editando, setEditando] = useState<Reserva | null>(null);
  const [nueva, setNueva] = useState<Franja | null>(null);
  const [eliminando, setEliminando] = useState<Reserva | null>(null);

  useEffect(() => {
    if (datos) setSemana(lunesDe(fechaDe(datos.franja.inicio)));
    setEditando(null);
    setNueva(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [espacio?.id, datos?.franja.inicio]);

  const agenda = useCarga(
    () => (f.espacioId && semana ? catalogoApi.agenda(f.espacioId, semana, sumarDias(semana, 4)) : Promise.resolve(null)),
    [f.espacioId, semana, version],
  );
  const fecha = datos ? fechaDe(datos.franja.inicio) : null;
  const delDia = useCarga(
    () => (f.espacioId && fecha ? adminApi.reservas({ espacioId: f.espacioId, desde: fecha, hasta: fecha, size: 50 }) : Promise.resolve(null)),
    [f.espacioId, fecha, version],
  );

  const refrescar = () => {
    plano.recargar();
    setVersion((v) => v + 1);
  };

  const editar = async (reservaId: number) => {
    const r = await reservasApi.detalle(reservaId);
    setNueva(null);
    setEditando(r);
    setSemana(lunesDe(fechaDe(r.inicio)));
  };

  if (plano.estado.tipo === 'error') return <ErrorCarga mensaje={plano.estado.mensaje} onReintentar={plano.recargar} />;

  const edificio = edificios.datos?.find((e) => e.pisos.some((p) => p.id === pisoId));
  const abrir = (e: EspacioEnPlano) => f.setEspacio(e.id);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Breadcrumb
            items={[
              { label: 'Agenda del día', to: `/admin/agenda?piso=${pisoId}${fecha ? `&fecha=${fecha}` : ''}` },
              { label: datos?.edificio.nombre ?? '…' },
              { label: datos?.piso.nombre ?? '…' },
            ]}
          />
          <h1 className="t-2xl font-semibold">{datos ? `Plano del ${datos.piso.nombre.toLowerCase()} · vista administrador` : 'Cargando…'}</h1>
        </div>
        <Segmented
          label="Vista"
          valor={f.vista}
          onChange={f.setVista}
          opciones={[
            { valor: 'plano', label: <><Icon name="map" size={14} /> Plano</> },
            { valor: 'lista', label: <><Icon name="list" size={14} /> Lista</> },
          ]}
        />
      </div>

      {datos && fecha && (
        <FiltrosFranja
          filtro={{ fecha, desde: horaDe(datos.franja.inicio), hasta: horaDe(datos.franja.fin) }}
          apertura={datos.edificio.apertura}
          cierre={datos.edificio.cierre}
          onChange={f.cambiarFiltro}
          onLimpiar={f.limpiar}
          soloFranja
          antes={
            edificios.datos && (
              <SelectorPiso
                edificios={edificios.datos}
                edificioId={edificio?.id ?? null}
                pisoId={pisoId}
                onChange={(_, p) => navigate(`/admin/pisos/${p}?fecha=${fecha}&desde=${horaDe(datos.franja.inicio)}&hasta=${horaDe(datos.franja.fin)}`)}
              />
            )
          }
          resumen={
            <>
              <span className="badge b-busy"><i className="g-sq" /> {datos.resumen.ocupados} ocupados</span>
              <span className="badge b-blk"><i className="g-tri" /> {datos.resumen.bloqueados} {datos.resumen.bloqueados === 1 ? 'bloqueado' : 'bloqueados'}</span>
            </>
          }
          acciones={
            <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate(`/admin/reservas/nueva?piso=${pisoId}&fecha=${fecha}`)}>
              <Icon name="plus" size={14} /> Nueva reserva
            </button>
          }
        />
      )}

      {!datos && <div className="sk h-[620px]" aria-busy="true" aria-label="Cargando el plano" />}

      {datos && (
        <div className={`grid items-start gap-5 ${espacio ? 'xl:grid-cols-[minmax(0,1fr)_440px]' : 'xl:grid-cols-[minmax(0,1fr)_320px]'}`}>
          <div className="flex min-w-0 flex-col gap-5">
            {f.vista === 'plano' ? (
              <div className={`card p-4 ${plano.estado.tipo === 'cargando' ? 'opacity-60' : ''}`}>
                <PlanoPiso plano={datos} seleccionadoId={espacio?.id} onSeleccionar={abrir} modo="admin" />
                <p className="t-xs muted mt-3 flex items-center gap-2">
                  <Icon name="info" size={14} />
                  <span>
                    El admin puede hacer clic en cualquier espacio, también en los <b>ocupados</b> y los <b>bloqueados</b>. El cliente, en cambio, solo abre
                    los libres.
                  </span>
                </p>
              </div>
            ) : (
              <ListaEspacios plano={datos} onAbrir={abrir} modo="admin" />
            )}

            {espacio && fecha && (
              <section className="card">
                <div className="card-hd">
                  <h2 className="t-sm font-semibold">
                    Reservas de <span className="mono">{espacio.codigo}</span> <span className="muted font-normal">{fechaLarga(fecha, false)}</span>
                  </h2>
                  <span className="t-xs muted">Ordenadas por hora de inicio</span>
                </div>
                <div className="flex flex-col gap-2 p-4">
                  {!delDia.datos && <div className="sk h-[56px]" />}
                  {delDia.datos?.content.length === 0 && <p className="t-sm muted">Sin reservas ese día.</p>}
                  {delDia.datos?.content.map((r) => (
                    <div key={r.id} className={`flex flex-wrap items-center gap-4 rounded-lg border px-4 py-3 ${editando?.id === r.id ? 'border-accent-200 bg-accent-50' : 'border-slate-200'}`}>
                      <b className="mono w-[76px]">{r.codigo}</b>
                      <span className="flex min-w-[160px] grow items-center gap-2">
                        <span className="avatar">{iniciales(r.cliente.nombre)}</span>
                        {r.cliente.nombre}
                      </span>
                      <span className="num t-sm w-[110px] font-medium">{rangoHorario(r.inicio, r.fin)}</span>
                      {editando?.id === r.id ? (
                        <span className="badge b-accent badge-sm"><Icon name="pencil" size={12} /> Editando</span>
                      ) : (
                        <EstadoReservaBadge estado={r.estado} />
                      )}
                      <span className="ml-auto flex gap-1.5">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => editar(r.id)} disabled={r.estado === 'FINALIZADA' || r.estado === 'CANCELADA'}>
                          <Icon name="pencil" size={14} /> Editar
                        </button>
                        <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => setEliminando(r)} aria-label={`Eliminar ${r.codigo}`}>
                          <Icon name="trash" size={14} />
                        </button>
                      </span>
                    </div>
                  ))}
                  <p className="t-xs muted">Editar abre la reserva en el panel de la derecha. El tacho pide confirmación antes de borrar.</p>
                </div>
              </section>
            )}
          </div>

          <div className="flex flex-col gap-4 xl:sticky xl:top-4">
            {espacio && semana ? (
              <PanelAdminEspacio
                espacio={espacio}
                piso={datos.piso.nombre}
                edificio={datos.edificio.nombre}
                franjaFiltro={datos.franja}
                semana={semana}
                onSemana={setSemana}
                ocupaciones={agenda.datos?.ocupaciones}
                apertura={datos.edificio.apertura}
                cierre={datos.edificio.cierre}
                ahora={agenda.datos?.ahora}
                editando={editando}
                nueva={nueva}
                onNueva={setNueva}
                onEditar={editar}
                onDescartar={() => setEditando(null)}
                onGuardado={() => {
                  setEditando(null);
                  refrescar();
                }}
                onEliminar={() => editando && setEliminando(editando)}
                onCrear={(franja) =>
                  navigate(
                    `/admin/reservas/nueva?piso=${pisoId}&espacio=${espacio.id}&fecha=${fechaDe(franja.inicio)}&desde=${horaDe(franja.inicio)}&hasta=${horaDe(franja.fin)}`,
                  )
                }
                onCerrar={() => f.setEspacio(null)}
              />
            ) : (
              <Referencias />
            )}
          </div>
        </div>
      )}

      {eliminando && (
        <ModalEliminarReserva
          reserva={eliminando}
          onCerrar={() => setEliminando(null)}
          onEliminada={() => {
            setEliminando(null);
            setEditando(null);
            refrescar();
          }}
        />
      )}
    </>
  );
}

interface PanelAdminEspacioProps {
  espacio: EspacioEnPlano;
  piso: string;
  edificio: string;
  franjaFiltro: Franja;
  semana: string;
  onSemana: (lunes: string) => void;
  ocupaciones: OcupacionCalendario[] | undefined;
  apertura: string;
  cierre: string;
  ahora: string | undefined;
  editando: Reserva | null;
  nueva: Franja | null;
  onNueva: (f: Franja | null) => void;
  onEditar: (reservaId: number) => void;
  onDescartar: () => void;
  onGuardado: () => void;
  onEliminar: () => void;
  onCrear: (f: Franja) => void;
  onCerrar: () => void;
}

function PanelAdminEspacio(p: PanelAdminEspacioProps) {
  const [franja, setFranja] = useState<Franja | null>(null);
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setFranja(p.editando ? { inicio: p.editando.inicio, fin: p.editando.fin } : null);
    setMotivo('');
    setError(null);
  }, [p.editando]);

  // The booking that makes the space busy in the slot the plan is showing.
  const actual = p.ocupaciones?.find((o) => o.tipo === 'RESERVA' && o.inicio < p.franjaFiltro.fin && p.franjaFiltro.inicio < o.fin);
  const conflicto = !!franja && !!p.ocupaciones && haySuperposicion(p.ocupaciones, franja, p.editando?.id);
  const movida = !!franja && !!p.editando && (franja.inicio !== p.editando.inicio || franja.fin !== p.editando.fin);

  const guardar = async () => {
    if (!p.editando || !franja) return;
    setGuardando(true);
    setError(null);
    try {
      await adminApi.actualizarReserva(p.editando.id, {
        usuarioId: p.editando.cliente.id,
        espacioId: p.editando.espacio.id,
        inicio: franja.inicio,
        fin: franja.fin,
        estado: p.editando.estado,
        motivo: motivo.trim(),
      });
      p.onGuardado();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No pudimos mover la reserva.'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <aside className="card flex flex-col" aria-label={`Gestión de ${p.espacio.codigo}`}>
      <CabeceraEspacio espacio={p.espacio} piso={p.piso} edificio={p.edificio} onCerrar={p.onCerrar}>
        {actual && actual.cliente && (
          <button
            type="button"
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:border-accent-200"
            onClick={() => actual.reservaId && p.onEditar(actual.reservaId)}
          >
            <span className="avatar avatar-lg">{iniciales(actual.cliente)}</span>
            <span className="flex grow flex-col">
              <b className="t-sm font-semibold">
                {actual.cliente} <span className="mono t-xs muted font-normal">{actual.codigo}</span>
              </b>
              <span className="t-xs muted">{rangoHorario(actual.inicio, actual.fin)}</span>
            </span>
            {actual.estado && <EstadoReservaBadge estado={actual.estado} />}
          </button>
        )}
      </CabeceraEspacio>

      <NavegadorSemana semana={p.semana} onSemana={p.onSemana} />
      <div className="px-4 pb-2">
        {p.ocupaciones && p.ahora ? (
          <CalendarioSemanal
            dias={diasHabiles(p.semana)}
            apertura={p.apertura}
            cierre={p.cierre}
            ocupaciones={p.ocupaciones}
            ahora={p.ahora}
            modo={p.editando ? 'editar' : 'seleccionar'}
            seleccion={p.editando ? franja : p.nueva}
            onSeleccion={p.editando ? setFranja : p.onNueva}
            original={p.editando ? { inicio: p.editando.inicio, fin: p.editando.fin } : null}
            reservaEditada={p.editando?.id}
            onElegirOcupacion={(o) => o.reservaId && p.onEditar(o.reservaId)}
          />
        ) : (
          <div className="sk h-[520px]" />
        )}
        <p className="t-xs muted mt-2 flex items-center gap-1.5">
          <Icon name="drag" size={14} />
          {p.editando ? 'Arrastrá el bloque para mover la reserva · tirá de las manijas para cambiar la duración' : 'Clic en una reserva para editarla · arrastrá sobre celdas libres para crear una'}
        </p>
      </div>

      {p.editando && franja ? (
        <div className="flex flex-col gap-3 border-t border-slate-200 p-4">
          <div className="flex items-end justify-between gap-2">
            <div>
              <span className="t-xs muted">Horario</span>
              <p className="t-sm num flex items-center gap-2">
                {movida && <s className="text-slate-500">{rangoHorario(p.editando.inicio, p.editando.fin)}</s>}
                {movida && <Icon name="chevRight" size={12} className="text-slate-400" />}
                <b className="text-accent-700">
                  {fechaDe(franja.inicio) !== fechaDe(p.editando.inicio) ? `${fechaLarga(fechaDe(franja.inicio), false)}, ` : ''}
                  {rangoHorario(franja.inicio, franja.fin)}
                </b>
              </p>
            </div>
            {conflicto ? (
              <span className="badge b-busy badge-sm"><Icon name="alert" size={12} /> Se superpone</span>
            ) : (
              <span className="badge b-accent badge-sm"><Icon name="check" size={12} /> Sin superposición</span>
            )}
          </div>
          <div className="field">
            <label className="label" htmlFor="motivo-mover">
              Motivo del cambio <span className="text-rose-600">*</span>
            </label>
            <textarea id="motivo-mover" className="textarea min-h-[60px]" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Se corre una hora por el armado del Demo Day." />
          </div>
          {error && <p className="alert alert-error" role="alert">{error}</p>}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn btn-secondary btn-lg" onClick={p.onDescartar}>
              Descartar
            </button>
            <button type="button" className="btn btn-primary btn-lg" onClick={guardar} disabled={!movida || conflicto || motivo.trim().length < 10 || guardando}>
              {guardando ? 'Guardando…' : 'Guardar horario'}
            </button>
          </div>
          <button type="button" className="btn btn-danger btn-lg w-full" onClick={p.onEliminar}>
            <Icon name="trash" size={14} /> Eliminar reserva
          </button>
        </div>
      ) : p.nueva ? (
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 p-4">
          <p className="t-sm">
            <b>{fechaLarga(fechaDe(p.nueva.inicio), false)}</b> · <span className="num">{rangoHorario(p.nueva.inicio, p.nueva.fin)}</span>
          </p>
          <button type="button" className="btn btn-primary" onClick={() => p.onCrear(p.nueva!)}>
            <Icon name="plus" size={14} /> Reservar para un cliente
          </button>
        </div>
      ) : null}
    </aside>
  );
}

function ModalEliminarReserva({ reserva, onCerrar, onEliminada }: { reserva: Reserva; onCerrar: () => void; onEliminada: () => void }) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eliminar = async () => {
    setEnviando(true);
    try {
      await adminApi.eliminarReserva(reserva.id);
      onEliminada();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No pudimos eliminar la reserva.'));
      setEnviando(false);
    }
  };

  return (
    <Modal
      title={`Eliminar la reserva ${reserva.codigo}`}
      onClose={onCerrar}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </button>
          <button type="button" className="btn btn-danger-solid" onClick={eliminar} disabled={enviando}>
            <Icon name="trash" size={14} /> {enviando ? 'Eliminando…' : 'Eliminar reserva'}
          </button>
        </>
      }
    >
      <div className="flex gap-3">
        <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-rose-50 text-rose-600">
          <Icon name="trash" />
        </span>
        <p className="t-sm muted">
          {reserva.espacio.codigo} · {fechaLarga(fechaDe(reserva.inicio), false)}, {rangoHorario(reserva.inicio, reserva.fin)} · {reserva.cliente.nombre}. La
          franja queda libre y la reserva desaparece de la agenda.
        </p>
      </div>
      <p className="alert alert-warn">
        <Icon name="alert" size={14} className="mt-[3px]" />
        <span>
          No se puede deshacer. Si solo querés liberar la franja sin borrar el registro, cambiá el estado a <b>Cancelada</b> desde el formulario.
        </span>
      </p>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
    </Modal>
  );
}
