import { useState, type FormEvent } from 'react';
import { getApiErrorMessage, getApiFieldErrors } from '../../api/apiError';
import { usuariosApi } from '../../api/usuariosApi';
import { PhoneField } from '../auth/PhoneField';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import type { Usuario } from '../../types';
import { separarTelefono, unirTelefono } from '../../utils/telefono';
import { validarTelefono } from '../../utils/validation';

interface TelefonoModalProps {
  telefonoActual: string;
  onGuardado: (usuario: Usuario) => void;
  onCerrar: () => void;
}

export function TelefonoModal({ telefonoActual, onGuardado, onCerrar }: TelefonoModalProps) {
  const inicial = separarTelefono(telefonoActual);
  const [prefijo, setPrefijo] = useState(inicial.prefijo);
  const [numero, setNumero] = useState(inicial.numero);
  const [tocado, setTocado] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const error = validarTelefono(numero);

  const guardar = async (event: FormEvent) => {
    event.preventDefault();
    setTocado(true);
    if (error) return;
    setEnviando(true);
    setErrorGeneral(null);
    try {
      onGuardado(await usuariosApi.actualizarPerfil({ telefono: unirTelefono(prefijo, numero) }));
    } catch (err) {
      const campo = getApiFieldErrors(err).telefono;
      if (campo) setErrorServidor(campo);
      else setErrorGeneral(getApiErrorMessage(err, 'No pudimos actualizar el teléfono.'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      title="Cambiar teléfono"
      onClose={onCerrar}
      onSubmit={guardar}
      footer={
        <>
          <Button variant="secondary" onClick={onCerrar}>Cancelar</Button>
          <Button type="submit" isLoading={enviando}>Guardar</Button>
        </>
      }
    >
      {errorGeneral && (
        <div className="alert alert-error" role="alert">
          <Icon name="alert" size={14} className="mt-[3px]" />
          <span>{errorGeneral}</span>
        </div>
      )}
      <PhoneField
        prefijo={prefijo}
        numero={numero}
        autoFocus
        onPrefijoChange={setPrefijo}
        onNumeroChange={(valor) => {
          setNumero(valor);
          setErrorServidor(null);
        }}
        onBlur={() => setTocado(true)}
        error={errorServidor ?? (tocado ? error : null)}
        hint="Lo usamos si hay que avisarte de un bloqueo sobre tu reserva."
      />
    </Modal>
  );
}
