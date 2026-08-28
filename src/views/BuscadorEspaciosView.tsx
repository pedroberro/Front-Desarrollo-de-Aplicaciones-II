import { useEffect } from 'react';
import { useEspacios } from '../hooks/useEspacios';
import { EspacioCard } from '../components/espacios/EspacioCard';
import { FiltrosBusqueda } from '../components/espacios/FiltrosBusqueda';
import type { EspaciosFilters } from '../types';

export function BuscadorEspaciosView() {
  const { espacios, sedes, tipos, pagination, isLoading, error, buscar } = useEspacios();

  useEffect(() => {
    buscar({});
  }, [buscar]);

  const handleBuscar = (filters: EspaciosFilters) => {
    buscar(filters);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Espacios Disponibles</h1>

      <FiltrosBusqueda
        sedes={sedes}
        tipos={tipos}
        onBuscar={handleBuscar}
        isLoading={isLoading}
      />

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Cargando espacios...</div>
      ) : espacios.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No se encontraron espacios con los filtros seleccionados.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {espacios.map((espacio) => (
              <EspacioCard key={espacio.id} espacio={espacio} />
            ))}
          </div>

          <div className="text-sm text-gray-500 text-center">
            Mostrando {espacios.length} de {pagination.totalElements} espacios
          </div>
        </>
      )}
    </div>
  );
}
