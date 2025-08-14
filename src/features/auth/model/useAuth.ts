"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

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
          const { password: _, ...userWithoutPassword } = user;
          set({ 
            user: userWithoutPassword, 
            isAuthenticated: true, 
            isLoading: false 
          });
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
        set({ user: null, isAuthenticated: false });
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
