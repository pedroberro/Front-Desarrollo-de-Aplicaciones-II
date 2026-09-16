import { useId, type ReactNode } from 'react';
import { Icon } from '../ui/Icon';
import { PREFIJOS } from '../../utils/telefono';

interface PhoneFieldProps {
  label?: string;
  prefijo: string;
  numero: string;
  onPrefijoChange: (prefijo: string) => void;
  onNumeroChange: (numero: string) => void;
  onBlur?: () => void;
  error?: string | null;
  hint?: ReactNode;
  showRequired?: boolean;
  autoFocus?: boolean;
}

export function PhoneField({ label = 'Teléfono', prefijo, numero, onPrefijoChange, onNumeroChange, onBlur, error, hint, showRequired, autoFocus }: PhoneFieldProps) {
  const id = useId();
  const messageId = `${id}-msg`;

  return (
    <div className="field">
      <label htmlFor={id} className="label">
        {label} {showRequired && <span className="text-rose-600">*</span>}
      </label>
      <div className="flex gap-2">
        {/* Shows only the prefix; the native select stays on top for keyboard and screen readers. */}
        <div className="input relative w-[104px] flex-none justify-between">
          <span className="flex items-center gap-1.5">
            <Icon name="phone" size={14} className="input-icon" />
            <span className="num">{prefijo}</span>
          </span>
          <Icon name="chevDown" size={14} className="input-icon" />
          <select
            value={prefijo}
            onChange={(e) => onPrefijoChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Código de país"
          >
            {PREFIJOS.map((p) => (
              <option key={p.value} value={p.value}>{`${p.value} ${p.label}`}</option>
            ))}
          </select>
        </div>
        <div className={`input flex-1 ${error ? 'input-error' : ''}`}>
          <input
            id={id}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            className="num"
            placeholder="11 5555 4218"
            value={numero}
            maxLength={24}
            autoFocus={autoFocus}
            onChange={(e) => onNumeroChange(e.target.value.replace(/[^\d\s]/g, ''))}
            onBlur={onBlur}
            aria-invalid={error ? true : undefined}
            aria-describedby={messageId}
          />
        </div>
      </div>
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
