import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: ReactNode;
  error?: ReactNode;
  icon?: IconName;
  /** Content rendered inside the box, after the input. */
  trailing?: ReactNode;
  /** Content rendered under the box, before hint and error (e.g. a strength meter). */
  below?: ReactNode;
  mono?: boolean;
  showRequired?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, icon, trailing, below, mono, showRequired, className = '', id, type, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const messageId = `${inputId}-msg`;
    // Every hidden field gets a show/hide toggle, so no screen has to remember to add it.
    const [visible, setVisible] = useState(false);
    const esSecreto = type === 'password';

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
            type={esSecreto && visible ? 'text' : type}
            className={mono ? 'mono' : ''}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || hint ? messageId : undefined}
            {...props}
          />
          {trailing}
          {esSecreto && !props.disabled && (
            <button
              type="button"
              className="input-icon -mr-1 grid h-7 w-7 flex-none place-items-center rounded hover:text-slate-600"
              onClick={() => setVisible((v) => !v)}
              aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label?.toLowerCase() ?? 'valor'}`}
              aria-controls={inputId}
              aria-pressed={visible}
            >
              <Icon name={visible ? 'eyeOff' : 'eye'} />
            </button>
          )}
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
