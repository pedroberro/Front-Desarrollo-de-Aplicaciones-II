import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { catalogoApi } from '../api/catalogoApi';
import { DetalleEspacio } from '../components/espacio/DetalleEspacio';
import { PanelEspacio } from '../components/espacio/PanelEspacio';
import { FiltrosFranja, type FiltroUI } from '../components/plano/FiltrosFranja';
import { ListaEspacios } from '../components/plano/ListaEspacios';
import { DisposicionChip, PlanoPiso, Referencias } from '../components/plano/PlanoPiso';
import { FranjaTomadaModal, ModalConfirmacion } from '../components/reservas/ModalConfirmacion';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { EmptyState, ErrorCarga } from '../components/ui/EmptyState';
import { ContadorLibres } from '../components/ui/EstadoBadge';
import { Icon } from '../components/ui/Icon';
import { Segmented } from '../components/ui/Segmented';
import { useCarga } from '../hooks/useCarga';
import { useFiltroPlano } from '../hooks/useFiltroPlano';
import type { EspacioEnPlano, Franja, FranjaTomadaBody, PlanoPiso as Plano } from '../types/reservas';
import { ICONO_COMODIDAD } from '../utils/catalogo';
import {
  fechaDe,
  fechaHora,
  horaDe,
  hhmm,
  lunesDe,
  minutosDelDia,
  minutosEntre,
  proximoHabil,
  rangoHorario,
  sumarDias,
} from '../utils/fechas';

export function PisoView() {
  const pisoId = Number(useParams().pisoId);
  const navigate = useNavigate();
  const f = useFiltroPlano();
  const plano = useCarga(() => catalogoApi.plano(pisoId, f.filtro), [pisoId, f.clave], 'No pudimos cargar el plano del piso.');
  const datos = plano.datos;

  // The server picks a slot when the URL has none; write it back so filters and URL agree.
  useEffect(() => {
    if (datos && !f.filtro.fecha) {
      f.fijarFranja(fechaDe(datos.franja.inicio), horaDe(datos.franja.inicio), horaDe(datos.franja.fin));
    }
  }, [datos, f]);

  const espacio = datos?.espacios.find((e) => e.id === f.espacioId) ?? null;
  const [semana, setSemana] = useState<string | null>(null);
  const [seleccion, setSeleccion] = useState<Franja | null>(null);
  const [version, setVersion] = useState(0);
  const [confirmando, setConfirmando] = useState(false);
  const [tomada, setTomada] = useState<{ body: FranjaTomadaBody; franja: Franja } | null>(null);

  // Opening a space starts on the week of the slot, with the slot preselected when it is free there.
  useEffect(() => {
    if (!espacio || !datos) return;
    const libreEnFranja = espacio.estado === 'LIBRE';
    const base = libreEnFranja ? datos.franja : espacio.proximoLibre;
    setSemana(lunesDe(fechaDe((base ?? datos.franja).inicio)));
    setSeleccion(base ? recortar(base, minutosEntre(datos.franja.inicio, datos.franja.fin)) : null);
    // Only when another space is opened or the slot changes, not on every reload of the plan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [espacio?.id, datos?.franja.inicio, datos?.franja.fin]);

  const detalle = useCarga(() => (f.espacioId ? catalogoApi.espacio(f.espacioId) : Promise.resolve(null)), [f.espacioId]);
  const agenda = useCarga(
    () => (f.espacioId && semana ? catalogoApi.agenda(f.espacioId, semana, sumarDias(semana, 4)) : Promise.resolve(null)),
    [f.espacioId, semana, version],
  );

  const filtroUI: FiltroUI | null = useMemo(
    () =>
      datos
        ? {
            fecha: fechaDe(datos.franja.inicio),
            desde: horaDe(datos.franja.inicio),
            hasta: horaDe(datos.franja.fin),
            tipo: f.filtro.tipo,
            capacidadMinima: f.filtro.capacidadMinima,
            ventana: f.filtro.ventana,
          }
        : null,
    [datos, f.filtro],
  );

  const refrescar = () => {
    plano.recargar();
    setVersion((v) => v + 1);
  };

  if (plano.estado.tipo === 'error') return <ErrorCarga mensaje={plano.estado.mensaje} onReintentar={plano.recargar} />;

  const abrir = (e: EspacioEnPlano) => f.setEspacio(e.id);
  const sinLibres = !!datos && datos.resumen.total > 0 && datos.resumen.libres === 0;
  const sinCoincidencias = !!datos && datos.resumen.total === 0;
  const titulo = datos ? `${f.vista === 'plano' ? 'Plano del' : 'Espacios del'} ${datos.piso.nombre.toLowerCase()}` : 'Cargando…';

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Breadcrumb
            items={[
              { label: 'Empresas', to: '/empresas' },
              { label: datos?.empresa.nombre ?? '…', to: datos ? `/empresas/${datos.empresa.id}` : undefined },
              { label: datos?.edificio.nombre ?? '…', to: datos ? `/edificios/${datos.edificio.id}` : undefined },
              { label: datos?.piso.nombre ?? '…' },
            ]}
          />
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="t-2xl font-semibold">{titulo}</h1>
            {datos && <DisposicionChip disposicion={datos.piso.disposicion} />}
          </div>
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

      {filtroUI && datos ? (
        <FiltrosFranja
          filtro={filtroUI}
          apertura={datos.edificio.apertura}
          cierre={datos.edificio.cierre}
          onChange={f.cambiarFiltro}
          onLimpiar={f.limpiar}
          resumen={<ContadorLibres libres={datos.resumen.libres} total={datos.resumen.total} />}
        />
      ) : (
        <div className="card flex gap-3 p-4" aria-busy="true" aria-label="Cargando filtros">
          {[184, 116, 116, 196, 168].map((w, i) => <div key={i} className="sk h-[58px]" style={{ width: w }} />)}
        </div>
      )}

      {sinLibres && datos && filtroUI && (
        <div className="banner-busy flex flex-wrap items-center gap-4" role="status">
          <Icon name="alert" size={20} className="text-rose-600" />
          <div className="grow">
            <p className="t-base font-semibold text-rose-700">
              No hay ningún espacio libre entre las {filtroUI.desde} y las {filtroUI.hasta}
            </p>
            <p className="t-sm text-rose-700">
              {datos.resumen.total === datos.espacios.length
                ? `Los ${datos.resumen.total} espacios del ${datos.piso.nombre.toLowerCase()} están ocupados o bloqueados en esa franja.`
                : `Los ${datos.resumen.total} espacios que cumplen los filtros están ocupados o bloqueados en esa franja.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {datos.sugerencia && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => f.cambiarFiltro({ desde: horaDe(datos.sugerencia!.inicio), hasta: horaDe(datos.sugerencia!.fin) })}>
                <Icon name="clock" size={14} /> Probar {rangoHorario(datos.sugerencia.inicio, datos.sugerencia.fin)}
              </button>
            )}
            {mejorOtroPiso(datos) && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate(`/pisos/${mejorOtroPiso(datos)!.id}?${f.query.toString()}`)}>
                <Icon name="layers" size={14} /> Ver otro piso
              </button>
            )}
            <button type="button" className="btn btn-primary btn-sm" onClick={() => f.cambiarFiltro({ fecha: proximoHabil(sumarDias(filtroUI.fecha, 1)) })}>
              <Icon name="calendar" size={14} /> Probar mañana
            </button>
          </div>
        </div>
      )}

      {!datos && <PlanoCargando />}

      {datos && sinCoincidencias && (
        <div className="card">
          <EmptyState
            icon="filter"
            titulo="Ningún espacio coincide con los filtros"
            acciones={
              <>
                {f.filtro.ventana && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => f.cambiarFiltro({ ventana: false })}>
                    Quitar «con ventana»
                  </button>
                )}
                <button type="button" className="btn btn-primary btn-sm" onClick={f.limpiar}>
                  <Icon name="x" size={14} /> Limpiar filtros
                </button>
              </>
            }
          >
            En el {datos.piso.nombre.toLowerCase()} no hay {descripcionFiltro(f.filtro.tipo, f.filtro.capacidadMinima, f.filtro.ventana)}. Probá bajar la
            capacidad mínima o quitar algún filtro.
          </EmptyState>
        </div>
      )}

      {datos && !sinCoincidencias && (
        <div className={`grid items-start gap-5 ${espacio ? 'xl:grid-cols-[minmax(0,1fr)_440px]' : 'xl:grid-cols-[minmax(0,1fr)_320px]'}`}>
          <div className="flex min-w-0 flex-col gap-5">
            {f.vista === 'plano' ? (
              <div className={`card p-4 transition-opacity ${plano.estado.tipo === 'cargando' ? 'opacity-60' : ''}`}>
                <PlanoPiso plano={datos} seleccionadoId={espacio?.id} onSeleccionar={abrir} modo="cliente" />
              </div>
            ) : (
              <ListaEspacios plano={datos} onAbrir={abrir} modo="cliente" />
            )}
            {espacio && detalle.datos && <DetalleEspacio espacio={detalle.datos} estado={espacio.estado} />}
          </div>

          <div className="flex flex-col gap-4 xl:sticky xl:top-4">
            {espacio && semana ? (
              <PanelEspacio
                espacio={espacio}
                piso={datos.piso.nombre}
                edificio={datos.edificio.nombre}
                semana={semana}
                onSemana={setSemana}
                agenda={agenda.datos ?? undefined}
                seleccion={seleccion}
                onSeleccion={setSeleccion}
                onReservar={() => setConfirmando(true)}
                onCerrar={() => f.setEspacio(null)}
              />
            ) : (
              <>
                {sinLibres && <OtrosPisos plano={datos} query={f.query.toString()} />}
                <Referencias areas={datos.areas} />
                <ComodidadesCard plano={datos} />
              </>
            )}
          </div>
        </div>
      )}

      {confirmando && espacio && seleccion && datos && (
        <ModalConfirmacion
          espacio={espacio}
          edificio={datos.edificio.nombre}
          piso={datos.piso.nombre}
          franja={seleccion}
          condiciones={datos.condiciones}
          onCerrar={() => setConfirmando(false)}
          onCreada={(reserva) =>
            navigate('/mis-reservas', {
              state: { aviso: `Reservaste ${reserva.espacio.codigo} (${reserva.codigo}). Estamos procesando el pago: en unos segundos queda confirmada.` },
            })
          }
          onTomada={(body) => {
            setConfirmando(false);
            setTomada({ body, franja: seleccion });
          }}
        />
      )}

      {tomada && espacio && (
        <FranjaTomadaModal
          codigo={espacio.codigo}
          franja={tomada.franja}
          body={tomada.body}
          onElegir={(alternativa) => {
            setSeleccion(recortar(alternativa, minutosEntre(tomada.franja.inicio, tomada.franja.fin)));
            setTomada(null);
            refrescar();
          }}
          onOtroEspacio={() => {
            setTomada(null);
            f.setEspacio(null);
            refrescar();
          }}
          onActualizar={() => {
            setTomada(null);
            setSeleccion(null);
            refrescar();
          }}
        />
      )}
    </>
  );
}

/** The same start, as long as the wanted length when it fits in the free range. */
function recortar(libre: Franja, minutosQueridos: number): Franja {
  const disponible = minutosEntre(libre.inicio, libre.fin);
  const largo = Math.min(disponible, Math.max(30, minutosQueridos), 480);
  return { inicio: libre.inicio, fin: fechaHora(fechaDe(libre.inicio), hhmm(minutosDelDia(libre.inicio) + largo)) };
}

function mejorOtroPiso(plano: Plano) {
  return [...plano.otrosPisos].sort((a, b) => b.libres - a.libres).find((p) => p.libres > 0);
}

function descripcionFiltro(tipo?: string, capacidad?: number, ventana?: boolean): string {
  const partes = [tipo ? tipo.toLowerCase().replace('sala_', 'salas de ').replace('cubiculo', 'cubículos') : 'espacios'];
  if (capacidad) partes.push(`para ${capacidad} personas`);
  if (ventana) partes.push('con ventana');
  return partes.join(' ');
}

function OtrosPisos({ plano, query }: { plano: Plano; query: string }) {
  const navigate = useNavigate();
  return (
    <div className="card">
      <div className="card-hd">
        <h2 className="t-sm font-semibold">Otros pisos en esta franja</h2>
      </div>
      <ul>
        {plano.otrosPisos.map((p) => (
          <li key={p.id} className="border-b border-slate-100 last:border-b-0">
            <button type="button" className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50" onClick={() => navigate(`/pisos/${p.id}?${query}`)}>
              <span className="t-sm font-medium">{p.nombre}</span>
              {p.libres > 0 ? (
                <span className="badge b-ok badge-sm"><i className="g-dot" /> {p.libres} libres</span>
              ) : (
                <span className="badge b-busy badge-sm"><i className="g-sq" /> Sin libres</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ComodidadesCard({ plano }: { plano: Plano }) {
  const muros = plano.piso.ventanas.map((m) => m.toLowerCase());
  return (
    <div className="card">
      <div className="card-hd">
        <h2 className="t-sm font-semibold">Comodidades del piso</h2>
      </div>
      <div className="card-bd flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {plano.piso.comodidades.map((c) => (
            <span key={c.tipo} className="chip">
              <Icon name={ICONO_COMODIDAD[c.tipo]} size={14} />
              {c.etiqueta}
            </span>
          ))}
        </div>
        {muros.length > 0 && (
          <p className="t-xs muted flex items-center gap-2">
            <span className="h-[5px] w-3.5 flex-none rounded-sm bg-sky-400" aria-hidden="true" />
            Muros con ventana ({muros.join(' y ')})
          </p>
        )}
      </div>
    </div>
  );
}

function PlanoCargando() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]" aria-busy="true" aria-label="Cargando el plano">
      <div className="card grid grid-cols-7 gap-3 p-6">
        {Array.from({ length: 14 }, (_, i) => <div key={i} className="sk h-[76px]" />)}
        <div className="sk col-span-7 h-[40px]" />
        {[3, 2, 2].map((span, i) => <div key={i} className="sk h-[100px]" style={{ gridColumn: `span ${span}` }} />)}
      </div>
      <div className="sk h-[380px]" />
    </div>
  );
}
