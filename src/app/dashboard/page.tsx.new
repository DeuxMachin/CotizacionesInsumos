"use client";

import { QuickActions } from "@/features/dashboard/ui/QuickActions";
import { RecentActivity } from "@/features/dashboard/ui/RecentActivity";
import { SalesSummaryKPIs } from "@/features/reports/ui/SalesSummaryKPIs";
import { SalesTrendChart } from "@/features/reports/ui/SalesTrendChart";
import { PeriodToggle } from "@/features/reports/ui/PeriodToggle";
import { useState } from "react";

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
