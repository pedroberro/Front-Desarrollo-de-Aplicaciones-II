// The backend keeps the phone as one string: "<prefix> <number>", e.g. "+54 11 5555 4218".

export const PREFIJOS = [
  { value: '+54', label: 'Argentina' },
  { value: '+598', label: 'Uruguay' },
  { value: '+56', label: 'Chile' },
  { value: '+55', label: 'Brasil' },
  { value: '+595', label: 'Paraguay' },
  { value: '+591', label: 'Bolivia' },
  { value: '+51', label: 'Perú' },
  { value: '+57', label: 'Colombia' },
  { value: '+52', label: 'México' },
  { value: '+34', label: 'España' },
  { value: '+1', label: 'Estados Unidos' },
] as const;

export const PREFIJO_DEFAULT = '+54';

export function unirTelefono(prefijo: string, numero: string): string {
  return `${prefijo} ${numero.trim().replace(/\s+/g, ' ')}`;
}

export function separarTelefono(telefono: string): { prefijo: string; numero: string } {
  const match = /^(\+\d{1,4})\s+(.*)$/.exec(telefono?.trim() ?? '');
  const prefijo = match && PREFIJOS.some((p) => p.value === match[1]) ? match[1] : null;
  return prefijo ? { prefijo, numero: match![2] } : { prefijo: PREFIJO_DEFAULT, numero: telefono ?? '' };
}
