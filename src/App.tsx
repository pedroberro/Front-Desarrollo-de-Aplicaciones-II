import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppShell } from './components/Layout/AppShell';
import { ProtectedRoute } from './components/Layout/ProtectedRoute';
import { LoginRegistroView } from './views/LoginRegistroView';
import { BuscadorEspaciosView } from './views/BuscadorEspaciosView';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/login" element={<LoginRegistroView />} />
            <Route path="/registro" element={<LoginRegistroView />} />
            <Route
              path="/espacios"
              element={
                <ProtectedRoute>
                  <BuscadorEspaciosView />
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
