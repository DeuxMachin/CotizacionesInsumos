import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiPercent, FiFileText } from "react-icons/fi";

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

// Solo los KPIs más importantes para el dashboard
const mockDashboardKPIs: FinancialKPIData[] = [
  {
    id: "total_sales",
    title: "TOTAL VENTAS",
    value: "$20.245.836",
    trend: 15.2,
    icon: FiDollarSign,
    description: "Ingresos brutos totales",
    subValue: "vs mes anterior"
  },
  {
    id: "net",
    title: "NETO",
    value: "$17.013.308",
    trend: 12.8,
    icon: FiFileText,
    description: "Base imponible",
    subValue: "84% del total"
  },
  {
    id: "avg_ticket",
    title: "TICKET PROMEDIO",
    value: "$215.275",
    trend: 8.5,
    icon: FiDollarSign,
    description: "Valor por transacción",
    subValue: "94 transacciones"
  },
  {
    id: "growth",
    title: "CRECIMIENTO",
    value: "+15.2%",
    trend: 2.1,
    icon: FiTrendingUp,
    description: "vs período anterior",
    subValue: "Meta: +12%"
  }
];

export function DashboardFinancialSummary({ period }: DashboardFinancialSummaryProps) {
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
        {mockDashboardKPIs.map((kpi) => {
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

              {/* Progress bar for some KPIs */}
              {kpi.id === 'net' && (
                <div className="mt-3 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div 
                    className="h-1 rounded-full overflow-hidden mb-1"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    <div 
                      className="h-full transition-all duration-1000"
                      style={{ 
                        width: '84%',
                        background: 'var(--green-gradient)' 
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
