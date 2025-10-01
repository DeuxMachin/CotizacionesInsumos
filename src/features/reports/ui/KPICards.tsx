import { FiDollarSign, FiFileText, FiUsers, FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import { ReportPeriod } from "@/app/dashboard/reportes/page";

interface KPICardsProps {
  period: ReportPeriod;
}

interface KPIData {
  id: string;
  title: string;
  value: string;
  trend: number;
  icon: React.ElementType;
  color: string;
  description: string;
}

// Datos mock - en producción vendrían de una API
const mockKPIData: KPIData[] = [
  {
    id: "sales",
    title: "Ventas Totales",
    value: "$328.000",
    trend: 12,
    icon: FiDollarSign,
    color: "text-green-600 dark:text-green-400",
    description: "Ingresos totales generados en el período seleccionado"
  },
  {
    id: "quotes",
    title: "Cotizaciones",
    value: "94",
    trend: 8,
    icon: FiFileText,
    color: "text-blue-600 dark:text-blue-400",
    description: "Número de cotizaciones generadas y gestionadas"
  },
  {
    id: "clients",
    title: "Clientes",
    value: "200",
    trend: 15,
    icon: FiUsers,
    color: "text-purple-600 dark:text-purple-400",
    description: "Total de clientes activos y nuevos registros"
  },
  {
    id: "growth",
    title: "Crecimiento",
    value: "18%",
    trend: -3,
    icon: FiTrendingUp,
    color: "text-orange-600 dark:text-orange-400",
    description: "Tasa de crecimiento comparado con el período anterior"
  }
];

export function KPICards({ period }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 px-1 sm:px-0">
      {mockKPIData.map((kpi) => {
        const Icon = kpi.icon;
        const isPositiveTrend = kpi.trend > 0;
        const TrendIcon = isPositiveTrend ? FiTrendingUp : FiTrendingDown;
        
        return (
          <div
            key={kpi.id}
            className="group p-3 sm:p-5 rounded-xl border transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-default"
            style={{ 
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            {/* Header con icono y título */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg bg-opacity-10 ${kpi.color.includes('green') ? 'bg-green-500' : 
                  kpi.color.includes('blue') ? 'bg-blue-500' : 
                  kpi.color.includes('purple') ? 'bg-purple-500' : 'bg-orange-500'}`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              
              {/* Indicador de tendencia */}
              <div className={`flex items-center gap-1 text-xs font-medium ${
                isPositiveTrend 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                <TrendIcon className="w-3 h-3" />
                {Math.abs(kpi.trend)}%
              </div>
            </div>

            {/* Título y valor principal */}
            <div className="space-y-1 mb-2">
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                {kpi.title}
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {kpi.value}
              </p>
            </div>

            {/* Descripción */}
            <p className="text-xs leading-relaxed group-hover:text-opacity-80 transition-all" 
               style={{ color: 'var(--text-tertiary)' }}>
              {kpi.description}
            </p>

            {/* Texto de comparación con período anterior */}
            <div className="mt-3 pt-3 border-t border-opacity-50" 
                 style={{ borderColor: 'var(--border-subtle)' }}>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {isPositiveTrend ? '+' : ''}{kpi.trend}% vs período anterior
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
