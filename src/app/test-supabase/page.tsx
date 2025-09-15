// Página de prueba de conexión con Supabase - Con tema y datos completos
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useClientes, useCotizaciones, useProductos, useObras, useUsuarios, useTargets, useEstadisticas } from '@/hooks/useSupabase'

// Componente para mostrar estadísticas
function StatsCard({ title, value, subtitle, color = 'blue' }: {
  title: string
  value: string | number
  subtitle?: string
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red'
}) {


  return (
    <div 
      className="rounded-xl p-6 text-white bg-gradient-to-r shadow-md"
      style={{ 
        backgroundImage: `linear-gradient(to right, var(--${color}-color), var(--${color}-color)dd)`,
        boxShadow: 'var(--shadow-md)'
      }}
    >
      <h3 className="text-sm font-medium opacity-90">{title}</h3>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {subtitle && <p className="text-sm opacity-75 mt-1">{subtitle}</p>}
    </div>
  )
}

// Componente para mostrar tablas
type ColumnDef<T extends Record<string, unknown>> = {
  key: keyof T & string;
  label: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
};

function DataTable<T extends Record<string, unknown>>({ title, data, columns, loading, error }: {
  title: string
  data: T[]
  columns: ColumnDef<T>[]
  loading: boolean
  error: string | null
}) {
  return (
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
        {title}
      </h2>

      {loading && (
        <div className="text-center py-8">
          <div 
            className="inline-block animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: 'var(--accent-primary)' }}
          ></div>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
            Cargando {title.toLowerCase()}...
          </p>
        </div>
      )}

      {error && (
        <div 
          className="p-4 rounded-lg border"
          style={{ 
            backgroundColor: 'var(--danger-bg)',
            borderColor: 'var(--danger)',
            color: 'var(--danger-text)'
          }}
        >
          Error al cargar {title.toLowerCase()}: {error}
        </div>
      )}

      {data && data.length > 0 && (
        <div>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
            Total de registros: <span className="font-semibold">{data.length}</span>
          </p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  {columns.map((column) => (
                    <th 
                      key={column.key}
                      className="px-4 py-3 text-left text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 10).map((row, index) => (
                  <tr 
                    key={index} 
                    className="border-t"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    {columns.map((column) => (
                      <td 
                        key={column.key}
                        className="px-4 py-3 text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {column.render 
                          ? column.render(row[column.key], row)
                          : (row[column.key] as React.ReactNode) || '-'
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length > 10 && (
              <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                Mostrando primeros 10 de {data.length} registros
              </p>
            )}
          </div>
        </div>
      )}

      {data && data.length === 0 && !loading && !error && (
        <p 
          className="text-center py-8"
          style={{ color: 'var(--text-muted)' }}
        >
          No hay {title.toLowerCase()} para mostrar
        </p>
      )}
    </div>
  )
}

export default function SupabaseTestPage() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Usar los hooks personalizados para obtener datos
  const { data: clientes, loading: loadingClientes, error: errorClientes, refetch: refetchClientes } = useClientes()
  const { data: cotizaciones, loading: loadingCotizaciones, error: errorCotizaciones } = useCotizaciones()
  const { data: productos, loading: loadingProductos, error: errorProductos } = useProductos()
  const { data: obras, loading: loadingObras, error: errorObras } = useObras()
  const { data: usuarios, loading: loadingUsuarios, error: errorUsuarios } = useUsuarios()
  const { data: targets, loading: loadingTargets, error: errorTargets } = useTargets()
  const { data: estadisticas } = useEstadisticas()

  // Probar la conexión al cargar el componente
  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      setConnectionStatus('checking')
      setErrorMessage(null)

      // Hacer una consulta simple para probar la conexión
      const {  error } = await supabase
        .from('clientes')
        .select('count')
        .limit(1)

      if (error) {
        throw error
      }

      setConnectionStatus('connected')
    } catch (error) {
      console.error('Error de conexión:', error)
      setConnectionStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido')
    }
  }

  const createTestCliente = async () => {
    try {
      const testCliente = {
        rut: `${Math.floor(Math.random() * 90000000) + 10000000}-${Math.floor(Math.random() * 10)}`,
        nombre_razon_social: `Cliente de Prueba ${new Date().getTime()}`,
        tipo: 'empresa' as const,
        estado: 'activo'
      }

      const {  error } = await supabase
        .from('clientes')
        .insert(testCliente)
        .select()
        .single()

      if (error) throw error

      alert('Cliente de prueba creado exitosamente!')
      refetchClientes() // Recargar la lista
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear cliente: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    }
  }

  return (
    <div 
      className="min-h-screen p-6"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
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
            Dashboard de Prueba - Supabase
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Conexión completa con la base de datos y pruebas de todas las entidades
          </p>
        </div>

        {/* Estado de conexión */}
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
            Estado de Conexión
          </h2>
          
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-4 h-4 rounded-full ${
              connectionStatus === 'checking' ? 'bg-yellow-500' :
              connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span 
              className="font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {connectionStatus === 'checking' && 'Verificando conexión...'}
              {connectionStatus === 'connected' && 'Conectado exitosamente'}
              {connectionStatus === 'error' && 'Error de conexión'}
            </span>
          </div>
          
          {errorMessage && (
            <div 
              className="mb-4 p-4 rounded-lg border"
              style={{ 
                backgroundColor: 'var(--danger-bg)',
                borderColor: 'var(--danger)',
                color: 'var(--danger-text)'
              }}
            >
              {errorMessage}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={testConnection}
              className="px-4 py-2 rounded-lg text-white font-medium transition-colors"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              Probar Conexión
            </button>
            
            <button
              onClick={createTestCliente}
              className="px-4 py-2 rounded-lg text-white font-medium transition-colors bg-green-600 hover:bg-green-700"
            >
              Crear Cliente de Prueba
            </button>
          </div>

          <div className="mt-4 text-sm space-y-1" style={{ color: 'var(--text-muted)' }}>
            <p><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
            <p><strong>Anon Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...</p>
          </div>
        </div>

        {/* Estadísticas generales */}
        {estadisticas && (
          <div>
            <h2 
              className="text-2xl font-bold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Estadísticas Generales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard 
                title="Clientes" 
                value={estadisticas.clientes.total}
                subtitle={`${estadisticas.clientes.activos} activos`}
                color="blue"
              />
              <StatsCard 
                title="Cotizaciones" 
                value={estadisticas.cotizaciones.total}
                subtitle={`$${estadisticas.cotizaciones.valor_total.toLocaleString('es-CL')}`}
                color="green"
              />
              <StatsCard 
                title="Productos" 
                value={estadisticas.productos.total}
                subtitle={`${estadisticas.productos.activos} activos`}
                color="orange"
              />
              <StatsCard 
                title="Obras" 
                value={estadisticas.obras.total}
                subtitle="Total en sistema"
                color="purple"
              />
            </div>
          </div>
        )}

        {/* Tablas de datos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Clientes */}
          <DataTable
            title="Clientes"
            data={clientes || []}
            loading={loadingClientes}
            error={errorClientes}
            columns={[
              { key: 'rut', label: 'RUT' },
              { key: 'nombre_razon_social', label: 'Razón Social' },
              { key: 'tipo', label: 'Tipo' },
              { 
                key: 'estado', 
                label: 'Estado',
                render: (value) => (
                  <span 
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      value === 'activo' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {value}
                  </span>
                )
              }
            ]}
          />

          {/* Cotizaciones */}
          <DataTable
            title="Cotizaciones"
            data={cotizaciones || []}
            loading={loadingCotizaciones}
            error={errorCotizaciones}
            columns={[
              { key: 'folio', label: 'Folio' },
              { 
                key: 'cliente_principal', 
                label: 'Cliente',
                render: (value) => value?.nombre_razon_social || '-'
              },
              { 
                key: 'estado', 
                label: 'Estado',
                render: (value) => (
                  <span 
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      value === 'aprobada' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      value === 'enviada' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      value === 'borrador' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {value}
                  </span>
                )
              },
              { 
                key: 'total_final', 
                label: 'Total',
                render: (value) => `$${value?.toLocaleString('es-CL') || '0'}`
              }
            ]}
          />

          {/* Productos */}
          <DataTable
            title="Productos"
            data={productos || []}
            loading={loadingProductos}
            error={errorProductos}
            columns={[
              { key: 'sku', label: 'SKU' },
              { key: 'nombre', label: 'Nombre' },
              { key: 'unidad', label: 'Unidad' },
              { 
                key: 'precio_venta_neto', 
                label: 'Precio',
                render: (value) => `$${value?.toLocaleString('es-CL') || '0'}`
              }
            ]}
          />

          {/* Obras */}
          <DataTable
            title="Obras"
            data={obras || []}
            loading={loadingObras}
            error={errorObras}
            columns={[
              { key: 'nombre', label: 'Nombre' },
              { 
                key: 'cliente', 
                label: 'Cliente',
                render: (value) => value?.nombre_razon_social || '-'
              },
              { key: 'ciudad', label: 'Ciudad' },
              { 
                key: 'vendedor', 
                label: 'Vendedor',
                render: (value) => value ? `${value.nombre} ${value.apellido}` : '-'
              }
            ]}
          />

          {/* Usuarios */}
          <DataTable
            title="Usuarios"
            data={usuarios || []}
            loading={loadingUsuarios}
            error={errorUsuarios}
            columns={[
              { 
                key: 'nombre', 
                label: 'Nombre',
                render: (value, row) => `${value || ''} ${row.apellido || ''}`.trim() || '-'
              },
              { key: 'email', label: 'Email' },
              { 
                key: 'rol', 
                label: 'Rol',
                render: (value) => (
                  <span 
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      value === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                      value === 'vendedor' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {value}
                  </span>
                )
              },
              { 
                key: 'activo', 
                label: 'Estado',
                render: (value) => (
                  <span 
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      value 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {value ? 'Activo' : 'Inactivo'}
                  </span>
                )
              }
            ]}
          />

          {/* Targets */}
          <DataTable
            title="Targets"
            data={targets || []}
            loading={loadingTargets}
            error={errorTargets}
            columns={[
              { key: 'titulo', label: 'Título' },
              { 
                key: 'estado', 
                label: 'Estado',
                render: (value) => (
                  <span 
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      value === 'completado' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      value === 'en_progreso' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}
                  >
                    {value}
                  </span>
                )
              },
              { 
                key: 'prioridad', 
                label: 'Prioridad',
                render: (value) => (
                  <span 
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      value === 'alta' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      value === 'media' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {value}
                  </span>
                )
              },
              { key: 'ciudad', label: 'Ciudad' }
            ]}
          />
        </div>
      </div>
    </div>
  )
}
