import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppShell } from './components/Layout/AppShell';
import { GuestRoute, Inicio, ProtectedRoute } from './components/Layout/ProtectedRoute';
import { LoginView } from './views/LoginView';
import { RegistroView } from './views/RegistroView';
import { OlvidePasswordView } from './views/OlvidePasswordView';
import { ResetPasswordView } from './views/ResetPasswordView';
import { ConfirmarEmailView } from './views/ConfirmarEmailView';
import { PerfilView } from './views/PerfilView';
import { EmpresasView } from './views/EmpresasView';
import { EdificiosView } from './views/EdificiosView';
import { PisosView } from './views/PisosView';
import { PisoView } from './views/PisoView';
import { MisReservasView } from './views/MisReservasView';
import { AgendaView } from './views/admin/AgendaView';
import { AdminPlanoView } from './views/admin/AdminPlanoView';
import { ReservasAdminView } from './views/admin/ReservasAdminView';
import { ReservaFormView } from './views/admin/ReservaFormView';
import { BloqueosView } from './views/admin/BloqueosView';
import { CrearBloqueoView } from './views/admin/CrearBloqueoView';
import { HOME_PATH } from './routes';

// Screens are guarded by the permissions the backend sends with the user; the API checks them again.
const CLIENTE = 'RESERVAS_CREAR';
const ADMIN = 'RESERVAS_GESTIONAR';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/login" element={<GuestRoute redirectTo={HOME_PATH}><LoginView /></GuestRoute>} />
            <Route path="/registro" element={<GuestRoute redirectTo={HOME_PATH}><RegistroView /></GuestRoute>} />
            <Route path="/olvide-password" element={<OlvidePasswordView />} />
            <Route path="/reset-password" element={<ResetPasswordView />} />
            <Route path="/confirmar-email" element={<ConfirmarEmailView />} />
            <Route path="/inicio" element={<ProtectedRoute><Inicio /></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><PerfilView /></ProtectedRoute>} />

            <Route path="/empresas" element={<ProtectedRoute permiso={CLIENTE}><EmpresasView /></ProtectedRoute>} />
            <Route path="/empresas/:empresaId" element={<ProtectedRoute permiso={CLIENTE}><EdificiosView /></ProtectedRoute>} />
            <Route path="/edificios/:edificioId" element={<ProtectedRoute permiso={CLIENTE}><PisosView /></ProtectedRoute>} />
            <Route path="/pisos/:pisoId" element={<ProtectedRoute permiso={CLIENTE}><PisoView /></ProtectedRoute>} />
            <Route path="/mis-reservas" element={<ProtectedRoute permiso={CLIENTE}><MisReservasView /></ProtectedRoute>} />

            <Route path="/admin/agenda" element={<ProtectedRoute permiso={ADMIN}><AgendaView /></ProtectedRoute>} />
            <Route path="/admin/pisos/:pisoId" element={<ProtectedRoute permiso={ADMIN}><AdminPlanoView /></ProtectedRoute>} />
            <Route path="/admin/reservas" element={<ProtectedRoute permiso={ADMIN}><ReservasAdminView /></ProtectedRoute>} />
            <Route path="/admin/reservas/nueva" element={<ProtectedRoute permiso={ADMIN}><ReservaFormView /></ProtectedRoute>} />
            <Route path="/admin/reservas/:reservaId" element={<ProtectedRoute permiso={ADMIN}><ReservaFormView /></ProtectedRoute>} />
            <Route path="/admin/bloqueos" element={<ProtectedRoute permiso={ADMIN}><BloqueosView /></ProtectedRoute>} />
            <Route path="/admin/bloqueos/nuevo" element={<ProtectedRoute permiso="BLOQUEOS_GESTIONAR"><CrearBloqueoView /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to={HOME_PATH} replace />} />
          </Route>
        </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
