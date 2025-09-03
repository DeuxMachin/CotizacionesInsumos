"use client";

import { useState } from "react";
import { FiBarChart2, FiDownload } from "react-icons/fi";
import { SalesTrendChart } from "@/features/reports/ui/charts/SalesTrendChart";
import { CategoryDistributionChart } from "@/features/reports/ui/charts/CategoryDistributionChart";
import { TopProductsChart } from "@/features/reports/ui/charts/TopProductsChart";
import { ClientStatusChart } from "@/features/reports/ui/charts/ClientStatusChart";
import { FinancialKPIs } from '@/features/reports/ui/FinancialKPIs';
import { MonthlySalesChart } from '@/features/reports/ui/MonthlySalesChart';

export type ReportPeriod = "Último mes" | "Últimos 3 meses" | "Últimos 6 meses" | "Último año";

export default function ReportesPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>("Últimos 6 meses");

  const periods: ReportPeriod[] = [
    "Último mes",
    "Últimos 3 meses", 
    "Últimos 6 meses",
    "Último año"
  ];

  const handleExport = () => {
    alert("Función de exportar en desarrollo");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header con selector de período y botón exportar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-1">
        {/* Título y descripción */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
            <FiBarChart2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Reportes
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Analiza el rendimiento y genera reportes detallados
            </p>
          </div>
        </div>

        {/* Controles del período y exportar */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {/* Selector de período */}
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as ReportPeriod)}
              className="appearance-none px-4 py-2.5 pr-10 rounded-lg border text-sm font-medium min-w-[160px] focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
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

          {/* Botón exportar */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all hover:scale-105 active:scale-95"
            style={{ 
              backgroundColor: 'var(--accent-bg)',
              color: 'var(--accent-text)'
            }}
          >
            <FiDownload className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* KPIs Financieros Principales */}
      <FinancialKPIs period={selectedPeriod} />

      {/* Gráfico de Ventas Mensuales */}
      <MonthlySalesChart period={selectedPeriod} />
      
      {/* Gráficos principales */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Tendencia de Ventas */}
        <div 
          className="p-6 rounded-xl border"
          style={{ 
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Tendencia de Ventas
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Evolución de ventas en los últimos 6 meses
            </p>
          </div>
          <SalesTrendChart period={selectedPeriod} />
        </div>

        {/* Distribución por Categoría */}
        <div 
          className="p-6 rounded-xl border"
          style={{ 
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Distribución por Categoría
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Ventas por categoría de productos
            </p>
          </div>
          <CategoryDistributionChart period={selectedPeriod} />
        </div>
      </div>

      {/* Reportes detallados */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Productos más vendidos */}
        <div 
          className="p-6 rounded-xl border"
          style={{ 
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Productos Más Vendidos
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Top 5 productos por ingresos generados
            </p>
          </div>
          <TopProductsChart period={selectedPeriod} />
        </div>

        {/* Estado de Clientes */}
        <div 
          className="p-6 rounded-xl border"
          style={{ 
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Estado de Clientes
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Distribución de clientes por estado
            </p>
          </div>
          <ClientStatusChart period={selectedPeriod} />
        </div>
      </div>
    </div>
  );
}
