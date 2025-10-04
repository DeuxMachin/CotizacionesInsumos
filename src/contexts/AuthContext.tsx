  "use client";

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { setAuthUserId } from '@/lib/auth-user-id'
import { log } from '@/lib/log'
// Eliminamos dependencia de AuthService para flujo limpio basado en rutas API

export interface User {
  id: string
  email: string
  name?: string
  role?: string
  isAdmin?: boolean
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; warning?: string; deactivated?: boolean }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastActivity, setLastActivity] = useState<number | null>(null)
  const router = useRouter();

  useEffect(() => {
    // Inicializar autenticación verificando la sesión
    const initializeAuth = async () => {
      log.debug('[Auth] Inicializando autenticación...')
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store' // Evitar cache en producción
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const apiUser = result.data.user;
            // role mapping boundary: backend / DB exposes 'rol'; UI consumes unified 'role'
            const role = apiUser.role || apiUser.rol;
            const name = apiUser.name || (apiUser.nombre && apiUser.apellido ? `${apiUser.nombre} ${apiUser.apellido}` : apiUser.nombre) || undefined;
            const newUser = {
              id: apiUser.id,
              email: apiUser.email,
              name,
              role,
              isAdmin: ['admin', 'dueño', 'dueno'].includes(role?.toLowerCase() || '')
            };
            setUser(newUser);
            setLastActivity(Date.now());
            log.debug('[Auth] Usuario autenticado:', newUser.email);
          } else {
            log.debug('[Auth] Sin sesión activa');
          }
        } else {
          log.debug('[Auth] Sin sesión activa (respuesta no ok)');
        }
      } catch (error) {
        log.error('Error inicializando autenticación:', error);
      } finally {
        log.debug('[Auth] Inicialización completada')
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Sistema de renovación automática de tokens
  useEffect(() => {
    if (!user) return;

    const updateActivity = () => setLastActivity(Date.now());

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, updateActivity));

    // Renovar token cada 30 minutos si hay actividad reciente
    const tokenRefreshInterval = setInterval(async () => {
      if (lastActivity && Date.now() - lastActivity < 30 * 60 * 1000) { // Actividad en los últimos 30 minutos
        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include'
          });
          
          if (response.ok) {
            log.debug('[Auth] Token renovado automáticamente');
          } else {
            log.warn('[Auth] Error renovando token automáticamente');
          }
        } catch (error) {
          log.error('[Auth] Error en renovación automática de token:', error);
        }
      }
    }, 30 * 60 * 1000); // Cada 30 minutos

  }, [user, lastActivity]);

  const login = async (email: string, password: string) => {
  log.debug('[Auth] Iniciando login (API directa) para', email)
    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      interface ApiUser { id: string; email: string; nombre?: string; apellido?: string; rol?: string; name?: string; role?: string }
      interface LoginApiResponse { success: boolean; error?: string; warning?: string; deactivated?: boolean; data?: { user: ApiUser } }
      const data: LoginApiResponse = await resp.json();
      if (!resp.ok || !data.success) {
        return { success: false, error: data.error || 'Credenciales inválidas', warning: data.warning, deactivated: data.deactivated };
      }
      const u = data.data?.user as ApiUser;
      if (!u) {
        setLoading(false);
        return { success: false, error: 'Respuesta inválida del servidor' };
      }
      const role = u.role || u.rol;
      const name = u.name || (u.nombre && u.apellido ? `${u.nombre} ${u.apellido}` : u.nombre) || undefined;
      setUser({ id: u.id, email: u.email, name, role, isAdmin: ['admin', 'dueño', 'dueno'].includes(role?.toLowerCase() || '') });
  setLastActivity(Date.now());
      const target = (['admin', 'dueño', 'dueno'].includes(role?.toLowerCase() || '')) ? '/admin' : '/dashboard';
      router.replace(target);
      // Fallback duro por si la navegación no ocurre por alguna razón
      setTimeout(() => {
        try {
          if (window.location.pathname === '/login') {
            window.location.assign(target);
          }
        } catch {}
      }, 500);
      return { success: true };
    } catch (e) {
      log.error('[Auth] Error en login:', e);
      return { success: false, error: 'Error de red' };
    }
  };

  // Fallback: si el usuario aparece autenticado estando en /login, redirigir
  useEffect(() => {
    if (!loading && user) {
      try {
        const currentPath = window.location.pathname;
        if (currentPath === '/login') {
          console.log('[Auth][Fallback] Usuario autenticado detectado en /login. Redirigiendo...');
          router.replace('/dashboard');
        }
      } catch {}
    }
  }, [loading, user, router]);

  const logout = async () => {
  log.debug('[Auth] Logout iniciado')
    setLoading(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      log.error('Error durante logout:', error);
    } finally {
      setUser(null);
      setLoading(false);
      router.replace('/login');
    }
  };

  // Sincronizar userId global para stores legacy (targets)
  useEffect(() => {
    setAuthUserId(user?.id || null);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper para crear headers de autenticación
export function createAuthHeaders(user: User | null): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  }

  if (user) {
    headers['x-user-id'] = user.id
    headers['x-user-email'] = user.email
    if (user.name) {
      headers['x-user-name'] = user.name
    }
  }

  return headers
}
