"use client";

import { useState } from "react";
import { FiBarChart2, FiFileText, FiDollarSign } from "react-icons/fi";
import { CategoryDistributionChart } from "@/features/reports/ui/charts/CategoryDistributionChart";
import { TopProductsChart } from "@/features/reports/ui/charts/TopProductsChart";
import { ClientStatusChart } from "@/features/reports/ui/charts/ClientStatusChart";
import { MonthlyQuotesChart } from '@/features/reports/ui/MonthlyQuotesChart';
import { SalesFinancialSummary } from '@/features/reports/ui/SalesFinancialSummary';

export type ReportPeriod = "Última semana" | "Último mes" | "Últimos 3 meses" | "Últimos 6 meses" | "Último año";
export type ReportType = "cotizaciones" | "ventas";

export default function ReportesPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>("Últimos 6 meses");
  const [reportType, setReportType] = useState<ReportType>("cotizaciones");

  const periods: ReportPeriod[] = [
    "Última semana",
    "Último mes",
    "Últimos 3 meses", 
    "Últimos 6 meses",
    "Último año"
  ];

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 animate-fadeIn">
      {/* Header con selector de período */}
      <div className="flex flex-col gap-3 sm:gap-4 px-1 sm:px-2 py-1 sm:py-2">
        {/* Título y descripción */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 rounded-xl" style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
              <FiBarChart2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Reportes
              </h1>
              <p className="text-xs sm:text-sm mt-0.5 sm:mt-1" style={{ color: 'var(--text-secondary)' }}>
                Analiza el rendimiento de cotizaciones y ventas
              </p>
            </div>
          </div>

          {/* Selector de período */}
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as ReportPeriod)}
              className="appearance-none px-3 sm:px-4 py-2 sm:py-2.5 pr-10 rounded-lg border text-xs sm:text-sm font-medium min-w-[140px] sm:min-w-[180px] focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
              style={{ 
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
            >
              {periods.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Tabs para seleccionar tipo de reporte */}
        <div className="flex gap-2 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <button
            onClick={() => setReportType("cotizaciones")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              reportType === "cotizaciones" ? 'shadow-sm' : ''
            }`}
            style={{
              backgroundColor: reportType === "cotizaciones" ? 'var(--bg-primary)' : 'transparent',
              color: reportType === "cotizaciones" ? 'var(--accent-text)' : 'var(--text-secondary)',
              borderColor: reportType === "cotizaciones" ? 'var(--border-subtle)' : 'transparent',
              borderWidth: reportType === "cotizaciones" ? '1px' : '0'
            }}
          >
            <FiFileText className="w-4 h-4" />
            <span>Cotizaciones</span>
          </button>
          <button
            onClick={() => setReportType("ventas")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              reportType === "ventas" ? 'shadow-sm' : ''
            }`}
            style={{
              backgroundColor: reportType === "ventas" ? 'var(--bg-primary)' : 'transparent',
              color: reportType === "ventas" ? 'var(--accent-text)' : 'var(--text-secondary)',
              borderColor: reportType === "ventas" ? 'var(--border-subtle)' : 'transparent',
              borderWidth: reportType === "ventas" ? '1px' : '0'
            }}
          >
            <FiDollarSign className="w-4 h-4" />
            <span>Notas de Venta</span>
          </button>
        </div>

        {/* Descripción del tipo de reporte (diseño mejorado) */}
        <div className="relative overflow-hidden rounded-xl shadow-lg" style={{ backgroundColor: 'var(--accent-bg)' }}>
          {/* Gradiente decorativo sutil */}
          <div className="absolute inset-0 opacity-5" style={{ 
            background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 100%)'
          }} />
          
          <div className="relative px-4 py-5 sm:px-8 sm:py-7 flex flex-col sm:flex-row items-start gap-6">
            {/* Contenido principal */}
            <div className="flex-1 min-w-0 space-y-5">
              {/* Header con badge */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-md" 
                     style={{ 
                       backgroundColor: 'rgba(255, 255, 255, 0.2)',
                       backdropFilter: 'blur(10px)'
                     }}>
                  {reportType === "cotizaciones" ? (
                    <FiFileText className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: 'var(--accent-text)' }} />
                  ) : (
                    <FiDollarSign className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: 'var(--accent-text)' }} />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-base sm:text-xl font-bold tracking-tight" style={{ color: 'var(--accent-text)' }}>
                    {reportType === "cotizaciones" ? 'Resumen de Cotizaciones' : 'Resumen de Notas de Venta'}
                  </h2>
                  <p className="text-xs sm:text-sm mt-1.5 font-medium opacity-90" style={{ color: 'var(--accent-text)' }}>
                    {reportType === "cotizaciones"
                      ? 'Analiza propuestas y comportamiento de tus clientes en el periodo seleccionado.'
                      : 'Analiza ventas reales, ingresos y comportamiento por producto en el periodo seleccionado.'}
                  </p>
                </div>
              </div>

              {/* Tarjetas de beneficios con diseño mejorado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-3 p-3 rounded-lg backdrop-blur-sm" 
                     style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-sm">
                    <FiBarChart2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--accent-text)' }}>
                      Clientes Activos
                    </p>
                    <p className="text-[10px] sm:text-xs mt-0.5 opacity-80" style={{ color: 'var(--accent-text)' }}>
                      Identifica quiénes generan más actividad
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg backdrop-blur-sm" 
                     style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-sm">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--accent-text)' }}>
                      Productos Estrella
                    </p>
                    <p className="text-[10px] sm:text-xs mt-0.5 opacity-80" style={{ color: 'var(--accent-text)' }}>
                      Detecta los más cotizados o vendidos
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg backdrop-blur-sm" 
                     style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--accent-text)' }}>
                      Tendencias
                    </p>
                    <p className="text-[10px] sm:text-xs mt-0.5 opacity-80" style={{ color: 'var(--accent-text)' }}>
                      Sigue la evolución día a día
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg backdrop-blur-sm" 
                     style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-sm">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--accent-text)' }}>
                      Conciliación
                    </p>
                    <p className="text-[10px] sm:text-xs mt-0.5 opacity-80" style={{ color: 'var(--accent-text)' }}>
                      Facilita el cierre contable mensual
                    </p>
                  </div>
                </div>
              </div>

              {/* Badge del periodo */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-sm" 
                   style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)' }}>
                <svg className="w-4 h-4" style={{ color: 'var(--accent-text)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs sm:text-sm font-bold" style={{ color: 'var(--accent-text)' }}>
                  {selectedPeriod}
                </span>
              </div>
            </div>

            {/* Tarjeta IMPORTANTE rediseñada */}
            <div className="w-full sm:w-72 flex-shrink-0">
              <div className="relative overflow-hidden rounded-xl shadow-xl" 
                   style={{ 
                     backgroundColor: 'var(--bg-primary)',
                     border: '2px solid var(--border-subtle)'
                   }}>
                {/* Borde superior decorativo */}
                <div className="h-1 bg-gradient-to-r from-orange-400 via-red-400 to-pink-400" />
                
                <div className="p-4 sm:p-5">
                  {/* Badge IMPORTANTE */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3"
                       style={{ backgroundColor: 'var(--accent-bg)' }}>
                    <svg className="w-4 h-4" style={{ color: 'var(--accent-text)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--accent-text)' }}>
                      Importante
                    </span>
                  </div>
                  
                  {/* Contenido */}
                  <h3 className="text-sm sm:text-base font-bold mb-2 leading-snug" style={{ color: 'var(--text-primary)' }}>
                    Se recomienda ver los reportes por computadora
                  </h3>
                  <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                    En pantalla completa tendrás acceso a tablas detalladas, filtros avanzados y funciones de exportación que no están disponibles en móvil.
                  </p>
                  
                  {/* Lista de beneficios desktop */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Tablas interactivas completas</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Visual completa, ya que al estar de movil se puede ver mal</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Filtros y búsqueda avanzada</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen Financiero */}
      <SalesFinancialSummary period={selectedPeriod} reportType={reportType} />

      {/* Gráfico principal a lo largo del tiempo */}
      <MonthlyQuotesChart period={selectedPeriod} reportType={reportType} />
      
      {/* Gráficos adicionales por tipo */}
      {reportType === "cotizaciones" && (
        <>
          {/* Distribución por Categoría */}
          <div 
              className="p-4 sm:p-6 rounded-xl border"
              style={{ 
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <div className="mb-4 sm:mb-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                      Distribución por Categoría
                    </h3>
                    <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Visualiza cómo se distribuyen tus cotizaciones entre diferentes categorías de productos
                    </p>
                  </div>
                </div>
              </div>
              <CategoryDistributionChart period={selectedPeriod} reportType={reportType} />
            </div>

          {/* Reportes detallados */}
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Productos más cotizados */}
            <div 
              className="p-4 sm:p-6 rounded-xl border"
              style={{ 
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Productos Más Cotizados
                </h3>
                <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Top 5 productos que más aparecen en cotizaciones
                </p>
              </div>
              <TopProductsChart period={selectedPeriod} reportType={reportType} />
            </div>

            {/* Estado de Clientes */}
            <div 
              className="p-4 sm:p-6 rounded-xl border"
              style={{ 
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Estado de Clientes
                </h3>
                <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Distribución actual de tu cartera de clientes
                </p>
              </div>
              <ClientStatusChart period={selectedPeriod} />
            </div>
          </div>
        </>
      )}
      {reportType === "ventas" && (
        <>
          {/* Ventas por Categoría */}
          <div 
              className="p-4 sm:p-6 rounded-xl border"
              style={{ 
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <div className="mb-4 sm:mb-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                      Ventas por Categoría
                    </h3>
                    <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Distribución de las ventas por categoría de producto
                    </p>
                  </div>
                </div>
              </div>
              <CategoryDistributionChart period={selectedPeriod} reportType={reportType} />
            </div>

          {/* Reportes detallados ventas */}
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Productos más vendidos */}
            <div 
              className="p-4 sm:p-6 rounded-xl border"
              style={{ 
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Productos Más Vendidos
                </h3>
                <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Top 5 productos por cantidad vendida
                </p>
              </div>
              <TopProductsChart period={selectedPeriod} reportType={reportType} />
            </div>

            {/* Estado de Clientes (se mantiene igual) */}
            <div 
              className="p-4 sm:p-6 rounded-xl border"
              style={{ 
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Estado de Clientes
                </h3>
                <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Distribución actual de tu cartera de clientes
                </p>
              </div>
              <ClientStatusChart period={selectedPeriod} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
