"use client";

import { useState, lazy, Suspense } from "react";
import { FiUsers, FiSettings, FiDatabase, FiBarChart } from "react-icons/fi";
import { UsersManagementPage } from "./UsersManagementPage";

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="rounded-2xl p-8 text-white transform hover:scale-105 transition-transform duration-200 shadow-xl"
               style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
            <div className="flex items-center justify-between mb-3">
              <FiUsers className="w-8 h-8 text-blue-200" />
            </div>
            <div className="text-3xl font-black mb-1">23</div>
            <div className="text-blue-100 text-sm font-semibold uppercase tracking-wide">Usuarios Activos</div>
          </div>
          
          <div className="rounded-2xl p-8 text-white transform hover:scale-105 transition-transform duration-200 shadow-xl"
               style={{ background: 'linear-gradient(135deg, #10B981, #047857)' }}>
            <div className="flex items-center justify-between mb-3">
              <FiBarChart className="w-8 h-8 text-emerald-200" />
            </div>
            <div className="text-3xl font-black mb-1">98.5%</div>
            <div className="text-emerald-100 text-sm font-semibold uppercase tracking-wide">Uptime</div>
          </div>
          
          <div className="rounded-2xl p-8 text-white transform hover:scale-105 transition-transform duration-200 shadow-xl"
               style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
            <div className="flex items-center justify-between mb-3">
              <FiSettings className="w-8 h-8 text-purple-200" />
            </div>
            <div className="text-3xl font-black mb-1">1,234</div>
            <div className="text-purple-100 text-sm font-semibold uppercase tracking-wide">Cotizaciones</div>
          </div>
          
          <div className="rounded-2xl p-8 text-white transform hover:scale-105 transition-transform duration-200 shadow-xl"
               style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
            <div className="flex items-center justify-between mb-3">
              <FiDatabase className="w-8 h-8 text-orange-200" />
            </div>
            <div className="text-3xl font-black mb-1">2.3GB</div>
            <div className="text-orange-100 text-sm font-semibold uppercase tracking-wide">Base de Datos</div>
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
