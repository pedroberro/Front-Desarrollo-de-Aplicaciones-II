// Placeholder illustration of a building, as drawn in the wireframes: two towers, a low block and the
// ground line. The palette comes from the company or building ("indigo", "sky" or "slate"; "indigo"
// is the catalog's name for the brand blue and is drawn with the logo's steel tints); `variante`
// shifts the window pattern so cards next to each other do not look identical.

const PALETAS: Record<string, { fondo: string; fuerte: string; suave: string; suelo: string }> = {
  indigo: { fondo: '#eef2f8', fuerte: '#9fb6d9', suave: '#c9d4e5', suelo: '#c9d4e5' },
  sky: { fondo: '#f0f9ff', fuerte: '#7dd3fc', suave: '#bae6fd', suelo: '#bae6fd' },
  slate: { fondo: '#f1f5f9', fuerte: '#cbd5e1', suave: '#e2e8f0', suelo: '#e2e8f0' },
};

export function Ilustracion({ tono, variante = 0, etiqueta }: { tono: string; variante?: number; etiqueta: string }) {
  const p = PALETAS[tono] ?? PALETAS.indigo;
  const ventanas = (x: number, y: number, cols: number, filas: number, semilla: number) =>
    Array.from({ length: cols * filas }, (_, i) => {
      const lleno = (i * 7 + semilla * 3 + variante) % 5 !== 0;
      return lleno ? (
        <rect key={`${x}-${i}`} x={x + (i % cols) * 22} y={y + Math.floor(i / cols) * 18} width="14" height="10" fill="#fff" opacity=".85" />
      ) : null;
    });

  return (
    <div className="cover" style={{ background: p.fondo }} role="img" aria-label={etiqueta}>
      <svg viewBox="0 0 440 152" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <rect x="44" y="36" width="104" height="92" fill={p.fuerte} />
        {ventanas(56, 48, 4, 4, 1)}
        <rect x="160" y="20" width="118" height="108" fill={p.suave} />
        {ventanas(172, 32, 5, 4, 2)}
        <rect x="290" y="60" width="66" height="68" fill={p.fuerte} />
        <rect x="364" y="82" width="48" height="46" fill={p.suave} />
        <rect x="0" y="128" width="440" height="24" fill={p.suelo} />
      </svg>
    </div>
  );
}
