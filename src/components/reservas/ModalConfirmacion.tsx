import axios from 'axios';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '../../api/apiError';
import { reservasApi } from '../../api/reservasApi';
import { usuariosApi } from '../../api/usuariosApi';
import { useCarga, type Carga } from '../../hooks/useCarga';
import type { MedioPagoResumen } from '../../types';
import type { EspacioEnPlano, Franja, FranjaTomadaBody, Reserva } from '../../types/reservas';
import { duracion, fechaDe, fechaLarga, horaDe, minutosEntre, rangoHorario } from '../../utils/fechas';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';

interface ModalConfirmacionProps {
  espacio: EspacioEnPlano;
  edificio: string;
  piso: string;
  franja: Franja;
  onCerrar: () => void;
  onCreada: (reserva: Reserva) => void;
  /** The slot was taken while confirming (409): hand the nearby alternatives to the caller. */
  onTomada: (body: FranjaTomadaBody) => void;
}

/** Screen 8. The server validates the slot again on confirm: what was free a minute ago may not be now. */
export function ModalConfirmacion({ espacio, edificio, piso, franja, onCerrar, onCreada, onTomada }: ModalConfirmacionProps) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const medios = useCarga(() => usuariosApi.listarMediosPago(), [], 'No pudimos cargar tus métodos de pago.');
  const [medioElegido, setMedioElegido] = useState<number | null>(null);
  // Until the customer picks one, the main card is the default.
  const medioPagoId = medioElegido ?? medios.datos?.find((m) => m.principal)?.id ?? medios.datos?.[0]?.id ?? null;
  const sinMedios = medios.estado.tipo === 'listo' && medios.estado.datos.length === 0;

  const confirmar = async () => {
    if (medioPagoId === null) return;
    setEnviando(true);
    setError(null);
    try {
      onCreada(await reservasApi.crear(espacio.id, franja.inicio, franja.fin, medioPagoId));
    } catch (err) {
      const body = axios.isAxiosError(err) ? (err.response?.data as FranjaTomadaBody | undefined) : undefined;
      if (body?.code === 'FRANJA_OCUPADA') {
        onTomada(body);
        return;
      }
      setError(getApiErrorMessage(err, 'No pudimos crear la reserva. Probá de nuevo.'));
      setEnviando(false);
    }
  };

  const filas = [
    ['Edificio', edificio],
    ['Piso', piso],
    ['Espacio', `${espacio.codigo} · ${espacio.tipoEtiqueta} · ${espacio.capacidad} ${espacio.capacidad === 1 ? 'persona' : 'personas'}`],
    ['Día', fechaLarga(fechaDe(franja.inicio))],
    ['Horario', rangoHorario(franja.inicio, franja.fin)],
    ['Duración', duracion(minutosEntre(franja.inicio, franja.fin))],
  ];

  return (
    <Modal
      title="Confirmar reserva"
      subtitulo="Revisá los datos antes de confirmar"
      ancho={480}
      onClose={onCerrar}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={confirmar} disabled={enviando || medioPagoId === null} aria-busy={enviando}>
            {enviando ? 'Confirmando…' : 'Confirmar reserva'}
          </button>
        </>
      }
    >
      <dl className="-my-1 flex flex-col">
        {filas.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4 border-b border-slate-100 py-2.5 last:border-b-0">
            <dt className="t-sm muted">{k}</dt>
            <dd className={`t-sm text-right font-medium ${k === 'Horario' ? 'num' : ''}`}>{v}</dd>
          </div>
        ))}
      </dl>
      <SelectorMedioPago
        carga={medios.estado}
        valor={medioPagoId}
        onChange={setMedioElegido}
        onReintentar={medios.recargar}
        disabled={enviando}
      />
      {sinMedios && (
        <p className="alert alert-warn" role="status">
          <Icon name="card" size={14} className="mt-[3px]" />
          <span>
            Para reservar necesitás un método de pago. Agregalo desde <Link to="/perfil" className="link">tu perfil</Link> y volvé a elegir la franja.
          </span>
        </p>
      )}
      <p className="alert alert-info">
        <Icon name="info" size={14} className="mt-[3px]" />
        <span>
          La reserva se crea como <b className="text-amber-700">Pendiente</b> y queda confirmada cuando la aprueba un administrador. Podés cancelarla
          desde <b>Mis reservas</b> hasta las {horaDe(franja.inicio)} de ese día.
        </span>
      </p>
      {error && (
        <p className="alert alert-error" role="alert">
          <Icon name="alert" size={14} className="mt-[3px]" />
          <span>{error}</span>
        </p>
      )}
    </Modal>
  );
}

function etiquetaMedio(m: MedioPagoResumen): string {
  return `•••• ${m.ultimos4} · vence ${m.vencimiento} · ${m.titular}${m.principal ? ' (principal)' : ''}`;
}

interface SelectorMedioPagoProps {
  carga: Carga<MedioPagoResumen[]>;
  valor: number | null;
  onChange: (id: number) => void;
  onReintentar: () => void;
  disabled?: boolean;
}

/** Card the booking is paid with: the customer's saved cards, the main one first. */
function SelectorMedioPago({ carga, valor, onChange, onReintentar, disabled }: SelectorMedioPagoProps) {
  if (carga.tipo === 'error') {
    return (
      <p className="alert alert-error" role="alert">
        <Icon name="alert" size={14} className="mt-[3px]" />
        <span>
          {carga.mensaje}{' '}
          <button type="button" className="link" onClick={onReintentar}>
            Reintentar
          </button>
        </span>
      </p>
    );
  }
  const medios = carga.tipo === 'listo' ? carga.datos : [];
  if (carga.tipo === 'listo' && medios.length === 0) return null;

  return (
    <div className="field">
      <label className="label" htmlFor="reserva-medio-pago">Método de pago</label>
      <div className="input">
        <Icon name="card" className="input-icon" />
        <select
          id="reserva-medio-pago"
          value={valor ?? ''}
          disabled={disabled || carga.tipo === 'cargando'}
          onChange={(e) => onChange(Number(e.target.value))}
        >
          {carga.tipo === 'cargando' && <option value="">Cargando tus tarjetas…</option>}
          {[...medios].sort((a, b) => Number(b.principal) - Number(a.principal)).map((m) => (
            <option key={m.id} value={m.id}>
              {etiquetaMedio(m)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

interface FranjaTomadaProps {
  codigo: string;
  franja: Franja;
  body: FranjaTomadaBody;
  onElegir: (alternativa: Franja) => void;
  onOtroEspacio: () => void;
  onActualizar: () => void;
}

/** State E4: someone took the slot while confirming. Offers nearby free ranges without losing the chosen space. */
export function FranjaTomadaModal({ codigo, franja, body, onElegir, onOtroEspacio, onActualizar }: FranjaTomadaProps) {
  return (
    <Modal
      title="Esa franja ya no está disponible"
      ancho={460}
      onClose={onActualizar}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onOtroEspacio}>
            Elegir otro espacio
          </button>
          <button type="button" className="btn btn-primary" onClick={onActualizar}>
            <Icon name="refresh" size={14} />
            Actualizar el calendario
          </button>
        </>
      }
    >
      <div className="flex gap-3">
        <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-rose-50 text-rose-600">
          <Icon name="alert" />
        </span>
        <p className="t-sm muted">
          Mientras confirmabas, se ocupó <b className="mono text-slate-900">{codigo}</b> el {fechaLarga(fechaDe(franja.inicio), false)} de{' '}
          {horaDe(franja.inicio)} a {horaDe(franja.fin)}. Tu reserva no se creó.
        </p>
      </div>
      {body.alternativas.length > 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="t-xs mb-2 font-semibold text-slate-700">Horarios libres más cercanos en {codigo}</p>
          <div className="flex flex-wrap gap-2">
            {body.alternativas.map((a) => (
              <button key={a.inicio} type="button" className="chip-ok inline-flex items-center gap-1.5 px-3" onClick={() => onElegir(a)}>
                <i className="g-dot" aria-hidden="true" />
                <span className="num">{rangoHorario(a.inicio, a.fin)}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="t-sm muted">No quedan horarios libres de ese largo en {codigo} ese día.</p>
      )}
    </Modal>
  );
}
