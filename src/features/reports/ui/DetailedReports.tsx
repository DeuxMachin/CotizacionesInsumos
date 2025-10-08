"use client";

import { ReportPeriod, ReportType } from "@/app/dashboard/reportes/page";
import { TopProductsReport } from "./detailed/TopProductsReport";
import { ClientStatusReport } from "./detailed/ClientStatusReport";

interface DetailedReportsProps {
  period: ReportPeriod;
  reportType: ReportType;
}

export function DetailedReports({ period, reportType }: DetailedReportsProps) {
  return (
    <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Productos más vendidos */}
      <div 
        className="p-3 sm:p-6 rounded-xl border"
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
        <TopProductsReport period={period} reportType={reportType} />
      </div>

      {/* Estado de clientes */}
      <div 
        className="p-3 sm:p-6 rounded-xl border"
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
        <ClientStatusReport period={period} />
      </div>
    </div>
  );
}
