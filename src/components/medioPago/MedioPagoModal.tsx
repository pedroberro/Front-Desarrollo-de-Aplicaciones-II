import { useState, type FormEvent } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import type { MedioPagoRequest } from '../../types';
import {
  formatearNumeroTarjeta,
  formatearVencimiento,
  soloDigitos,
  validarCodigoSeguridad,
  validarNumeroTarjeta,
  validarTitular,
  validarVencimiento,
} from '../../utils/validation';

type Campo = 'titular' | 'numeroTarjeta' | 'vencimiento' | 'codigoSeguridad';

interface CrearProps {
  modo: 'crear';
  inicial?: MedioPagoRequest;
  onCompletar: (datos: MedioPagoRequest) => Promise<void> | void;
}

interface EditarProps {
  modo: 'editar';
  inicial: { titular: string; vencimiento: string; ultimos4: string };
  onCompletar: (datos: { titular: string; vencimiento: string }) => Promise<void> | void;
}

type MedioPagoModalProps = (CrearProps | EditarProps) & {
  onCerrar: () => void;
  /** Errors returned by the backend, keyed by DTO field name. */
  erroresServidor?: Partial<Record<Campo, string>>;
  errorGeneral?: string | null;
};

export function MedioPagoModal(props: MedioPagoModalProps) {
  const { modo, onCerrar, erroresServidor = {}, errorGeneral } = props;
  const editando = modo === 'editar';

  const [titular, setTitular] = useState(props.inicial?.titular ?? '');
  const [numeroTarjeta, setNumeroTarjeta] = useState(!editando ? props.inicial?.numeroTarjeta ?? '' : '');
  const [vencimiento, setVencimiento] = useState(props.inicial?.vencimiento ?? '');
  const [codigoSeguridad, setCodigoSeguridad] = useState(!editando ? props.inicial?.codigoSeguridad ?? '' : '');
  const [tocados, setTocados] = useState<Partial<Record<Campo, boolean>>>({});
  const [enviando, setEnviando] = useState(false);

  const errores: Record<Campo, string | null> = {
    titular: validarTitular(titular),
    numeroTarjeta: editando ? null : validarNumeroTarjeta(numeroTarjeta),
    vencimiento: validarVencimiento(vencimiento),
    codigoSeguridad: editando ? null : validarCodigoSeguridad(codigoSeguridad),
  };
  const valido = Object.values(errores).every((e) => e === null);
  const mostrar = (campo: Campo) => (tocados[campo] ? errores[campo] : null) ?? erroresServidor[campo] ?? null;
  const tocar = (campo: Campo) => () => setTocados((t) => ({ ...t, [campo]: true }));

  const completar = async (event: FormEvent) => {
    event.preventDefault();
    setTocados({ titular: true, numeroTarjeta: true, vencimiento: true, codigoSeguridad: true });
    if (!valido) return;
    setEnviando(true);
    try {
      if (props.modo === 'editar') {
        await props.onCompletar({ titular: titular.trim(), vencimiento });
      } else {
        await props.onCompletar({ titular: titular.trim(), numeroTarjeta, vencimiento, codigoSeguridad });
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      title={editando ? 'Editar método de pago' : 'Método de pago'}
      badge={!editando && <Badge>opcional</Badge>}
      onClose={onCerrar}
      onSubmit={completar}
      footer={
        <>
          <Button variant="secondary" onClick={onCerrar}>Cancelar</Button>
          <Button type="submit" isLoading={enviando}>Completar</Button>
        </>
      }
    >
      {errorGeneral && (
        <div className="alert alert-error" role="alert">
          <Icon name="alert" size={14} className="mt-[3px]" />
          <span>{errorGeneral}</span>
        </div>
      )}

      <Input
        label="Titular de la tarjeta"
        placeholder="Como figura en la tarjeta"
        autoComplete="cc-name"
        value={titular}
        maxLength={100}
        autoFocus
        onChange={(e) => setTitular(e.target.value)}
        onBlur={tocar('titular')}
        error={mostrar('titular')}
      />

      {editando ? (
        <Input
          label="Número de tarjeta"
          icon="card"
          mono
          value={`•••• •••• •••• ${props.inicial.ultimos4}`}
          disabled
          hint="El número no se modifica: para usar otra tarjeta, agregala como nueva."
        />
      ) : (
        <Input
          label="Número de tarjeta"
          icon="card"
          mono
          placeholder="0000 0000 0000 0000"
          inputMode="numeric"
          autoComplete="cc-number"
          value={numeroTarjeta}
          onChange={(e) => setNumeroTarjeta(formatearNumeroTarjeta(e.target.value))}
          onBlur={tocar('numeroTarjeta')}
          error={mostrar('numeroTarjeta')}
        />
      )}

      <div className="flex gap-3">
        <Input
          className="flex-1"
          label="Vencimiento"
          mono
          placeholder="MM / AA"
          inputMode="numeric"
          autoComplete="cc-exp"
          value={vencimiento}
          onChange={(e) => setVencimiento(formatearVencimiento(e.target.value, vencimiento))}
          onBlur={tocar('vencimiento')}
          error={mostrar('vencimiento')}
        />
        {!editando && (
          <Input
            className="flex-1"
            label="Código"
            type="password"
            mono
            placeholder="•••"
            inputMode="numeric"
            autoComplete="cc-csc"
            value={codigoSeguridad}
            onChange={(e) => setCodigoSeguridad(soloDigitos(e.target.value, 4))}
            onBlur={tocar('codigoSeguridad')}
            error={mostrar('codigoSeguridad')}
          />
        )}
      </div>

      <div className="alert alert-info">
        <Icon name="info" size={14} className="mt-[3px] text-slate-500" />
        <span className="t-xs">
          Guardamos solo el titular, el vencimiento y los últimos cuatro dígitos. El número completo y el código de
          seguridad no se guardan.
        </span>
      </div>
    </Modal>
  );
}
