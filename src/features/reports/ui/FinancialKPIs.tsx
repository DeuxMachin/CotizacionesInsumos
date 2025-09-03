import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiPercent, FiFileText } from "react-icons/fi";
import { ReportPeriod } from "@/app/dashboard/reportes/page";

interface FinancialKPIsProps {
  period: ReportPeriod;
}

interface FinancialKPIData {
  id: string;
  title: string;
  value: string;
  trend: number;
  icon: React.ElementType;
  color: string;
  description: string;
  subValue?: string;
}

// KPIs financieros basados en la imagen y adaptados al negocio
const mockFinancialKPIs: FinancialKPIData[] = [
  {
    id: "total_sales",
    title: "TOTAL VENTAS",
    value: "$20.245.836",
    trend: 15.2,
    icon: FiDollarSign,
    color: "text-blue-600 dark:text-blue-400",
    description: "Ingresos brutos totales del período",
    subValue: "vs $17.608.492 anterior"
  },
  {
    id: "exempt",
    title: "EXENTO",
    value: "$0",
    trend: 0,
    icon: FiPercent,
    color: "text-gray-600 dark:text-gray-400",
    description: "Ventas exentas de IVA",
    subValue: "Sin cambios"
  },
  {
    id: "net",
    title: "NETO",
    value: "$17.013.308",
    trend: 12.8,
    icon: FiFileText,
    color: "text-green-600 dark:text-green-400",
    description: "Valor neto antes de impuestos",
    subValue: "Base imponible"
  },
  {
    id: "iva",
    title: "IVA",
    value: "$3.232.528",
    trend: 12.8,
    icon: FiPercent,
    color: "text-purple-600 dark:text-purple-400",
    description: "Impuesto al Valor Agregado (19%)",
    subValue: "19% sobre neto"
  }
];

// KPIs adicionales de rendimiento
const mockPerformanceKPIs: FinancialKPIData[] = [
  {
    id: "avg_ticket",
    title: "TICKET PROMEDIO",
    value: "$215.275",
    trend: 8.5,
    icon: FiDollarSign,
    color: "text-orange-600 dark:text-orange-400",
    description: "Valor promedio por transacción",
    subValue: "94 transacciones"
  },
  {
    id: "conversion_rate",
    title: "TASA CONVERSIÓN",
    value: "67.3%",
    trend: 4.2,
    icon: FiTrendingUp,
    color: "text-emerald-600 dark:text-emerald-400",
    description: "Cotizaciones convertidas a ventas",
    subValue: "140 cotizaciones"
  },
  {
    id: "monthly_growth",
    title: "CRECIMIENTO MENSUAL",
    value: "+15.2%",
    trend: 2.1,
    icon: FiTrendingUp,
    color: "text-cyan-600 dark:text-cyan-400",
    description: "Crecimiento vs mes anterior",
    subValue: "Meta: +12%"
  },
  {
    id: "client_retention",
    title: "RETENCIÓN CLIENTES",
    value: "84.5%",
    trend: 1.8,
    icon: FiFileText,
    color: "text-indigo-600 dark:text-indigo-400",
    description: "Clientes que repiten compras",
    subValue: "169 clientes activos"
  }
];

export function FinancialKPIs({ period }: FinancialKPIsProps) {
  return (
    <div className="space-y-6">
      {/* KPIs Financieros Principales */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Resumen Financiero
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {mockFinancialKPIs.map((kpi) => {
            const Icon = kpi.icon;
            const isPositiveTrend = kpi.trend > 0;
            const TrendIcon = isPositiveTrend ? FiTrendingUp : FiTrendingDown;
            
            return (
              <div
                key={kpi.id}
                className="group p-5 rounded-xl border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-default relative overflow-hidden"
                style={{ 
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-subtle)'
                }}
              >
                {/* Icono y tendencia en header */}
                <div className="flex items-center justify-between mb-4">
                  <div 
                    className="p-3 rounded-lg"
                    style={{ 
                      backgroundColor: kpi.id === 'total_sales' ? 'var(--accent-bg)' :
                                     kpi.id === 'exempt' ? 'var(--bg-tertiary)' :
                                     kpi.id === 'net' ? 'var(--green-bg)' :
                                     'var(--purple-bg)'
                    }}
                  >
                    <Icon 
                      className="w-5 h-5"
                      style={{
                        color: kpi.id === 'total_sales' ? 'var(--accent-text)' :
                               kpi.id === 'exempt' ? 'var(--text-secondary)' :
                               kpi.id === 'net' ? 'var(--green-color)' :
                               'var(--purple-color)'
                      }}
                    />
                  </div>
                  
                  {kpi.trend !== 0 && (
                    <div style={{
                      backgroundColor: isPositiveTrend ? 'var(--green-bg)' : 'var(--red-bg)',
                      color: isPositiveTrend ? 'var(--green-color)' : 'var(--red-color)'
                    }} className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold">
                      <TrendIcon className="w-3 h-3" />
                      {Math.abs(kpi.trend)}%
                    </div>
                  )}
                </div>

                {/* Título */}
                <div className="mb-3">
                  <p className="text-xs font-bold tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    {kpi.title}
                  </p>
                </div>

                {/* Valor principal */}
                <div className="mb-3">
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {kpi.value}
                  </p>
                  {kpi.subValue && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      {kpi.subValue}
                    </p>
                  )}
                </div>

                {/* Descripción */}
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-tertiary)' }}>
                  {kpi.description}
                </p>

                {/* Barra de progreso visual para algunos KPIs */}
                {(kpi.id === 'net' || kpi.id === 'iva') && (
                  <div className="pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div 
                      className="h-1.5 rounded-full overflow-hidden mb-2"
                      style={{ backgroundColor: 'var(--bg-tertiary)' }}
                    >
                      <div 
                        className="h-full transition-all duration-1000 rounded-full"
                        style={{ 
                          width: kpi.id === 'net' ? '84%' : '16%',
                          background: kpi.id === 'net' 
                            ? 'var(--green-gradient)' 
                            : 'var(--purple-gradient)'
                        }}
                      ></div>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {kpi.id === 'net' ? '84% del total' : '16% del total'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Métricas de Rendimiento con diseño más compacto */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Métricas de Rendimiento
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {mockPerformanceKPIs.map((kpi) => {
            const Icon = kpi.icon;
            const isPositiveTrend = kpi.trend > 0;
            const TrendIcon = isPositiveTrend ? FiTrendingUp : FiTrendingDown;
            
            return (
              <div
                key={kpi.id}
                className="group p-4 rounded-xl border transition-all duration-300 hover:shadow-md hover:scale-[1.01] cursor-default"
                style={{ 
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-subtle)'
                }}
              >
                {/* Header compacto */}
                <div className="flex items-center justify-between mb-3">
                  <div 
                    className="p-2 rounded-lg"
                    style={{
                      backgroundColor: kpi.id === 'avg_ticket' ? 'var(--orange-bg)' :
                                     kpi.id === 'conversion_rate' ? 'var(--green-bg)' :
                                     kpi.id === 'monthly_growth' ? 'var(--accent-bg)' :
                                     'var(--indigo-bg)'
                    }}
                  >
                    <Icon 
                      className="w-4 h-4"
                      style={{
                        color: kpi.id === 'avg_ticket' ? 'var(--orange-color)' :
                               kpi.id === 'conversion_rate' ? 'var(--green-color)' :
                               kpi.id === 'monthly_growth' ? 'var(--accent-text)' :
                               'var(--indigo-color)'
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

                {/* Contenido principal */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                    {kpi.title}
                  </p>
                  <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
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
    </div>
  );
}
