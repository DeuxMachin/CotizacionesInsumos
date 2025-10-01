"use client";

import { ReportPeriod, ReportType } from "@/app/dashboard/reportes/page";
import { SalesTrendChart } from "./charts/SalesTrendChart";
import { CategoryDistributionChart } from "./charts/CategoryDistributionChart";

interface ChartsGridProps {
  period: ReportPeriod;
  reportType: ReportType;
}

export function ChartsGrid({ period, reportType }: ChartsGridProps) {
  return (
    <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Gráfico de tendencia de ventas */}
      <div 
        className="p-3 sm:p-6 rounded-xl border"
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
        <SalesTrendChart period={period} />
      </div>

      {/* Gráfico de distribución por categoría */}
      <div 
        className="p-3 sm:p-6 rounded-xl border"
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
        <CategoryDistributionChart period={period} reportType={reportType} />
      </div>
    </div>
  );
}
