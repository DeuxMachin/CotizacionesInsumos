"use client";

import { useSection } from "../features/navigation/model/useSection";
import { Sidebar } from "@/features/navigation/ui/Sidebar";
import { Header } from "@/features/navigation/ui/Header";
import { Stats } from "@/features/dashboard/ui/Stats";
import { QuickActions } from "@/features/dashboard/ui/QuickActions";
import { RecentActivity } from "@/features/dashboard/ui/RecentActivity";
import { QuotesTable } from "@/features/quotes/ui/QuotesTable";
import { FiltersBar } from "@/features/quotes/ui/FiltersBar";
import { NewQuoteModal } from "@/features/quotes/ui/NewQuoteModal";
import { ToastHost } from "@/shared/ui/Toast";
import { AuthWrapper } from "@/components/AuthWrapper";

function DashboardContent() {
  const { section } = useSection();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Navegación lateral */}
      <Sidebar />
      
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-h-screen ml-0 lg:ml-64">
        {/* Header fijo en la parte superior */}
        <Header />
        
        {/* Contenido scrolleable */}
        <main className="flex-1 overflow-auto">
          <div className="p-3 sm:p-4 lg:p-6">
            <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 lg:space-y-6">
            
            {/* Dashboard - Página principal con métricas */}
            {section === "dashboard" && (
              <div className="space-y-3 sm:space-y-4 lg:space-y-6 animate-fadeIn">
                {/* Estadísticas principales */}
                <Stats />
                
                {/* Acciones rápidas */}
                <QuickActions />
                
                {/* Grid de contenido secundario */}
                <div className="grid gap-3 sm:gap-4 lg:gap-6 xl:grid-cols-2">
                  {/* Actividad reciente */}
                  <RecentActivity />

                  {/* Placeholder para gráfico futuro */}
                  <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 min-h-[250px] sm:min-h-[300px] lg:min-h-[350px] flex items-center justify-center">
                    <div className="text-center space-y-3 sm:space-y-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-300 rounded animate-pulse"></div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">
                          Gráfico de Actividad Mensual
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Visualización de datos próximamente
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Gestión de Cotizaciones */}
            {section === "cotizaciones" && (
              <div className="space-y-3 sm:space-y-4 lg:space-y-6 animate-fadeIn">
                {/* Header de sección con acciones */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 display-font">
                      Gestión de Cotizaciones
                    </h2>
                    <p className="text-gray-600 mt-1 text-xs sm:text-sm lg:text-base">
                      Administra y controla todas tus cotizaciones
                    </p>
                  </div>
                  <div className="flex gap-2 sm:gap-3 flex-shrink-0">
                    <button className="btn-secondary text-xs sm:text-sm">
                      Exportar
                    </button>
                    <NewQuoteModal.Trigger />
                  </div>
                </div>
                
                {/* Barra de filtros */}
                <FiltersBar />
                
                {/* Tabla de cotizaciones */}
                <QuotesTable />
              </div>
            )}

            {/* Gestión de Clientes */}
            {section === "clientes" && (
              <div className="space-y-4 sm:space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 display-font">
                      Gestión de Clientes
                    </h2>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base">
                      Gestiona tu base de datos de clientes
                    </p>
                  </div>
                  <button className="btn-primary flex-shrink-0">
                    <span>Nuevo Cliente</span>
                  </button>
                </div>
                
                {/* Placeholder para contenido de clientes */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 sm:p-8 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <div className="w-8 h-8 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Módulo de Clientes
                    </h3>
                    <p className="text-gray-500 text-sm sm:text-base">
                      Esta sección estará disponible próximamente. 
                      Aquí podrás gestionar todos tus clientes.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Catálogo de Productos */}
            {section === "catalogo" && (
              <div className="space-y-4 sm:space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 display-font">
                      Catálogo de Productos
                    </h2>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base">
                      Organiza tu inventario de productos
                    </p>
                  </div>
                  <button className="btn-primary flex-shrink-0">
                    <span>Nuevo Producto</span>
                  </button>
                </div>
                
                {/* Placeholder para contenido de catálogo */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 sm:p-8 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <div className="w-8 h-8 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Catálogo de Productos
                    </h3>
                    <p className="text-gray-500 text-sm sm:text-base">
                      Esta sección estará disponible próximamente. 
                      Aquí podrás gestionar tu inventario.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Reportes y Análisis */}
            {section === "reportes" && (
              <div className="space-y-4 sm:space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 display-font">
                      Reportes y Análisis
                    </h2>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base">
                      Analiza el rendimiento de tu negocio
                    </p>
                  </div>
                  <button className="btn-secondary flex-shrink-0">
                    <span>Exportar Reporte</span>
                  </button>
                </div>
                
                {/* Placeholder para contenido de reportes */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 sm:p-8 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <div className="w-8 h-8 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Reportes y Métricas
                    </h3>
                    <p className="text-gray-500 text-sm sm:text-base">
                      Esta sección estará disponible próximamente. 
                      Aquí podrás ver análisis detallados.
                    </p>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </main>
      </div>

      {/* Modales y notificaciones globales */}
      <NewQuoteModal.Root />
      <ToastHost />
    </div>
  );
}

export default function HomePage() {
  return (
    <AuthWrapper>
      <DashboardContent />
    </AuthWrapper>
  );
}
