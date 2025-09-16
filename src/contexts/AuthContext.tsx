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
    // Intentar obtener usuario desde localStorage o sessionStorage
    const loadUserFromStorage = () => {
      try {
        const storedUser = localStorage.getItem('currentUser')
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser)
          console.log('👤 Loaded user from storage:', parsedUser)
          setUser(parsedUser)
        }
      } catch (error) {
        console.error('Error loading user from storage:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserFromStorage()
  }, [])

  // Guardar usuario en localStorage cuando cambie
  useEffect(() => {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user))
      console.log('💾 Saved user to storage:', user)
    } else {
      localStorage.removeItem('currentUser')
    }
  }, [user])

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
