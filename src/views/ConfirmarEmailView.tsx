import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { getApiCode, getApiErrorMessage } from '../api/apiError';
import { useAuth } from '../hooks/useAuth';
import { AuthHeader } from '../components/auth/AuthHeader';
import { Icon } from '../components/ui/Icon';
import { HOME_PATH } from '../routes';

type Estado = { tipo: 'confirmando' } | { tipo: 'error'; usado: boolean; mensaje: string };

export function ConfirmarEmailView() {
  const navigate = useNavigate();
  const { iniciarSesion } = useAuth();
  const [params] = useSearchParams();
  const token = params.get('token');
  const [estado, setEstado] = useState<Estado>({ tipo: 'confirmando' });
  // The link works once, so the request must not repeat (StrictMode runs effects twice in dev).
  const pedido = useRef(false);

  useEffect(() => {
    if (!token || pedido.current) return;
    pedido.current = true;
    authApi
      .confirmarEmail(token)
      .then((respuesta) => {
        iniciarSesion(respuesta);
        navigate(HOME_PATH, { replace: true });
      })
      .catch((err) =>
        setEstado({
          tipo: 'error',
          usado: getApiCode(err) === 'LINK_USADO',
          mensaje: getApiErrorMessage(err, 'No pudimos confirmar tu email. Probá de nuevo en un momento.'),
        })
      );
  }, [token, iniciarSesion, navigate]);

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-[400px] flex-col items-center gap-8">
        {estado.tipo === 'confirmando' ? (
          <AuthHeader title="Confirmando tu email…" subtitle="Un momento, enseguida entrás" />
        ) : (
          <>
            <AuthHeader
              title={estado.usado ? 'Email ya confirmado' : 'No pudimos confirmar tu email'}
              subtitle={estado.usado ? 'Este link ya se usó' : 'El link no es válido'}
            />
            <div className="card w-full">
              <div className="card-bd flex flex-col gap-4 !p-6">
                <div className={`alert ${estado.usado ? 'alert-info' : 'alert-error'}`} role="alert">
                  <Icon name={estado.usado ? 'info' : 'alert'} size={14} className="mt-[3px]" />
                  <span>
                    {estado.usado
                      ? estado.mensaje
                      : `${estado.mensaje} Revisá que hayas abierto el último mail o ingresá para pedir otro link.`}
                  </span>
                </div>
                <Link to="/login" className="btn btn-primary btn-lg w-full">
                  Ingresar
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
