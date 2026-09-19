import { createContext, useEffect, useState, type ReactNode } from 'react';

type ThemeContextType = {
  modoOscuro: boolean;
  alternarModo: () => void;
};

export const ThemeContext = createContext<ThemeContextType | null>(null);

function temaGuardado() {
  return localStorage.getItem('tema') === 'oscuro';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [modoOscuro, setModoOscuro] = useState(temaGuardado);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', modoOscuro);
    document.documentElement.style.colorScheme = modoOscuro ? 'dark' : 'light';
    localStorage.setItem('tema', modoOscuro ? 'oscuro' : 'claro');
  }, [modoOscuro]);

  return (
    <ThemeContext.Provider value={{ modoOscuro, alternarModo: () => setModoOscuro((activo) => !activo) }}>
      {children}
    </ThemeContext.Provider>
  );
}
