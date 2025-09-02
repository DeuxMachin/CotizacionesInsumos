"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const QuickActions = dynamic(() => import("@/features/dashboard/ui/QuickActions").then(m => m.QuickActions), {
  ssr: false,
  loading: () => <div className="rounded-xl p-6 animate-pulse" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
    <div className="mb-4">
      <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
      <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-20 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
      ))}
    </div>
  </div>
});

const RecentActivity = dynamic(() => import("@/features/dashboard/ui/RecentActivity").then(m => m.RecentActivity), {
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

const SalesTrendChart = dynamic(() => import("@/features/reports/ui/SalesTrendChart").then(m => m.SalesTrendChart), {
  ssr: false,
  loading: () => <div className="h-64 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }} />
});

const PeriodToggle = dynamic(() => import("@/features/reports/ui/PeriodToggle").then(m => m.PeriodToggle), {
  ssr: false,
  loading: () => <div className="inline-flex rounded-lg overflow-hidden h-8 w-32 animate-pulse" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}></div>
});

export default function DashboardPage() {
  const [trendPeriod, setTrendPeriod] = useState<"month" | "year">("month");

  return (
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
  );
}
