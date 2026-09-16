import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: ReactNode;
  error?: ReactNode;
  icon?: IconName;
  /** Content rendered inside the box, after the input (e.g. a show-password toggle). */
  trailing?: ReactNode;
  /** Content rendered under the box, before hint and error (e.g. a strength meter). */
  below?: ReactNode;
  mono?: boolean;
  showRequired?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, icon, trailing, below, mono, showRequired, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const messageId = `${inputId}-msg`;

    return (
      <div className={`field ${className}`}>
        {label && (
          <label htmlFor={inputId} className="label">
            {label} {showRequired && <span className="text-rose-600">*</span>}
          </label>
        )}
        <div className={`input ${error ? 'input-error' : ''}`}>
          {icon && <Icon name={icon} className="input-icon" />}
          <input
            ref={ref}
            id={inputId}
            className={mono ? 'mono' : ''}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || hint ? messageId : undefined}
            {...props}
          />
          {trailing}
        </div>
        {below}
        {error ? (
          <div id={messageId} className="hint-error" role="alert">
            <Icon name="alert" size={14} />
            <span>{error}</span>
          </div>
        ) : (
          hint && <span id={messageId} className="hint">{hint}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
