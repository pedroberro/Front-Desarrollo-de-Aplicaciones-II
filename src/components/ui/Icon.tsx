import type { ReactNode } from 'react';

// Stroke icons from the wireframe sprite, 24x24 grid.
const paths = {
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 14 9 5 9-5" /></>,
  mail: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></>,
  phone: <><rect x="6" y="2" width="12" height="20" rx="2.5" /><path d="M11 18.5h2" /></>,
  chevDown: <path d="m6 9 6 6 6-6" />,
  chevRight: <path d="m9 18 6-6-6-6" />,
  eye: <><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" /><circle cx="12" cy="12" r="2.8" /></>,
  eyeOff: <><path d="M2 12s3.6-6 10-6c2 0 3.7.6 5.1 1.4M22 12s-3.6 6-10 6c-2 0-3.7-.6-5.1-1.4" /><path d="m3 3 18 18" /></>,
  card: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  alert: <><path d="M10.3 3.9 2.5 17.5A2 2 0 0 0 4.2 20.5h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4.5M12 17h.01" /></>,
  pencil: <><path d="M4 20h4L20 8a2.8 2.8 0 0 0-4-4L4 16Z" /><path d="m14 6 4 4" /></>,
  trash: <><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /><path d="M6 7v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" /><path d="M10 11v6M14 11v6" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>,
  moon: <path d="M20.4 15.5A8.5 8.5 0 0 1 8.5 3.6 8.5 8.5 0 1 0 20.4 15.5Z" />,
  check: <path d="m5 13 4 4L19 7" />,
  building: <><path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16" /><path d="M15 9h3a2 2 0 0 1 2 2v10" /><path d="M2 21h20" /><path d="M8 7h3M8 11h3M8 15h3" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /><path d="M3 12.5h18" /></>,
  map: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 10h18M10 3v18" /></>,
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  chevLeft: <path d="m15 18-6-6 6-6" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2 21c0-3.5 3.1-5.5 7-5.5s7 2 7 5.5" /><path d="M17 5.2a3.5 3.5 0 0 1 0 6.6M18 15.4c2.4.6 4 2.3 4 5.1" /></>,
  kitchen: <><path d="M6 3v8a2 2 0 0 0 4 0V3M8 11v10" /><path d="M17 3c-1.7 1.4-2.5 3.3-2.5 5.5S15.3 12 17 13v8" /></>,
  sofa: <><path d="M4 12V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" /><path d="M2 13a2 2 0 0 1 4 0v3h12v-3a2 2 0 0 1 4 0v6H2Z" /></>,
  wc: <path d="M12 3c3 3.6 5 6.3 5 8.8a5 5 0 0 1-10 0C7 9.3 9 6.6 12 3Z" />,
  monitor: <><rect x="2" y="4" width="20" height="13" rx="2" /><path d="M9 21h6M12 17v4" /></>,
  wifi: <><path d="M2.5 9a15 15 0 0 1 19 0M6 12.5a10 10 0 0 1 12 0M9.5 16a5 5 0 0 1 5 0" /><circle cx="12" cy="19.5" r=".8" fill="currentColor" /></>,
  ban: <><circle cx="12" cy="12" r="9" /><path d="m5.6 5.6 12.8 12.8" /></>,
  shield: <path d="M12 3 4 6v6c0 4.5 3.2 7.9 8 9 4.8-1.1 8-4.5 8-9V6Z" />,
  inbox: <><path d="M3 13h5l1.5 3h5L16 13h5" /><path d="M5.5 5h13l2.5 8v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6Z" /></>,
  filter: <path d="M3 5h18l-7 8v6l-4 2v-8Z" />,
  refresh: <><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" /><path d="M21 4v4h-4" /><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" /><path d="M3 20v-4h4" /></>,
  drag: <path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4" />,
  window: <><rect x="3" y="4" width="18" height="16" rx="1.5" /><path d="M12 4v16" /></>,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof paths;

interface IconProps {
  name: IconName;
  size?: 12 | 14 | 16 | 20 | 24;
  className?: string;
}

export function Icon({ name, size = 16, className = '' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`flex-none ${className}`}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
