import { LogoCompleto } from '../ui/Logo';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-2.5 text-center">
      <LogoCompleto size={88} />
      <h1 className="t-2xl font-semibold">{title}</h1>
      <p className="t-sm muted">{subtitle}</p>
    </div>
  );
}
