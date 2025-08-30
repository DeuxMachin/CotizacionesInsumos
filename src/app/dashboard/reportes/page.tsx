"use client";

import { useState } from "react";
import { FinancialSummaryChart } from "@/features/reports/ui/FinancialSummaryChart";
import { AdminReports } from "@/features/reports/ui/AdminReports";
import { SellerReports } from "@/features/reports/ui/SellerReports";
import { SalesSummaryKPIs } from "@/features/reports/ui/SalesSummaryKPIs";
import { SalesTrendChart } from "@/features/reports/ui/SalesTrendChart";
import { PeriodToggle } from "@/features/reports/ui/PeriodToggle";
import { useAuth } from "@/features/auth/model/useAuth";

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
