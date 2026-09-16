import { useState } from 'react';
import { getApiErrorMessage, getApiFieldErrors } from '../../api/apiError';
import { usuariosApi } from '../../api/usuariosApi';
import { MedioPagoModal } from '../medioPago/MedioPagoModal';
import { AgregarMedioPagoRow, MedioPagoRow } from '../medioPago/MedioPagoRow';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Icon } from '../ui/Icon';
import type { MedioPagoRequest, MedioPagoResumen } from '../../types';
import { MAX_MEDIOS_PAGO } from '../../utils/validation';

type Edicion = { modo: 'crear' } | { modo: 'editar'; tarjeta: MedioPagoResumen };

interface MediosPagoCardProps {
  mediosPago: MedioPagoResumen[];
  onCambio: (mediosPago: MedioPagoResumen[]) => void;
  onMensaje: (mensaje: string) => void;
}

export function MediosPagoCard({ mediosPago, onCambio, onMensaje }: MediosPagoCardProps) {
  const [edicion, setEdicion] = useState<Edicion | null>(null);
  const [erroresServidor, setErroresServidor] = useState<Record<string, string>>({});
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [errorLista, setErrorLista] = useState<string | null>(null);
  // Card id with a pending delete or primary change; blocks other row actions meanwhile.
  const [procesando, setProcesando] = useState<number | null>(null);

  const lleno = mediosPago.length >= MAX_MEDIOS_PAGO;

  const abrir = (nueva: Edicion) => {
    setErroresServidor({});
    setErrorModal(null);
    setEdicion(nueva);
  };

  const recargar = async () => onCambio(await usuariosApi.listarMediosPago());

  const fallo = (err: unknown, fallback: string) => {
    const porCampo = getApiFieldErrors(err);
    setErroresServidor(porCampo);
    setErrorModal(Object.keys(porCampo).length ? null : getApiErrorMessage(err, fallback));
  };

  const crear = async (datos: MedioPagoRequest) => {
    try {
      await usuariosApi.agregarMedioPago(datos);
      await recargar();
      setEdicion(null);
      onMensaje('Método de pago agregado.');
    } catch (err) {
      fallo(err, 'No pudimos agregar el método de pago.');
    }
  };

  const editar = (id: number) => async (datos: { titular: string; vencimiento: string }) => {
    try {
      const actualizada = await usuariosApi.actualizarMedioPago(id, datos);
      onCambio(mediosPago.map((t) => (t.id === id ? actualizada : t)));
      setEdicion(null);
      onMensaje('Método de pago actualizado.');
    } catch (err) {
      fallo(err, 'No pudimos actualizar el método de pago.');
    }
  };

  const marcarPrincipal = async (tarjeta: MedioPagoResumen) => {
    setErrorLista(null);
    setProcesando(tarjeta.id);
    try {
      onCambio(await usuariosApi.marcarMedioPagoPrincipal(tarjeta.id));
      onMensaje(`La tarjeta terminada en ${tarjeta.ultimos4} es ahora la principal.`);
    } catch (err) {
      setErrorLista(getApiErrorMessage(err, 'No pudimos cambiar la tarjeta principal.'));
    } finally {
      setProcesando(null);
    }
  };

  const eliminar = async (tarjeta: MedioPagoResumen) => {
    setErrorLista(null);
    setProcesando(tarjeta.id);
    try {
      await usuariosApi.eliminarMedioPago(tarjeta.id);
      // Reload: removing the primary card promotes another one on the server.
      await recargar();
      onMensaje(`Se eliminó la tarjeta terminada en ${tarjeta.ultimos4}.`);
    } catch (err) {
      setErrorLista(getApiErrorMessage(err, 'No pudimos eliminar el método de pago.'));
    } finally {
      setProcesando(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <h2 className="t-sm font-semibold">Métodos de pago</h2>
          <Badge>
            <span className="num">{mediosPago.length}</span> de <span className="num">{MAX_MEDIOS_PAGO}</span>
          </Badge>
        </div>
        <span className="t-xs muted">Podés guardar hasta {MAX_MEDIOS_PAGO}</span>
      </CardHeader>

      {mediosPago.length === 0 ? (
        <div className="empty">
          <div className="empty-ic">
            <Icon name="card" />
          </div>
          <span className="t-sm font-semibold">Todavía no cargaste ninguna tarjeta</span>
          <span className="t-xs muted max-w-[300px]">No hace falta para reservar: se pide recién al confirmar una reserva paga.</span>
          <Button variant="secondary" size="sm" onClick={() => abrir({ modo: 'crear' })}>
            <Icon name="plus" size={14} />
            Agregar método de pago
          </Button>
        </div>
      ) : (
        <CardBody className="flex flex-col gap-2.5">
          {errorLista && (
            <div className="alert alert-error" role="alert">
              <Icon name="alert" size={14} className="mt-[3px]" />
              <span>{errorLista}</span>
            </div>
          )}
          {mediosPago.map((tarjeta) => (
            <MedioPagoRow
              key={tarjeta.id}
              ultimos4={tarjeta.ultimos4}
              vencimiento={tarjeta.vencimiento}
              titular={tarjeta.titular}
              principal={tarjeta.principal}
              acciones={
                <>
                  {!tarjeta.principal && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => marcarPrincipal(tarjeta)}
                      disabled={procesando !== null}
                      aria-label={`Hacer principal la tarjeta terminada en ${tarjeta.ultimos4}`}
                    >
                      Hacer principal
                    </Button>
                  )}
                  <Button variant="secondary" size="sm" onClick={() => abrir({ modo: 'editar', tarjeta })}>
                    <Icon name="pencil" size={14} />
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="btn-icon"
                    onClick={() => eliminar(tarjeta)}
                    disabled={procesando !== null}
                    aria-label={`Eliminar tarjeta terminada en ${tarjeta.ultimos4}`}
                  >
                    <Icon name="trash" size={14} />
                  </Button>
                </>
              }
            />
          ))}
          <AgregarMedioPagoRow
            descripcion="Se guarda al completar el formulario."
            disabled={lleno}
            onClick={() => abrir({ modo: 'crear' })}
          />
          {lleno && <span className="t-xs muted">Para cargar otra tarjeta hay que eliminar una primero.</span>}
        </CardBody>
      )}

      {edicion?.modo === 'crear' && (
        <MedioPagoModal
          modo="crear"
          onCompletar={crear}
          onCerrar={() => setEdicion(null)}
          erroresServidor={erroresServidor}
          errorGeneral={errorModal}
        />
      )}
      {edicion?.modo === 'editar' && (
        <MedioPagoModal
          modo="editar"
          inicial={edicion.tarjeta}
          onCompletar={editar(edicion.tarjeta.id)}
          onCerrar={() => setEdicion(null)}
          erroresServidor={erroresServidor}
          errorGeneral={errorModal}
        />
      )}
    </Card>
  );
}
