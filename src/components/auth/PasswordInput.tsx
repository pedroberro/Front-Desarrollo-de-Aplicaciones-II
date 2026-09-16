import { forwardRef, useState, type ComponentProps } from 'react';
import { Input } from '../ui/Input';
import { Icon } from '../ui/Icon';

type PasswordInputProps = Omit<ComponentProps<typeof Input>, 'type' | 'icon' | 'trailing' | 'mono'> & {
  /** Adds the show/hide toggle inside the box. */
  toggle?: boolean;
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(({ toggle = false, ...props }, ref) => {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      ref={ref}
      type={visible ? 'text' : 'password'}
      icon="lock"
      mono={!visible}
      trailing={
        toggle && (
          <button
            type="button"
            className="input-icon -mr-1 grid h-7 w-7 place-items-center rounded hover:text-slate-600"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <Icon name={visible ? 'eyeOff' : 'eye'} />
          </button>
        )
      }
      {...props}
    />
  );
});

PasswordInput.displayName = 'PasswordInput';
