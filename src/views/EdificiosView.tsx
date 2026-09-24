import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { catalogoApi } from '../api/catalogoApi';
import { Ilustracion } from '../components/catalogo/Ilustracion';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { EmptyState, ErrorCarga } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { useCarga } from '../hooks/useCarga';
import { etiquetaJornada, iniciales, subtituloJornada } from '../utils/catalogo';
import { LibresBadge } from './EmpresasView';

export function EdificiosView() {
  const empresaId = Number(useParams().empresaId);
  const { estado, recargar } = useCarga(() => catalogoApi.empresa(empresaId), [empresaId], 'No pudimos cargar la empresa.');
  const [busqueda, setBusqueda] = useState('');

  const edificios = useMemo(() => {
    if (estado.tipo !== 'listo') return [];
    const q = busqueda.trim().toLowerCase();
    return estado.datos.edificios.filter(
      (e) => !q || e.nombre.toLowerCase().includes(q) || `${e.direccion} ${e.localidad}`.toLowerCase().includes(q),
    );
  }, [estado, busqueda]);

  if (estado.tipo === 'error') return <ErrorCarga mensaje={estado.mensaje} onReintentar={recargar} />;

  const detalle = estado.tipo === 'listo' ? estado.datos : null;

  return (
    <>
      <Breadcrumb items={[{ label: 'Empresas', to: '/empresas' }, { label: detalle?.empresa.nombre ?? '…' }]} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="monogram static h-11 w-11">{detalle ? iniciales(detalle.empresa.nombre) : ''}</span>
          <div>
            <h1 className="t-3xl font-semibold">{detalle?.empresa.nombre ?? 'Cargando…'}</h1>
            {detalle && (
              <p className="t-sm muted">
                {detalle.empresa.rubro} · {detalle.edificios.length} {detalle.edificios.length === 1 ? 'edificio' : 'edificios'} ·{' '}
                {subtituloJornada(detalle.edificios.map((e) => e.jornada))}
              </p>
            )}
          </div>
        </div>
        <label className="input w-full sm:w-[280px]">
          <Icon name="search" className="input-icon" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre o dirección" aria-label="Buscar edificio" />
        </label>
      </div>

      {!detalle && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Cargando edificios">
          {Array.from({ length: 3 }, (_, i) => <div key={i} className="sk h-[304px]" />)}
        </div>
      )}

      {detalle && edificios.length === 0 && (
        <div className="card">
          <EmptyState icon="search" titulo="Ningún edificio coincide con la búsqueda" />
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {edificios.map((edificio, i) => (
          <Link key={edificio.id} to={`/edificios/${edificio.id}`} className="card card-link overflow-hidden">
            <Ilustracion tono={edificio.tono} variante={i + 2} etiqueta="foto del edificio" />
            <div className="flex flex-col gap-3 p-4">
              <div>
                <h2 className="t-lg font-semibold">{edificio.nombre}</h2>
                <p className="t-sm muted">
                  {edificio.direccion}, {edificio.localidad}
                </p>
              </div>
              <p className="t-sm muted flex items-center gap-2">
                <Icon name="clock" size={14} />
                <span className="num">
                  {edificio.apertura} – {edificio.cierre}
                </span>
                · lunes a viernes
              </p>
              <div className="flex items-center justify-between gap-2">
                <LibresBadge libres={edificio.espaciosLibres} cuando={etiquetaJornada([edificio.jornada])} />
                <span className="btn btn-secondary btn-sm">
                  Ver pisos <Icon name="chevRight" size={14} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
