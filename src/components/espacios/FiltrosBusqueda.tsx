import { type FormEvent, useState } from 'react';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { EspaciosFilters, Sede, TipoEspacio } from '../../types';

interface FiltrosBusquedaProps {
  sedes: Sede[];
  tipos: TipoEspacio[];
  onBuscar: (filters: EspaciosFilters) => void;
  isLoading: boolean;
}

export function FiltrosBusqueda({ sedes, tipos, onBuscar, isLoading }: FiltrosBusquedaProps) {
  const [sede, setSede] = useState('');
  const [tipo, setTipo] = useState('');
  const [capacidad, setCapacidad] = useState('');
  const [fecha, setFecha] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onBuscar({
      sede: sede || undefined,
      tipo: tipo || undefined,
      capacidad: capacidad ? Number(capacidad) : undefined,
      fecha: fecha || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Buscar Espacios</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select
          label="Sede"
          value={sede}
          onChange={(e) => setSede(e.target.value)}
          placeholder="Todas las sedes"
          options={sedes.map((s) => ({ value: s.nombre, label: `${s.nombre} — ${s.ciudad}` }))}
        />

        <Select
          label="Tipo de espacio"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          placeholder="Todos los tipos"
          options={tipos.map((t) => ({ value: t.nombre, label: t.nombre }))}
        />

        <Input
          label="Capacidad mínima"
          type="number"
          value={capacidad}
          onChange={(e) => setCapacidad(e.target.value)}
          placeholder="Ej: 10"
          min={1}
        />

        <Input
          label="Fecha"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="submit" isLoading={isLoading}>
          Buscar
        </Button>
      </div>
    </form>
  );
}
