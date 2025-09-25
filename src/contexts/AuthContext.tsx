"use client";

import { createContext, useContext, useEffect, useState } from 'react'

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
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load user from Zustand persisted state
    const loadUserFromZustand = () => {
      try {
        const storedState = localStorage.getItem('auth-storage')
        if (storedState) {
          const parsed = JSON.parse(storedState)
          if (parsed?.state?.user && parsed?.state?.isAuthenticated) {
            const zustandUser = parsed.state.user
            setUser({
              id: zustandUser.id,
              email: zustandUser.email,
              name: zustandUser.nombre,
              role: zustandUser.rol,
              isAdmin: zustandUser.rol === 'admin'
            })
          }
        }
      } catch (error) {
        console.error('Error loading user from Zustand storage:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserFromZustand()

    // Listen for storage changes to sync with Zustand
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth-storage') {
        loadUserFromZustand()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
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
