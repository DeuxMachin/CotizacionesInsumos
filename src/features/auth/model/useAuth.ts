"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { auditLogger } from "@/shared/lib/auditLogger";
import { useEffect } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastActivity: number | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateActivity: () => void;
}

// Tiempo de inactividad antes de cerrar sesión (10 minutos en milisegundos)
const INACTIVITY_TIMEOUT = 10 * 60 * 1000;

// Datos de prueba para el frontend
const mockUsers = [
  {
    id: "1",
    email: "admin@empresa.com",
    password: "admin123",
    name: "Administrador",
    role: "admin"
  },
  {
    id: "2", 
    email: "user@empresa.com",
    password: "user123",
    name: "Usuario",
    role: "user"
  },
  {
    id: "3",
    email: "demo@empresa.com", 
    password: "demo123",
    name: "Demo User",
    role: "demo"
  }
];

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

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          // Simular delay de red
          await new Promise(resolve => setTimeout(resolve, 1500));

          const user = mockUsers.find(
            u => u.email === email && u.password === password
          );

          if (user) {
            const { password: _pw, ...userWithoutPassword } = user;
            void _pw;
            
            set({ 
              user: userWithoutPassword, 
              isAuthenticated: true, 
              isLoading: false,
              lastActivity: Date.now()
            });

            // Registrar login en auditoría
            auditLogger.logLogin(userWithoutPassword.id, userWithoutPassword.email, userWithoutPassword.role);
            
            // Escribir cookie accesible por middleware
            try {
              const cookiePayload = encodeURIComponent(JSON.stringify({
                isAuthenticated: true,
                user: userWithoutPassword,
              }));
              document.cookie = `auth-storage=${cookiePayload}; path=/; SameSite=Lax`;
            } catch {}
            
            return { success: true };
          } else {
            set({ isLoading: false });
            return { 
              success: false, 
              error: "Email o contraseña incorrectos" 
            };
          }
        } catch (error) {
          console.error("Error en login:", error);
          set({ isLoading: false });
          return {
            success: false,
            error: "Error inesperado al iniciar sesión"
          };
        }
      },

      logout: () => {
        const currentUser = get().user;
        
        // Registrar logout en auditoría antes de limpiar el estado
        if (currentUser) {
          auditLogger.logLogout(currentUser.id, currentUser.email, currentUser.role);
        }
        
        set({ user: null, isAuthenticated: false, lastActivity: null });
        
  // Borrar cookie usada por middleware
  document.cookie = 'auth-storage=; Max-Age=0; path=/; SameSite=Lax';
        
  // Redirect to login page
  window.location.href = '/login';
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
        lastActivity: state.lastActivity
      }),
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
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    // Verificar inactividad cada minuto
    const checkInactivity = setInterval(() => {
      if (lastActivity && Date.now() - lastActivity > INACTIVITY_TIMEOUT) {
        // Mostrar mensaje antes de cerrar sesión
        alert('Su sesión ha expirado por inactividad.');
        logout();
      }
    }, 60000); // Revisar cada minuto

    return () => {
      // Limpiar event listeners
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      clearInterval(checkInactivity);
    };
  }, [isAuthenticated, lastActivity, logout, updateActivity]);
}
