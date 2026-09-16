import type { EvaluacionPassword } from '../../utils/validation';

const colores = { 1: 'bg-rose-600', 2: 'bg-emerald-600', 3: 'bg-emerald-600' } as const;
const etiquetas = { 1: 'text-rose-700', 2: 'text-emerald-700', 3: 'text-emerald-700' } as const;

export function PasswordStrength({ evaluacion }: { evaluacion: EvaluacionPassword }) {
  const { nivel, etiqueta } = evaluacion;
  if (nivel === 0) return null;

  return (
    <div className="flex items-center gap-2" aria-live="polite">
      <div className="flex grow gap-[3px]">
        {[1, 2, 3].map((segmento) => (
          <div key={segmento} className={`h-1 flex-1 rounded-sm ${segmento <= nivel ? colores[nivel] : 'bg-slate-200'}`} />
        ))}
      </div>
      {evaluacion.valida && <span className={`t-xs font-medium ${etiquetas[nivel]}`}>{etiqueta}</span>}
    </div>
  );
}
