import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppShell } from './components/Layout/AppShell';
import { ProtectedRoute } from './components/Layout/ProtectedRoute';
import { LoginRegistroView } from './views/LoginRegistroView';
import { OlvidePasswordView } from './views/OlvidePasswordView';
import { BuscadorEspaciosView } from './views/BuscadorEspaciosView';
import { PerfilView } from './views/PerfilView';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/login" element={<LoginRegistroView />} />
            <Route path="/registro" element={<LoginRegistroView />} />
            <Route path="/olvide-password" element={<OlvidePasswordView />} />
            <Route
              path="/espacios"
              element={
                <ProtectedRoute>
                  <BuscadorEspaciosView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <PerfilView />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/espacios" replace />} />
            <Route path="*" element={<Navigate to="/espacios" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
