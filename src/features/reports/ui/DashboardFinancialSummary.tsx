import { useState, useEffect } from "react";
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiPercent, FiFileText } from "react-icons/fi";
import { reportesService, ReportData } from "@/services/reportesService";

interface DashboardFinancialSummaryProps {
  period: string;
}

interface FinancialKPIData {
  id: string;
  title: string;
  value: string;
  trend: number;
  icon: React.ElementType;
  description: string;
  subValue?: string;
}

export function DashboardFinancialSummary({ period }: DashboardFinancialSummaryProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Siempre usar "Último mes" para el dashboard
        const data = await reportesService.getReportData("Último mes");
        setReportData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Resumen Financiero
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Principales métricas del período actual
            </p>
          </div>
          <div className="text-xs px-3 py-1 rounded-full" style={{ 
            backgroundColor: 'var(--accent-bg)', 
            color: 'var(--accent-text)' 
          }}>
            Último mes
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div 
                className="p-4 rounded-xl border"
                style={{ 
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-subtle)'
                }}
              >
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-6 bg-gray-300 rounded mb-1"></div>
                <div className="h-3 bg-gray-300 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Resumen Financiero
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Principales métricas del período actual
            </p>
          </div>
          <div className="text-xs px-3 py-1 rounded-full" style={{ 
            backgroundColor: 'var(--accent-bg)', 
            color: 'var(--accent-text)' 
          }}>
            Último mes
          </div>
        </div>
        <div 
          className="p-6 rounded-xl border text-center"
          style={{ 
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <p style={{ color: 'var(--text-danger)' }}>Error al cargar los datos: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 rounded-lg"
            style={{ 
              backgroundColor: 'var(--accent-bg)',
              color: 'var(--accent-text)'
            }}
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }

  if (!reportData) return null;

  // Convertir datos reales a formato KPI
  const dashboardKPIs: FinancialKPIData[] = [
    {
      id: "total_sales",
      title: "TOTAL VENTAS",
      value: reportesService.formatCurrency(reportData.kpis.totalVentas.value),
      trend: reportData.kpis.totalVentas.trend,
      icon: FiDollarSign,
      description: "Ingresos brutos totales del mes",
      subValue: reportData.kpis.totalVentas.previous 
        ? `vs ${reportesService.formatCurrency(reportData.kpis.totalVentas.previous)} anterior`
        : "Sin datos previos"
    },
    {
      id: "net",
      title: "NETO",
      value: reportesService.formatCurrency(reportData.kpis.neto.value),
      trend: reportData.kpis.neto.trend,
      icon: FiFileText,
      description: "Base imponible del mes",
      subValue: "Valor neto antes de impuestos"
    },
    {
      id: "avg_ticket",
      title: "TICKET PROMEDIO",
      value: reportesService.formatCurrency(reportData.kpis.ticketPromedio.value),
      trend: reportData.kpis.ticketPromedio.trend,
      icon: FiDollarSign,
      description: "Valor promedio de cotizaciones vendidas",
      subValue: `${reportData.kpis.ticketPromedio.transacciones || 0} cotizaciones del mes`
    },
    {
      id: "growth",
      title: "CRECIMIENTO",
      value: `${reportData.kpis.crecimientoMensual.value >= 0 ? '+' : ''}${reportesService.formatPercentage(reportData.kpis.crecimientoMensual.value)}`,
      trend: reportData.kpis.crecimientoMensual.trend,
      icon: FiTrendingUp,
      description: "vs mes anterior",
      subValue: `Meta: +${reportData.kpis.crecimientoMensual.meta || 12}%`
    }
  ];
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Resumen Financiero
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Principales métricas del período actual
          </p>
        </div>
        <div className="text-xs px-3 py-1 rounded-full" style={{ 
          backgroundColor: 'var(--accent-bg)', 
          color: 'var(--accent-text)' 
        }}>
          {period}
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {dashboardKPIs.map((kpi) => {
          const Icon = kpi.icon;
          const isPositiveTrend = kpi.trend > 0;
          const TrendIcon = isPositiveTrend ? FiTrendingUp : FiTrendingDown;
          
          return (
            <div
              key={kpi.id}
              className="group p-4 rounded-xl border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-default"
              style={{ 
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ 
                    backgroundColor: kpi.id === 'total_sales' || kpi.id === 'growth' ? 'var(--accent-bg)' : 
                                   kpi.id === 'net' ? 'var(--green-bg)' : 
                                   'var(--orange-bg)'
                  }}
                >
                  <Icon 
                    className="w-4 h-4"
                    style={{
                      color: kpi.id === 'total_sales' || kpi.id === 'growth' ? 'var(--accent-text)' : 
                            kpi.id === 'net' ? 'var(--green-color)' : 
                            'var(--orange-color)'
                    }}
                  />
                </div>
                
                <div style={{
                  color: isPositiveTrend ? 'var(--green-color)' : 'var(--red-color)'
                }} className="flex items-center gap-1 text-xs font-medium">
                  <TrendIcon className="w-3 h-3" />
                  {Math.abs(kpi.trend)}%
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <p className="text-xs font-bold tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  {kpi.title}
                </p>
                <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {kpi.value}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {kpi.subValue}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
