"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
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

// Tiempo de inactividad antes de cerrar sesión (30 minutos en milisegundos)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
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
          // Para nuestra implementación actual, no mantenemos sesión persistente
          // Simplemente marcamos como no autenticado para forzar login
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
        set({ isLoading: true });
        
        try {
          const result = await AuthService.signIn(email, password);
          
          set({
            user: result.user,
            isAuthenticated: true,
            lastActivity: Date.now(),
            isLoading: false
          });

          // Escribir cookie para middleware
          try {
            const cookiePayload = encodeURIComponent(JSON.stringify({
              isAuthenticated: true,
              user: result.user,
            }));
            document.cookie = `auth-storage=${cookiePayload}; path=/; SameSite=Lax`;
          } catch (cookieError) {
            console.error('Error escribiendo cookie:', cookieError);
          }

          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          const errorMessage = error instanceof Error ? error.message : 'Error de autenticación';
          return { 
            success: false, 
            error: errorMessage
          };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await AuthService.signOut();
        } catch (error) {
          console.error('Error durante logout:', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            lastActivity: null,
            isLoading: false
          });

          // Borrar cookie
          document.cookie = 'auth-storage=; Max-Age=0; path=/; SameSite=Lax';
          
          // Redirigir al login
          window.location.href = '/login';
        }
      }
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        lastActivity: state.lastActivity
      })
    }
  )
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
