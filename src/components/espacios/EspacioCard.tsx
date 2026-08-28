import type { Espacio } from '../../types';
import { Card, CardBody } from '../ui/Card';

interface EspacioCardProps {
  espacio: Espacio;
}

export function EspacioCard({ espacio }: EspacioCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      {espacio.imagenUrl && (
        <img
          src={espacio.imagenUrl}
          alt={espacio.nombre}
          className="w-full h-48 object-cover"
        />
      )}
      <CardBody>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{espacio.nombre}</h3>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              espacio.disponible
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {espacio.disponible ? 'Disponible' : 'Ocupado'}
          </span>
        </div>

        <p className="text-sm text-gray-500 mb-1">{espacio.tipo.nombre}</p>
        <p className="text-sm text-gray-500 mb-2">
          {espacio.sede.nombre} — {espacio.sede.ciudad}
        </p>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{espacio.descripcion}</p>

        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <span className="text-sm text-gray-500">
            Capacidad: {espacio.capacidad} personas
          </span>
          <span className="text-lg font-bold text-blue-600">
            ${espacio.precioPorHora}/hora
          </span>
        </div>
      </CardBody>
    </Card>
  );
}
