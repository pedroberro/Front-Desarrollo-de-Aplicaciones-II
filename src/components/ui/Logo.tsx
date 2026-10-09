import logoCompleto from '../../assets/logo-planta-libre.png';

// Reduced version of the logo for small sizes (top bar, favicon): the peach P and the coral L
// over the navy square. The full logo has too many blocks to read below ~64px.
// Keep in sync with public/favicon.svg.
export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="flex-none">
      <rect width="32" height="32" rx="7" fill="#0d1b2f" />
      <rect x="21" y="7" width="5" height="7" fill="#203652" />
      <path d="M6.5 5.5h10a6 6 0 0 1 0 12H12v9H6.5z" fill="#eaa06c" />
      <rect x="12" y="10" width="4.5" height="3" rx="1.5" fill="#0d1b2f" />
      <path d="M16 14.5h5.5v7H27v5H16z" fill="#e17e63" />
      <path d="M16 14.5h5.5v1.4a6 6 0 0 1-5 1.6H16z" fill="#c06456" />
    </svg>
  );
}

// Full logo, for the auth screens where it is shown large.
export function LogoCompleto({ size = 88 }: { size?: number }) {
  return (
    <img
      src={logoCompleto}
      alt="Planta Libre"
      width={size}
      height={Math.round((size * 354) / 344)}
      className="rounded-[12px]"
    />
  );
}
