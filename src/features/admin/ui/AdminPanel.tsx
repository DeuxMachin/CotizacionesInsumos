"use client";

import { useState, lazy, Suspense } from "react";
import { FiUsers, FiSettings, FiDatabase, FiBarChart } from "react-icons/fi";
import { UsersManagementPage } from "./UsersManagementPage";
import { useAdminStats, useSimpleUserCount } from '@/hooks/useSupabase';

// Lazy load components
const SystemConfiguration = lazy(() => import("./SystemConfiguration"));
const DatabaseManagement = lazy(() => import("./DatabaseManagement"));
const ReportsManagement = lazy(() => import("./ReportsManagement"));

const ComponentWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-bg)' }}></div>
    </div>
  }>
    {children}
  </Suspense>
);

type AdminSection = 
  | 'overview' 
  | 'users' 
  | 'configuration' 
  | 'database' 
  | 'reports';

interface AdminFeature {
  id: AdminSection;
  title: string;
  description: string;
  icon: React.ElementType;
  gradientFrom: string;
  gradientTo: string;
  category: 'core' | 'management';
}

const adminFeatures: AdminFeature[] = [
  {
    id: 'users',
    title: 'Gestión de Usuarios',
    description: 'Administra usuarios, roles y permisos del sistema',
    icon: FiUsers,
    gradientFrom: '#3B82F6',
    gradientTo: '#1D4ED8',
    category: 'core'
  },
  {
    id: 'configuration',
    title: 'Configuración del Sistema',
    description: 'Ajustes generales y personalización del sistema',
    icon: FiSettings,
    gradientFrom: '#8B5CF6',
    gradientTo: '#7C3AED',
    category: 'core'
  },
  {
    id: 'database',
    title: 'Base de Datos',
    description: 'Gestión y optimización de la base de datos',
    icon: FiDatabase,
    gradientFrom: '#10B981',
    gradientTo: '#047857',
    category: 'management'
  },
  {
    id: 'reports',
    title: 'Reportes y Analíticas',
    description: 'Generación de reportes y análisis de datos',
    icon: FiBarChart,
    gradientFrom: '#F59E0B',
    gradientTo: '#D97706',
    category: 'management'
  }
];

export function AdminPanel() {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  
  // Obtener datos reales de la base de datos
  const { data: adminStats, loading: loadingAdminStats, error: errorAdminStats } = useAdminStats();
  
  // Hook backup para usuarios
  const { data: userCount, loading: loadingUserCount } = useSimpleUserCount();
  

  
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'users':
        return <UsersManagementPage />;
      case 'configuration':
        return <ComponentWrapper><SystemConfiguration /></ComponentWrapper>;
      case 'database':
        return <ComponentWrapper><DatabaseManagement /></ComponentWrapper>;
      case 'reports':
        return <ComponentWrapper><ReportsManagement /></ComponentWrapper>;
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => {
    const categories = {
      core: 'Funciones Principales',
      management: 'Gestión del Sistema'
    } as const;

    return (
      <div className="animate-fadeIn">
        <div className="mb-8">
          <div 
            className="flex justify-center items-center rounded-full w-16 h-16 mx-auto mb-4"
            style={{ 
              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)'
            }}
          >
            <FiSettings className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: 'var(--text-primary)' }}>
            Panel de Administración
          </h1>
          <p className="text-center max-w-2xl mx-auto mb-8" style={{ color: 'var(--text-secondary)' }}>
            Bienvenido al centro de control del sistema. Desde aquí puedes gestionar usuarios, 
            configurar el sistema y generar reportes para el análisis de datos.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="rounded-2xl p-8 text-white transform hover:scale-105 transition-transform duration-200 shadow-xl"
               style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
            <div className="flex items-center justify-between mb-3">
              <FiUsers className="w-8 h-8 text-blue-200" />
            </div>
            <div className="text-3xl font-black mb-1">
              {(loadingAdminStats || loadingUserCount) ? (
                <div className="animate-pulse bg-blue-200 rounded w-12 h-8"></div>
              ) : errorAdminStats ? (
                // Usar backup si hay error
                userCount?.total || 0
              ) : (
                adminStats?.usuarios.total || userCount?.total || 0
              )}
            </div>
            <div className="text-blue-100 text-sm font-semibold uppercase tracking-wide">
              Usuarios Creados
            </div>
          </div>
          
          <div className="rounded-2xl p-8 text-white transform hover:scale-105 transition-transform duration-200 shadow-xl"
               style={{ background: 'linear-gradient(135deg, #10B981, #047857)' }}>
            <div className="flex items-center justify-between mb-3">
              <FiBarChart className="w-8 h-8 text-emerald-200" />
            </div>
            <div className="text-3xl font-black mb-1">
              {(loadingAdminStats || loadingUserCount) ? (
                <div className="animate-pulse bg-emerald-200 rounded w-16 h-8"></div>
              ) : (
                (() => {
                  const total = adminStats?.usuarios.total || userCount?.total || 1;
                  const activos = adminStats?.usuarios.activos || userCount?.activos || 0;
                  return `${((activos / Math.max(total, 1)) * 100).toFixed(1)}%`;
                })()
              )}
            </div>
            <div className="text-emerald-100 text-sm font-semibold uppercase tracking-wide">
              Usuarios Activos
            </div>
          </div>
          
          <div className="rounded-2xl p-8 text-white transform hover:scale-105 transition-transform duration-200 shadow-xl"
               style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
            <div className="flex items-center justify-between mb-3">
              <FiSettings className="w-8 h-8 text-purple-200" />
            </div>
            <div className="text-3xl font-black mb-1">
              {loadingAdminStats ? (
                <div className="animate-pulse bg-purple-200 rounded w-16 h-8"></div>
              ) : errorAdminStats ? (
                <span className="text-purple-200">0</span>
              ) : (
                (adminStats?.cotizaciones.total || 0).toLocaleString('es-CL')
              )}
            </div>
            <div className="text-purple-100 text-sm font-semibold uppercase tracking-wide">Cotizaciones</div>
          </div>
          
          <div className="rounded-2xl p-8 text-white transform hover:scale-105 transition-transform duration-200 shadow-xl"
               style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
            <div className="flex items-center justify-between mb-3">
              <FiDatabase className="w-8 h-8 text-orange-200" />
            </div>
            <div className="text-3xl font-black mb-1">
              {loadingAdminStats ? (
                <div className="animate-pulse bg-orange-200 rounded w-12 h-8"></div>
              ) : errorAdminStats ? (
                <span className="text-orange-200">$0M</span>
              ) : (
                `$${((adminStats?.cotizaciones.valorTotal || 0) / 1000000).toFixed(1)}M`
              )}
            </div>
            <div className="text-orange-100 text-sm font-semibold uppercase tracking-wide">Valor Total</div>
          </div>
        </div>

        {/* Métricas Detalladas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Usuarios por Rol */}
          <div 
            className="rounded-xl p-6 shadow-md border"
            style={{ 
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <h3 
              className="text-lg font-semibold mb-4 flex items-center gap-2"
              style={{ color: 'var(--text-primary)' }}
            >
              <FiUsers className="w-5 h-5" />
              Usuarios por Rol
            </h3>
            {loadingAdminStats ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: 'var(--text-secondary)' }}>Administradores</span>
                    <span style={{ color: 'var(--text-primary)' }}>{adminStats?.usuarios.porRol.admin || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ 
                        width: `${((adminStats?.usuarios.porRol.admin || 0) / Math.max((adminStats?.usuarios.total || 1), 1)) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: 'var(--text-secondary)' }}>Vendedores</span>
                    <span style={{ color: 'var(--text-primary)' }}>{adminStats?.usuarios.porRol.vendedor || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${((adminStats?.usuarios.porRol.vendedor || 0) / Math.max((adminStats?.usuarios.total || 1), 1)) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: 'var(--text-secondary)' }}>Clientes</span>
                    <span style={{ color: 'var(--text-primary)' }}>{adminStats?.usuarios.porRol.cliente || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ 
                        width: `${((adminStats?.usuarios.porRol.cliente || 0) / Math.max((adminStats?.usuarios.total || 1), 1)) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Estado de Cotizaciones */}
          <div 
            className="rounded-xl p-6 shadow-md border"
            style={{ 
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <h3 
              className="text-lg font-semibold mb-4 flex items-center gap-2"
              style={{ color: 'var(--text-primary)' }}
            >
              <FiBarChart className="w-5 h-5" />
              Estado de Cotizaciones
            </h3>
            {loadingAdminStats ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Borradores</span>
                  <span 
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)' }}
                  >
                    {adminStats?.cotizaciones.borradores || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Enviadas</span>
                  <span 
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info-text)' }}
                  >
                    {adminStats?.cotizaciones.enviadas || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Aprobadas</span>
                  <span 
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)' }}
                  >
                    {adminStats?.cotizaciones.aprobadas || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Promedio Valor</span>
                  <span 
                    className="text-sm font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    ${(adminStats?.cotizaciones.promedioValor || 0).toLocaleString('es-CL')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Actividad Reciente */}
          <div 
            className="rounded-xl p-6 shadow-md border"
            style={{ 
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <h3 
              className="text-lg font-semibold mb-4 flex items-center gap-2"
              style={{ color: 'var(--text-primary)' }}
            >
              <FiSettings className="w-5 h-5" />
              Actividad (30 días)
            </h3>
            {loadingAdminStats ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Nuevos Clientes
                  </div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {adminStats?.clientes.nuevosUltimoMes || 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Nuevas Cotizaciones
                  </div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {adminStats?.cotizaciones.nuevasUltimoMes || 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Usuarios Activos
                  </div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {adminStats?.usuarios.activosRecientes || 0}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {Object.entries(categories).map(([categoryKey, categoryName]) => (
          <div key={categoryKey} className="mb-8">
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              {categoryName}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {adminFeatures
                .filter(feature => feature.category === categoryKey)
                .map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <button
                      key={feature.id}
                      onClick={() => setActiveSection(feature.id)}
                      className="p-6 rounded-lg border transition-all duration-200 hover:shadow-md text-left"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div 
                          className="p-3 rounded-lg shadow-sm"
                          style={{ 
                            background: `linear-gradient(135deg, ${feature.gradientFrom}, ${feature.gradientTo})`,
                            color: 'white'
                          }}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                            {feature.title}
                          </h3>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {feature.description}
                          </p>
                          {feature.id === 'users' && (
                            <span 
                              className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded"
                              style={{ 
                                backgroundColor: 'var(--success-bg)',
                                color: 'var(--success-text)'
                              }}
                            >
                              Disponible
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    );
  };



  if (activeSection !== 'overview') {
    return (
      <div className="animate-fadeIn">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => setActiveSection('overview')}
            className="flex items-center gap-2 text-sm transition-colors hover:scale-105"
            style={{ color: 'var(--accent-text)' }}
          >
            ← Volver al Panel Principal
          </button>
        </div>
        
        {renderActiveSection()}
      </div>
    );
  }

  return renderActiveSection();
}
