/**
 * Utilidades para código que solo debe ejecutarse en el cliente
 * Ayuda a prevenir errores de hidratación en producción
 */

export function isClient(): boolean {
  return typeof window !== 'undefined';
}

export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function safeLocalStorage() {
  if (!isClient()) {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    };
  }
  return window.localStorage;
}

export function safeSessionStorage() {
  if (!isClient()) {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    };
  }
  return window.sessionStorage;
}

/**
 * Hook seguro para obtener el pathname actual
 * Devuelve null durante SSR para evitar errores de hidratación
 */
export function useClientPathname(): string | null {
  if (!isClient()) return null;
  return window.location.pathname;
}
