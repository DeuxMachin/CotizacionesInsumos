import { ReportPeriod } from "@/app/dashboard/reportes/page";

interface ClientStatusReportProps {
  period: ReportPeriod;
}

interface ClientStatusData {
  status: string;
  count: number;
  percentage: number;
  color: string;
  description: string;
}

// Datos mock para el estado de clientes
const mockClientStatusData: ClientStatusData[] = [
  {
    status: "Activos",
    count: 156,
    percentage: 78,
    color: "#10b981",
    description: "Clientes con actividad reciente"
  },
  {
    status: "Prospectos",
    count: 34,
    percentage: 17,
    color: "#06b6d4",
    description: "Clientes potenciales en proceso"
  },
  {
    status: "Inactivos",
    count: 10,
    percentage: 5,
    color: "#6b7280",
    description: "Sin actividad en el período"
  }
];

export function ClientStatusReport({ period }: ClientStatusReportProps) {
  const totalClients = mockClientStatusData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-6">
      {/* Lista de estados */}
      <div className="space-y-4">
        {mockClientStatusData.map((status, index) => (
          <div 
            key={status.status}
            className="space-y-3"
          >
            {/* Header del estado */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                  {status.status}
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {status.count}
                </span>
                <span className="text-xs ml-1" style={{ color: 'var(--text-tertiary)' }}>
                  ({status.percentage}%)
                </span>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="relative">
              <div 
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <div 
                  className="h-full transition-all duration-700 ease-out rounded-full"
                  style={{ 
                    backgroundColor: status.color,
                    width: `${status.percentage}%`
                  }}
                />
              </div>
            </div>

            {/* Descripción */}
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {status.description}
            </p>
          </div>
        ))}
      </div>

      {/* Estadísticas adicionales */}
      <div className="space-y-4 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="grid grid-cols-2 gap-4">
          <div 
            className="p-3 rounded-lg text-center"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {totalClients}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Total clientes
            </p>
          </div>
          
          <div 
            className="p-3 rounded-lg text-center"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              +{Math.floor(totalClients * 0.08)}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Nuevos este mes
            </p>
          </div>
        </div>

        {/* Métricas de engagement */}
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Tasa de conversión
            </span>
            <span className="text-sm font-bold text-green-600 dark:text-green-400">
              67%
            </span>
          </div>
          <div 
            className="h-2 rounded-full"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-700"
              style={{ width: '67%' }}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
            Prospectos convertidos a clientes activos
          </p>
        </div>
      </div>
    </div>
  );
}
