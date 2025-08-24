"use client";

import { useSection } from "@/features/navigation/model/useSection";
import { Sidebar } from "@/features/navigation/ui/Sidebar";
import { Header } from "@/features/navigation/ui/Header";
import { QuickActions } from "@/features/dashboard/ui/QuickActions";
import { RecentActivity } from "@/features/dashboard/ui/RecentActivity";
import { QuotesTable } from "@/features/quotes/ui/QuotesTable";
import { FiltersBar } from "@/features/quotes/ui/FiltersBar";
import { NewQuoteModal } from "@/features/quotes/ui/NewQuoteModal";
import { ToastHost } from "@/shared/ui/Toast";
import { ClientsPage } from "@/features/clients/ui/ClientsPage";
import StockPage from "@/features/stock/ui/StockPage";
import { AdminReports } from "@/features/reports/ui/AdminReports";
import { SellerReports } from "@/features/reports/ui/SellerReports";
import { FinancialSummaryChart } from "@/features/reports/ui/FinancialSummaryChart";
import { useAuth } from "@/features/auth/model/useAuth";
import { SalesSummaryKPIs } from "@/features/reports/ui/SalesSummaryKPIs";
import { SalesTrendChart } from "@/features/reports/ui/SalesTrendChart";
import { PeriodToggle } from "@/features/reports/ui/PeriodToggle";
import { useState } from "react";

export function DashboardContent() {
  const { section } = useSection();
  const { user } = useAuth();
  const role = (user?.role ?? "").toLowerCase();
  const isAdmin = role === "admin" || role.includes("admin");
  const [trendPeriod, setTrendPeriod] = useState<"month" | "year">("month");

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
                {/* KPIs principales (Total, Exento, Neto, IVA) */}
                <SalesSummaryKPIs />
                
                {/* Acciones rápidas */}
                <QuickActions />
                
                {/* Grid de contenido secundario */}
                <div className="grid gap-3 sm:gap-4 lg:gap-6 xl:grid-cols-2">
                  {/* Actividad reciente */}
                  <RecentActivity />

                  {/* Ventas en el tiempo con selector Mes/Año */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-end">
                      <PeriodToggle value={trendPeriod} onChange={setTrendPeriod} />
                    </div>
                    <SalesTrendChart period={trendPeriod} />
                  </div>
                </div>
              </div>
            )}

            {/* Gestión de Cotizaciones */}
            {section === "cotizaciones" && (
              <div className="space-y-3 sm:space-y-4 lg:space-y-6 animate-fadeIn">
                {/* Acciones de sección (evitar duplicar títulos del Header) */}
                <div className="flex items-start justify-end gap-2 sm:gap-3">
                  <button className="btn-secondary text-xs sm:text-sm">Exportar</button>
                  <NewQuoteModal.Trigger />
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
                {/* Acciones de sección (evitar duplicar títulos del Header) */}
                <div className="flex items-start justify-end">
                  <button className="btn-primary flex-shrink-0" onClick={() => { /* TODO: open create client modal */ }}>
                    <span>Nuevo Cliente</span>
                  </button>
                </div>
                <ClientsPage />
              </div>
            )}

            {/* Control de Stock */}
            {section === "stock" && (
              <StockPage />
            )}

            {/* Reportes y Análisis */}
            {section === "reportes" && (
              <div className="space-y-4 sm:space-y-6 animate-fadeIn">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* KPIs también visibles en Reportes para contexto */}
                    <SalesSummaryKPIs />
                  </div>
                  <div className="flex-shrink-0">
                    <button className="btn-secondary"><span>Exportar Reporte</span></button>
                  </div>
                </div>

                {/* Selector de periodo + Tendencia de ventas */}
                <div className="space-y-3">
                  <div className="flex items-center justify-end">
                    <PeriodToggle value={trendPeriod} onChange={setTrendPeriod} />
                  </div>
                  <SalesTrendChart period={trendPeriod} />
                </div>

                {/* Resumen financiero (compras/ventas/IVA) */}
                <div className="grid gap-3 sm:gap-4 lg:gap-6 xl:grid-cols-2">
                  <FinancialSummaryChart period={trendPeriod} />
                </div>

                {/* Reportes según rol */}
                {isAdmin ? <AdminReports period={trendPeriod} /> : <SellerReports period={trendPeriod} />}
              </div>
            )}

            {/* Vendedores - placeholder */}
            {section === "vendedores" && (
              <div className="space-y-4 sm:space-y-6 animate-fadeIn">
                <div className="bg-white rounded-xl border border-gray-100 p-6 sm:p-10 text-center">
                  <div className="max-w-lg mx-auto space-y-3">
                    <h3 className="text-xl font-semibold text-gray-900">Vendedores</h3>
                    <p className="text-gray-500">Trabajando...</p>
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

export default DashboardContent;
