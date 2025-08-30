"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { auditLogger } from "@/shared/lib/auditLogger";

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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

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

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
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
            isLoading: false 
          });

          // Registrar login en auditoría
          auditLogger.logLogin(userWithoutPassword.id, userWithoutPassword.email, userWithoutPassword.role);
          
          return { success: true };
        } else {
          set({ isLoading: false });
          return { 
            success: false, 
            error: "Email o contraseña incorrectos" 
          };
        }
      },

      logout: () => {
        const currentUser = get().user;
        
        // Registrar logout en auditoría antes de limpiar el estado
        if (currentUser) {
          auditLogger.logLogout(currentUser.id, currentUser.email, currentUser.role);
        }
        
        set({ user: null, isAuthenticated: false });
        
        // Redirect to login page
        window.location.href = '/login';
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
