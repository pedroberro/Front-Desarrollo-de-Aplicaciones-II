import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppShell } from './components/Layout/AppShell';
import { GuestRoute, ProtectedRoute } from './components/Layout/ProtectedRoute';
import { LoginView } from './views/LoginView';
import { RegistroView } from './views/RegistroView';
import { OlvidePasswordView } from './views/OlvidePasswordView';
import { ResetPasswordView } from './views/ResetPasswordView';
import { ConfirmarEmailView } from './views/ConfirmarEmailView';
import { BuscadorEspaciosView } from './views/BuscadorEspaciosView';
import { PerfilView } from './views/PerfilView';
import { HOME_PATH } from './routes';

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
            <Route path="/espacios" element={<ProtectedRoute><BuscadorEspaciosView /></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><PerfilView /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to={HOME_PATH} replace />} />
          </Route>
        </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
