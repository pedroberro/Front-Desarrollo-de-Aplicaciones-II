import { useState, useEffect, useCallback } from 'react';
import { espaciosApi } from '../api/espaciosApi';
import type { Espacio, EspaciosFilters, Sede, TipoEspacio } from '../types';

interface Pagination {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export function useEspacios() {
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [tipos, setTipos] = useState<TipoEspacio[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 0, size: 12, totalElements: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscar = useCallback(async (filters: EspaciosFilters = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await espaciosApi.buscar({ ...filters, size: filters.size ?? 12 });
      setEspacios(result.content);
      setPagination({
        page: result.number,
        size: result.size,
        totalElements: result.totalElements,
        totalPages: result.totalPages,
      });
    } catch {
      setError('Error al buscar espacios');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    espaciosApi.listarSedes().then(setSedes).catch(() => {});
    espaciosApi.listarTipos().then(setTipos).catch(() => {});
  }, []);

  return { espacios, sedes, tipos, pagination, isLoading, error, buscar };
}
