import { Icon } from '../ui/Icon';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-2.5 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-[10px] bg-indigo-600 text-white">
        <Icon name="layers" size={24} />
      </div>
      <h1 className="t-2xl font-semibold">{title}</h1>
      <p className="t-sm muted">{subtitle}</p>
    </div>
  );
}
