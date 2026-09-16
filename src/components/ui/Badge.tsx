import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'ok';
  small?: boolean;
}

export function Badge({ children, tone = 'neutral', small = true }: BadgeProps) {
  return <span className={`badge b-${tone} ${small ? 'badge-sm' : ''}`}>{children}</span>;
}
