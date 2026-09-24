import { useNavigate, useParams } from 'react-router-dom';
import { catalogoApi } from '../api/catalogoApi';
import { Ilustracion } from '../components/catalogo/Ilustracion';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { ErrorCarga } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { useCarga } from '../hooks/useCarga';
import { ICONO_COMODIDAD, nombrePiso } from '../utils/catalogo';
import { fechaCorta, fechaDe, horaDe, hoyISO } from '../utils/fechas';

export function PisosView() {
  const edificioId = Number(useParams().edificioId);
  const navigate = useNavigate();
  const { estado, recargar } = useCarga(() => catalogoApi.edificio(edificioId), [edificioId], 'No pudimos cargar el edificio.');

  if (estado.tipo === 'error') return <ErrorCarga mensaje={estado.mensaje} onReintentar={recargar} />;
  const d = estado.tipo === 'listo' ? estado.datos : null;

  // While open the counters are "now"; when closed they refer to the first half hour after opening.
  const cuando = !d ? '' : d.abiertoAhora ? 'ahora' : 'al abrir';
  const apertura = d && !d.abiertoAhora
    ? `${fechaDe(d.franja.inicio) === hoyISO() ? 'hoy' : fechaCorta(fechaDe(d.franja.inicio), false)} a las ${horaDe(d.franja.inicio)}`
    : '';

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Empresas', to: '/empresas' },
          { label: d?.empresa.nombre ?? '…', to: d ? `/empresas/${d.empresa.id}` : undefined },
          { label: d?.edificio.nombre ?? '…' },
        ]}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[400px_1fr]">
        {d ? (
          <div className="card overflow-hidden">
            <Ilustracion tono={d.edificio.tono} etiqueta="foto del edificio" />
            <div className="flex flex-col gap-3 p-4">
              <div>
                <h1 className="t-2xl font-semibold">{d.edificio.nombre}</h1>
                <p className="t-sm muted">
                  {d.edificio.direccion}, {d.edificio.localidad}
                </p>
              </div>
              <hr className="border-slate-200" />
              <ul className="t-sm flex flex-col gap-2.5 text-slate-700">
                <li className="flex items-center gap-2.5">
                  <Icon name="clock" className="text-slate-500" />
                  {d.abiertoAhora ? 'Abierto' : 'Cerrado ahora · abre de'}{' '}
                  <span className="num">
                    {d.edificio.apertura} – {d.edificio.cierre}
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Icon name="layers" className="text-slate-500" />
                  {d.pisos.length} pisos · {d.edificio.espacios} espacios reservables
                </li>
                <li className="flex items-center gap-2.5">
                  <Icon name="check" className={d.libres > 0 ? 'text-emerald-600' : 'text-rose-600'} />
                  {d.abiertoAhora ? `${d.libres} libres en este momento` : `${d.libres} libres al abrir, ${apertura}`}
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="sk h-[390px]" aria-busy="true" aria-label="Cargando edificio" />
        )}

        <section className="flex flex-col gap-3" aria-labelledby="titulo-pisos">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="titulo-pisos" className="t-lg font-semibold">Elegí un piso</h2>
            <span className="t-xs muted">de arriba hacia abajo, como el edificio</span>
          </div>
          <div className="roof mx-[2%]" aria-hidden="true" />
          <div className="card overflow-hidden">
            {!d && Array.from({ length: 5 }, (_, i) => <div key={i} className="sk m-3 h-[64px]" />)}
            {d?.pisos.map((piso) => (
              <button key={piso.id} type="button" className="floor-row" onClick={() => navigate(`/pisos/${piso.id}`)}>
                <span className="floor-num py-4">
                  <b className="t-2xl font-semibold">{nombrePiso(piso.numero)}</b>
                  <span className="t-xs">piso</span>
                </span>
                <span className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <span className="flex min-w-0 grow flex-col gap-2">
                    <span className="flex flex-wrap items-baseline gap-2">
                      <b className="t-lg font-semibold">{piso.nombre}</b>
                      <span className="t-sm muted">
                        {piso.espacios} espacios · {piso.cubiculos} cubículos, {piso.salas} {piso.salas === 1 ? 'sala' : 'salas'}
                      </span>
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      {piso.comodidades.map((c) => (
                        <span key={c.tipo} className="chip">
                          <Icon name={ICONO_COMODIDAD[c.tipo]} size={14} />
                          {c.etiqueta}
                        </span>
                      ))}
                    </span>
                  </span>
                  {piso.libres > 0 ? (
                    <span className="badge b-ok badge-sm">
                      <i className="g-dot" aria-hidden="true" />
                      <span className="num">{piso.libres}</span> libres {cuando}
                    </span>
                  ) : (
                    <span className="badge b-busy badge-sm">
                      <i className="g-sq" aria-hidden="true" />
                      Sin espacios libres
                    </span>
                  )}
                  <Icon name="chevRight" className="text-slate-400" />
                </span>
              </button>
            ))}
          </div>
          <div className="street" aria-hidden="true" />
          <p className="t-xs muted text-center">Nivel de calle</p>
        </section>
      </div>
    </>
  );
}
