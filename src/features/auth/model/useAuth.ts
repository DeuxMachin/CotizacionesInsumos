"use client";

import { create } from "zustand";
import { useEffect } from "react";
import { AuthService, type AuthUser } from "@/services/authService";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastActivity: number | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateActivity: () => void;
  initializeAuth: () => Promise<void>;
}

// Tiempo de inactividad antes de cerrar sesión (10 minutos en milisegundos)
const INACTIVITY_TIMEOUT = 10 * 60 * 1000;

export const useAuth = create<AuthState>()(
  (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      lastActivity: null,

      updateActivity: () => {
        set({ lastActivity: Date.now() });
      },

      initializeAuth: async () => {
        set({ isLoading: true });
        try {
          // Verificar sesión con el servidor
          const response = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include' // Para enviar cookies
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              set({
                user: result.data.user,
                isAuthenticated: true,
                lastActivity: Date.now()
              });
              return;
            }
          }

          // Si no hay sesión válida
          set({
            user: null,
            isAuthenticated: false
          });
        } catch (error) {
          console.error('Error inicializando autenticación:', error);
          set({
            user: null,
            isAuthenticated: false
          });
        } finally {
          set({ isLoading: false });
        }
      },

      login: async (email: string, password: string) => {
        console.log('🔵 useAuth.login iniciado');
        set({ isLoading: true });
        
        try {
          console.log('🔄 Llamando AuthService.signIn...');
          const result = await AuthService.signIn(email, password);
          console.log('✅ AuthService.signIn exitoso');
          
          set({
            user: result.user,
            isAuthenticated: true,
            lastActivity: Date.now(),
            isLoading: false
          });

          console.log('✅ useAuth.login completado exitosamente');
          // Redirigir al dashboard después del login exitoso
          window.location.href = '/dashboard';
          return { success: true };
        } catch (error) {
          console.error('❌ Error en useAuth.login:', error);
          set({ 
            isLoading: false,
            user: null,
            isAuthenticated: false 
          });
          
          const errorMessage = error instanceof Error ? error.message : 'Error de autenticación';
          console.log('❌ Devolviendo error:', errorMessage);
          return { 
            success: false, 
            error: errorMessage
          };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          // Llamar al endpoint de logout para borrar la cookie
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
          });
        } catch (error) {
          console.error('Error durante logout:', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            lastActivity: null,
            isLoading: false
          });

          // Redirigir al login
          window.location.href = '/login';
        }
      }
    }),
);

// Hook para manejar el cierre de sesión por inactividad
export function useInactivityTimeout() {
  const { isAuthenticated, lastActivity, logout, updateActivity } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Actualizar actividad en eventos de usuario
    const handleActivity = () => {
      updateActivity();
    };

    // Eventos de actividad del usuario
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Verificar inactividad cada minuto
    const checkInactivity = setInterval(() => {
      if (lastActivity && Date.now() - lastActivity > INACTIVITY_TIMEOUT) {
        alert('Su sesión ha expirado por inactividad.');
        logout();
      }
    }, 60000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(checkInactivity);
    };
  }, [isAuthenticated, lastActivity, logout, updateActivity]);
}

// Hook de inicialización que debe usarse en el layout principal
export function useAuthInitialization() {
  const { initializeAuth, isAuthenticated } = useAuth();

  useEffect(() => {
    // Inicializar autenticación al cargar la app
    initializeAuth();

    // Configurar listener de cambios de autenticación de Supabase
    const authSubscription = AuthService.onAuthStateChange((session, user) => {
      if (session && user) {
        useAuth.setState({
          user,
          isAuthenticated: true,
          lastActivity: Date.now()
        });
      } else {
        useAuth.setState({
          user: null,
          isAuthenticated: false,
          lastActivity: null
        });
      }
    });

    return () => {
      authSubscription.data.subscription.unsubscribe();
    };
  }, [initializeAuth]);

  return { isAuthenticated };
}
