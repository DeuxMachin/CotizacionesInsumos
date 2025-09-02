"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/features/auth/model/useAuth";

const SalesSummaryKPIs = dynamic(() => import("@/features/reports/ui/SalesSummaryKPIs").then(m => m.SalesSummaryKPIs), {
  ssr: false,
  loading: () => <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="rounded-xl p-4 sm:p-5 shadow-sm animate-pulse" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
        <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    ))}
  </div>
});

const PeriodToggle = dynamic(() => import("@/features/reports/ui/PeriodToggle").then(m => m.PeriodToggle), {
  ssr: false,
  loading: () => <div className="inline-flex rounded-lg overflow-hidden h-8 w-32 animate-pulse" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}></div>
});

const SalesTrendChart = dynamic(() => import("@/features/reports/ui/SalesTrendChart").then(m => m.SalesTrendChart), {
  ssr: false,
  loading: () => <div className="h-64 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }} />
});
const FinancialSummaryChart = dynamic(() => import("@/features/reports/ui/FinancialSummaryChart").then(m => m.FinancialSummaryChart), {
  ssr: false,
  loading: () => <div className="h-64 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }} />
});
const AdminReports = dynamic(() => import("@/features/reports/ui/AdminReports").then(m => m.AdminReports), {
  ssr: false,
  loading: () => <div className="h-96 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }} />
});
const SellerReports = dynamic(() => import("@/features/reports/ui/SellerReports").then(m => m.SellerReports), {
  ssr: false,
  loading: () => <div className="h-96 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }} />
});

export default function ReportesPage() {
  const { user } = useAuth();
  const role = (user?.role ?? "").toLowerCase();
  const isAdmin = role === "admin" || role.includes("admin");
  const [trendPeriod, setTrendPeriod] = useState<"month" | "year">("month");

  return (
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
  );
}
