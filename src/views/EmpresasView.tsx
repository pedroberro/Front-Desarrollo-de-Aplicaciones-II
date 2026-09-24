import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { catalogoApi } from '../api/catalogoApi';
import { Ilustracion } from '../components/catalogo/Ilustracion';
import { EmptyState, ErrorCarga } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { useCarga } from '../hooks/useCarga';
import { etiquetaJornada, iniciales, subtituloJornada } from '../utils/catalogo';

export function EmpresasView() {
  const { estado, recargar } = useCarga(() => catalogoApi.empresas(), [], 'No pudimos cargar las empresas.');
  const [busqueda, setBusqueda] = useState('');

  const empresas = useMemo(() => {
    if (estado.tipo !== 'listo') return [];
    const q = busqueda.trim().toLowerCase();
    return estado.datos.filter((e) => !q || e.nombre.toLowerCase().includes(q) || e.rubro.toLowerCase().includes(q));
  }, [estado, busqueda]);

  const jornadas = estado.tipo === 'listo' ? estado.datos.flatMap((e) => e.jornadas) : [];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="t-3xl font-semibold">Empresas</h1>
          <p className="t-sm muted">
            {estado.tipo === 'listo' ? `${estado.datos.length} empresas · ${subtituloJornada(jornadas)}` : 'Elegí dónde querés trabajar'}
          </p>
        </div>
        <label className="input w-full sm:w-[280px]">
          <Icon name="search" className="input-icon" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre o rubro" aria-label="Buscar empresa" />
        </label>
      </div>

      {estado.tipo === 'error' && <ErrorCarga mensaje={estado.mensaje} onReintentar={recargar} />}

      {estado.tipo === 'cargando' && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Cargando empresas">
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="sk h-[316px]" />)}
        </div>
      )}

      {estado.tipo === 'listo' && empresas.length === 0 && (
        <div className="card">
          <EmptyState icon="search" titulo="Ninguna empresa coincide con la búsqueda">
            Probá con otro nombre o con el rubro, por ejemplo «software».
          </EmptyState>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {empresas.map((empresa, i) => (
          <Link key={empresa.id} to={`/empresas/${empresa.id}`} className="card card-link overflow-hidden">
            <div className="relative">
              <Ilustracion tono={empresa.tono} variante={i} etiqueta="foto de la empresa" />
              <span className="monogram">{iniciales(empresa.nombre)}</span>
            </div>
            <div className="flex flex-col gap-3 px-4 pb-4 pt-9">
              <div>
                <h2 className="t-lg font-semibold">{empresa.nombre}</h2>
                <p className="t-sm muted">{empresa.rubro}</p>
              </div>
              <p className="t-sm muted flex items-center gap-2">
                <Icon name="building" size={14} />
                {empresa.edificios} {empresa.edificios === 1 ? 'edificio' : 'edificios'} · {empresa.localidades.join(' · ')}
              </p>
              <div className="flex items-center justify-between gap-2">
                <LibresBadge libres={empresa.espaciosLibres} cuando={etiquetaJornada(empresa.jornadas)} />
                <span className="btn btn-secondary btn-sm">
                  Ver edificios <Icon name="chevRight" size={14} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

export function LibresBadge({ libres, cuando, sufijo = 'espacios libres' }: { libres: number; cuando: string; sufijo?: string }) {
  return libres > 0 ? (
    <span className="badge b-ok badge-sm">
      <i className="g-dot" aria-hidden="true" />
      <span className="num">{libres}</span> {sufijo} {cuando}
    </span>
  ) : (
    <span className="badge b-busy badge-sm">
      <i className="g-sq" aria-hidden="true" />
      Sin espacios libres {cuando}
    </span>
  );
}
