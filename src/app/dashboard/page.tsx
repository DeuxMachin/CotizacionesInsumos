"use client";

import dynamic from "next/dynamic";

import { QuickActions } from "@/features/dashboard/ui/QuickActions";

const UnifiedAuditLog = dynamic(() => import("@/components/UnifiedAuditLog"), {
  ssr: false,
  loading: () => <div className="rounded-xl p-6 animate-pulse" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
    <div className="mb-4">
      <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
      <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          <div className="flex-1">
            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-3 w-1/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
});

const DashboardFinancialSummary = dynamic(() => import("@/features/reports/ui/DashboardFinancialSummary").then(m => m.DashboardFinancialSummary), {
  ssr: false,
  loading: () => <div className="rounded-xl p-6 animate-pulse" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
    <div className="mb-4">
      <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
      <div className="h-3 w-56 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-28 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
      ))}
    </div>
  </div>
});

const MonthlySalesChart = dynamic(() => import("@/features/reports/ui/MonthlySalesChart").then(m => m.MonthlySalesChart), {
  ssr: false,
  loading: () => <div className="rounded-xl p-6 animate-pulse" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
    <div className="mb-4">
      <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
      <div className="h-3 w-56 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
    <div className="h-64 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
  </div>
});

// Componentes de reportes removidos - se rediseñarán desde cero

export default function DashboardPage() {
  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 animate-fadeIn">
      {/* Acciones rápidas */}
      <QuickActions />
      
      {/* Resumen Financiero */}
      <DashboardFinancialSummary period="Últimos 6 meses" />
      
      {/* Grid de contenido secundario */}
      <div className="grid gap-3 sm:gap-4 lg:gap-6 xl:grid-cols-2">
        {/* Actividad reciente */}
        <UnifiedAuditLog mode="dashboard" limit={5} />

        {/* Gráfico de ventas mensuales */}
        <div className="rounded-xl" style={{ overflow: 'hidden' }}>
          <MonthlySalesChart period="Últimos 6 meses" />
        </div>
      </div>
    </div>
  );
}
