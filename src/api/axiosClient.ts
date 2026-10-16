import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Calls that must never trigger a refresh: they are how a session starts or ends.
const SIN_RENOVACION = ['/auth/login', '/auth/refresh', '/auth/logout', '/auth/register'];

/**
 * One refresh at a time (SEC-02): the refresh token rotates on every use, so two parallel
 * refreshes with the same cookie would look like a stolen token and close the session.
 */
let renovando: Promise<string> | null = null;

function renovar(): Promise<string> {
  renovando ??= apiClient
    .post<{ token: string; usuario: unknown }>('/auth/refresh')
    .then(({ data }) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      return data.token;
    })
    .finally(() => {
      renovando = null;
    });
  return renovando;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    const url = originalRequest?.url ?? '';
    const sinRenovacion = SIN_RENOVACION.some((ruta) => url.includes(ruta));

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !sinRenovacion) {
      originalRequest._retry = true;
      try {
        const token = await renovar();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch {
        // La sesión ya no puede renovarse: se limpia debajo y se vuelve al login.
      }
    }

    if (error.response?.status === 401 && !url.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
