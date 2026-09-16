import { forwardRef, type ComponentProps } from 'react';
import { Input } from '../ui/Input';

type PasswordInputProps = Omit<ComponentProps<typeof Input>, 'type' | 'icon' | 'mono'>;

/** Password field with the lock icon; the show/hide toggle comes from Input. */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>((props, ref) => (
  <Input ref={ref} type="password" icon="lock" mono {...props} />
));

PasswordInput.displayName = 'PasswordInput';
