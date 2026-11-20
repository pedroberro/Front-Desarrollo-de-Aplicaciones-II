import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import { destinoDeAccionAsistente, type AccionAsistente } from './acciones';
import { CATEGORIAS, SALUDO, SIN_RESPUESTA, buscarPregunta, type IdCategoria, type PreguntaAsistente } from './catalogo';

interface Mensaje {
  id: number;
  autor: 'bot' | 'usuario';
  texto: string;
  /** Cuántos caracteres se muestran; undefined = mensaje completo. */
  visible?: number;
  /** Muestra los puntos suspensivos antes de empezar a escribir. */
  pensando?: boolean;
  accion?: AccionAsistente;
}

const PAUSA_PENSANDO_MS = 700;

/** Avanza hasta el próximo espacio (como mucho 6 caracteres): la respuesta se escribe por palabras. */
function siguienteCorte(texto: string, desde: number): number {
  const limite = Math.min(texto.length, desde + 6);
  if (limite === texto.length) return limite;
  const espacio = texto.indexOf(' ', desde + 1);
  return espacio === -1 || espacio > limite ? limite : espacio + 1;
}

const escribiendo = (m: Mensaje) =>
  m.autor === 'bot' && (m.pensando === true || (m.visible !== undefined && m.visible < m.texto.length));

const completo = (m: Mensaje) => m.visible === undefined || m.visible >= m.texto.length;

/**
 * Asistente simulado: las respuestas ya están cargadas en el catálogo y se revelan
 * de a poco para que la conversación se sienta como la de un chat real.
 */
export function ChatAsistente() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([{ id: 1, autor: 'bot', texto: SALUDO }]);
  const [categoria, setCategoria] = useState<IdCategoria>('reservas');
  const [consulta, setConsulta] = useState('');
  const proximoId = useRef(2);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  const generando = mensajes.some(escribiendo);
  const activa = CATEGORIAS.find((c) => c.id === categoria) ?? CATEGORIAS[0];
  const ultimaRespuesta = [...mensajes].reverse().find((m) => m.autor === 'bot' && !m.pensando && completo(m));

  const nuevoId = () => proximoId.current++;

  const agregarIntercambio = (textoUsuario: string, textoBot: string, accion?: AccionAsistente) => {
    const idUsuario = nuevoId();
    const idBot = nuevoId();
    setMensajes((prev) => [
      ...prev,
      { id: idUsuario, autor: 'usuario', texto: textoUsuario },
      { id: idBot, autor: 'bot', texto: textoBot, pensando: true, accion },
    ]);
  };

  const preguntar = (pregunta: PreguntaAsistente) => {
    if (generando) return;
    agregarIntercambio(pregunta.texto, pregunta.respuesta, pregunta.accion);
  };

  const enviar = (event: FormEvent) => {
    event.preventDefault();
    const texto = consulta.trim();
    if (!texto || generando) return;
    setConsulta('');
    const pregunta = buscarPregunta(texto);
    if (pregunta) agregarIntercambio(texto, pregunta.respuesta, pregunta.accion);
    else agregarIntercambio(texto, SIN_RESPUESTA);
  };

  // Pausa de "pensando" antes de empezar a escribir la respuesta.
  useEffect(() => {
    const pendiente = mensajes.find((m) => m.pensando);
    if (!pendiente) return;
    const timer = setTimeout(() => {
      setMensajes((prev) =>
        prev.map((m) => (m.id === pendiente.id ? { ...m, pensando: false, visible: 0 } : m)),
      );
    }, PAUSA_PENSANDO_MS);
    return () => clearTimeout(timer);
  }, [mensajes]);

  // Revela la respuesta de a palabras, con un ritmo irregular para que no se vea mecánico.
  useEffect(() => {
    const enCurso = mensajes.find((m) => m.visible !== undefined && m.visible < m.texto.length);
    if (!enCurso) return;
    const timer = setTimeout(() => {
      setMensajes((prev) =>
        prev.map((m) =>
          m.id === enCurso.id && m.visible !== undefined
            ? { ...m, visible: siguienteCorte(m.texto, m.visible) }
            : m,
        ),
      );
    }, 22 + Math.random() * 26);
    return () => clearTimeout(timer);
  }, [mensajes]);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [mensajes, abierto]);

  useEffect(() => {
    if (!abierto) return;
    inputRef.current?.focus();
    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setAbierto(false);
      fabRef.current?.focus();
    };
    document.addEventListener('keydown', cerrarConEscape);
    return () => document.removeEventListener('keydown', cerrarConEscape);
  }, [abierto]);

  return (
    <>
      {abierto && (
        <section className="chat-panel" id="asistente-panel" role="dialog" aria-label="Asistente de Planta Libre">
          <header className="chat-hd">
            <span className="chat-avatar" aria-hidden="true">
              <Icon name="robot" />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="t-sm font-semibold">Asistente de Planta Libre</span>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-icon ml-auto"
              onClick={() => {
                setAbierto(false);
                fabRef.current?.focus();
              }}
              aria-label="Cerrar el asistente"
            >
              <Icon name="x" />
            </button>
          </header>

          <div className="chat-log" ref={logRef} aria-live="off">
            {mensajes.map((m) => (
              <Burbuja key={m.id} mensaje={m} onNavegar={() => setAbierto(false)} />
            ))}
          </div>

          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {ultimaRespuesta?.texto ?? ''}
          </p>

          <div className="chat-explorer">
            <div className="chat-cats" role="group" aria-label="Categorías de preguntas">
              {CATEGORIAS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`chat-cat ${c.id === activa.id ? 'chat-cat-on' : ''}`}
                  aria-pressed={c.id === activa.id}
                  onClick={() => setCategoria(c.id)}
                >
                  <Icon name={c.icono} size={12} />
                  {c.nombre}
                </button>
              ))}
            </div>
            <div className="chat-questions">
              {activa.preguntas.map((p) => (
                <button key={p.id} type="button" className="chat-q" disabled={generando} onClick={() => preguntar(p)}>
                  <Icon name="chevRight" size={12} />
                  <span>{p.texto}</span>
                </button>
              ))}
            </div>
          </div>

          <form className="chat-form" onSubmit={enviar}>
            <input
              ref={inputRef}
              className="chat-input"
              value={consulta}
              maxLength={200}
              autoComplete="off"
              placeholder="Escribí tu pregunta…"
              aria-label="Escribí tu pregunta"
              onChange={(e) => setConsulta(e.target.value)}
            />
            <button
              type="submit"
              className="chat-send"
              disabled={!consulta.trim() || generando}
              aria-label="Enviar pregunta"
            >
              <Icon name="send" size={16} />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        ref={fabRef}
        className="chat-fab"
        onClick={() => setAbierto((v) => !v)}
        aria-label={abierto ? 'Cerrar el asistente' : 'Abrir el asistente'}
        aria-expanded={abierto}
        aria-controls={abierto ? 'asistente-panel' : undefined}
        title={abierto ? 'Cerrar el asistente' : '¿Necesitás ayuda?'}
      >
        <Icon name="robot" size={24} />
      </button>
    </>
  );
}

function Burbuja({ mensaje, onNavegar }: { mensaje: Mensaje; onNavegar: () => void }) {
  if (mensaje.autor === 'usuario') {
    return <div className="chat-msg chat-msg-user">{mensaje.texto}</div>;
  }

  if (mensaje.pensando) {
    return (
      <div className="chat-msg chat-msg-bot" role="status" aria-label="El asistente está escribiendo una respuesta">
        <span className="chat-typing" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </div>
    );
  }

  const visible = mensaje.visible ?? mensaje.texto.length;
  const terminado = visible >= mensaje.texto.length;
  const destino = destinoDeAccionAsistente(mensaje.accion);

  return (
    <div className="chat-msg chat-msg-bot">
      {mensaje.texto.slice(0, visible)}
      {!terminado && <span className="chat-cursor" aria-hidden="true" />}
      {terminado && destino && (
        <div className="mt-2">
          <Link to={destino.ruta} className="btn btn-secondary btn-sm" onClick={onNavegar}>
            <Icon name="chevRight" size={12} />
            {destino.etiqueta}
          </Link>
        </div>
      )}
    </div>
  );
}
