'use client'

import { useState } from 'react'

export default function TestAuthPage() {
  const [loading, setLoading] = useState(false)
  type CreateUserResult = {
    email: string
    status: 'created' | 'skipped' | 'error'
    message: string
  }
  const [results, setResults] = useState<CreateUserResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const createTestUsers = async () => {
    setLoading(true)
    setError(null)
    setResults([])

    try {
      const response = await fetch('/api/auth/create-test-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ createTestUsers: true }),
      })

      const result = await response.json()

      if (result.success) {
        setResults(result.data)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Error al crear usuarios de prueba')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()
      
      if (result.success) {
        // role alias: backend envía rol (DB) y añadimos role como alias en nuevos endpoints
        const role = result.data.user.role || result.data.user.rol
        alert(`Login exitoso para ${email}!\nRol: ${role}`)
      } else {
        alert(`Error de login: ${result.error}`)
      }
    } catch (err) {
      alert('Error al probar login')
      console.error(err)
    }
  }

  const testCredentials = [
    { email: 'admin@empresa.com', password: 'admin123', rol: 'admin' },
    { email: 'vendedor@empresa.com', password: 'vendedor123', rol: 'vendedor' },
    { email: 'cliente@empresa.com', password: 'cliente123', rol: 'cliente' }
  ]

  return (
    <div 
      className="min-h-screen p-6"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div 
          className="rounded-xl p-6 shadow-md border"
          style={{ 
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Configuración de Autenticación
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Crear usuarios de prueba y probar el sistema de autenticación
          </p>
        </div>

        {/* Crear usuarios de prueba */}
        <div 
          className="rounded-xl p-6 shadow-md border"
          style={{ 
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <h2 
            className="text-xl font-semibold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Paso 1: Crear Usuarios de Prueba
          </h2>
          
          <button
            onClick={createTestUsers}
            disabled={loading}
            className="px-6 py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: loading ? '#9ca3af' : 'var(--accent-primary)' }}
          >
            {loading ? 'Creando usuarios...' : 'Crear Usuarios de Prueba'}
          </button>

          {error && (
            <div 
              className="mt-4 p-4 rounded-lg border"
              style={{ 
                backgroundColor: 'var(--danger-bg)',
                borderColor: 'var(--danger)',
                color: 'var(--danger-text)'
              }}
            >
              {error}
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-4">
              <h3 
                className="font-semibold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Resultados:
              </h3>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded border ${
                      result.status === 'created' ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200' :
                      result.status === 'skipped' ? 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200' :
                      'bg-red-50 border-red-200 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-200'
                    }`}
                  >
                    <strong>{result.email}</strong> - {result.status}: {result.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Probar login */}
        <div 
          className="rounded-xl p-6 shadow-md border"
          style={{ 
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <h2 
            className="text-xl font-semibold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Paso 2: Probar Credenciales
          </h2>
          
          <div className="grid gap-4">
            {testCredentials.map((cred, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 rounded-lg border"
                style={{ 
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-subtle)'
                }}
              >
                <div>
                  <p 
                    className="font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {cred.email}
                  </p>
                  <p 
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Contraseña: {cred.password} | Rol: {cred.rol}
                  </p>
                </div>
                <button
                  onClick={() => testLogin(cred.email, cred.password)}
                  className="px-4 py-2 rounded-lg text-white font-medium transition-colors"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  Probar Login
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Información */}
        <div 
          className="rounded-xl p-6 shadow-md border"
          style={{ 
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <h2 
            className="text-xl font-semibold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Paso 3: Usar el Login
          </h2>
          
          <p style={{ color: 'var(--text-secondary)' }} className="mb-4">
            Una vez creados los usuarios de prueba, puedes ir a la página de login y usar cualquiera de estas credenciales:
          </p>

          <div className="space-y-2 mb-4">
            {testCredentials.map((cred, index) => (
              <div key={index} className="font-mono text-sm p-2 rounded" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <span style={{ color: 'var(--text-primary)' }}>{cred.email}</span> / <span style={{ color: 'var(--text-primary)' }}>{cred.password}</span>
              </div>
            ))}
          </div>

          <a
            href="/login"
            className="inline-block px-6 py-3 rounded-lg text-white font-medium transition-colors"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            Ir al Login
          </a>
        </div>
      </div>
    </div>
  )
}
