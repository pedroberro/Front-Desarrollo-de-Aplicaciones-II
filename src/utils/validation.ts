// Mirrors the Bean Validation rules of the backend DTOs, so a form can tell the user
// what is wrong before sending. Each validator returns the message to show, or null.

export const PASSWORD_MIN = 8;
export const MAX_MEDIOS_PAGO = 3;

// Native constraint props, for forms that rely on browser validation.
export const emailRules = { maxLength: 255 };
export const passwordRules = {
  minLength: PASSWORD_MIN,
  maxLength: 100,
  pattern: '(?=.*[A-Za-z])(?=.*\\d).+',
  title: 'Mínimo 8 caracteres, con al menos una letra y un número',
};

const plural = (n: number, singular: string, pluralForm: string) => `${n} ${n === 1 ? singular : pluralForm}`;

function joinY(parts: string[]): string {
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} y ${parts[parts.length - 1]}` : parts[0];
}

export function validarNombre(nombre: string): string | null {
  const limpio = nombre.trim();
  if (!limpio) return 'Ingresá tu nombre completo.';
  if (limpio.length < 2) return 'El nombre es muy corto.';
  if (limpio.length > 100) return 'El nombre no puede superar los 100 caracteres.';
  return null;
}

export function validarEmail(email: string): string | null {
  const limpio = email.trim();
  if (!limpio) return 'Ingresá tu email.';
  if (limpio.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio)) return 'El email no es válido.';
  return null;
}

export function validarTelefono(numero: string): string | null {
  const digitos = numero.replace(/\D/g, '');
  if (!digitos) return 'Ingresá tu teléfono.';
  if (digitos.length < 8) return 'Número incompleto.';
  if (digitos.length > 15) return 'El número es demasiado largo.';
  return null;
}

export type NivelPassword = 0 | 1 | 2 | 3;

export interface EvaluacionPassword {
  valida: boolean;
  nivel: NivelPassword;
  etiqueta: string;
  error: string | null;
}

export function evaluarPassword(password: string): EvaluacionPassword {
  if (!password) return { valida: false, nivel: 0, etiqueta: '', error: 'Ingresá una contraseña.' };

  const faltantes: string[] = [];
  const cortaPor = PASSWORD_MIN - password.length;
  if (cortaPor > 0) faltantes.push(plural(cortaPor, 'carácter', 'caracteres'));
  if (!/[A-Za-z]/.test(password)) faltantes.push('una letra');
  if (!/\d/.test(password)) faltantes.push('un número');

  if (password.length > 100) {
    return { valida: false, nivel: 1, etiqueta: 'Muy larga', error: 'La contraseña no puede superar los 100 caracteres.' };
  }
  if (faltantes.length > 0) {
    const verbo = cortaPor === 1 && faltantes.length === 1 ? 'falta' : 'faltan';
    const prefijo = cortaPor > 0 ? `Muy corta: ${verbo}` : 'Le falta';
    return { valida: false, nivel: 1, etiqueta: 'Débil', error: `${prefijo} ${joinY(faltantes)}.` };
  }

  const variada = /[a-z]/.test(password) && /[A-Z]/.test(password) || /[^A-Za-z0-9]/.test(password);
  const fuerte = password.length >= 12 && variada;
  return { valida: true, nivel: fuerte ? 3 : 2, etiqueta: fuerte ? 'Fuerte' : 'Aceptable', error: null };
}

export function validarTitular(titular: string): string | null {
  const limpio = titular.trim();
  if (!limpio) return 'Ingresá el titular.';
  if (limpio.length > 100) return 'El titular no puede superar los 100 caracteres.';
  return null;
}

export function validarNumeroTarjeta(numero: string): string | null {
  const digitos = numero.replace(/\s/g, '');
  if (!digitos) return 'Ingresá el número de tarjeta.';
  if (!/^\d{13,19}$/.test(digitos)) return 'Debe tener entre 13 y 19 dígitos.';
  return null;
}

export function validarVencimiento(vencimiento: string, hoy = new Date()): string | null {
  if (!vencimiento) return 'Ingresá el vencimiento.';
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(vencimiento);
  if (!match) return 'Usá el formato MM/AA.';
  const mes = Number(match[1]);
  const anio = 2000 + Number(match[2]);
  // A card stays valid through its expiry month, same rule as the backend.
  if (anio < hoy.getFullYear() || (anio === hoy.getFullYear() && mes < hoy.getMonth() + 1)) {
    return 'La tarjeta está vencida.';
  }
  return null;
}

export function validarCodigoSeguridad(codigo: string): string | null {
  if (!codigo) return 'Ingresá el código.';
  if (!/^\d{3,4}$/.test(codigo)) return 'Debe tener 3 o 4 dígitos.';
  return null;
}

export const soloDigitos = (valor: string, max: number) => valor.replace(/\D/g, '').slice(0, max);

export function formatearNumeroTarjeta(valor: string): string {
  return soloDigitos(valor, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatearVencimiento(valor: string, anterior: string): string {
  const digitos = soloDigitos(valor, 4);
  // Deleting the slash must not re-insert it.
  if (valor.length < anterior.length && anterior.endsWith('/') && digitos.length === 2) return digitos.slice(0, 1);
  return digitos.length >= 3 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos.length === 2 ? `${digitos}/` : digitos;
}
