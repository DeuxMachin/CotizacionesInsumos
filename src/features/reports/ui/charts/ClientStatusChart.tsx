"use client";

import { ReportPeriod } from "@/app/dashboard/reportes/page";

interface ClientStatusChartProps {
  period: ReportPeriod;
}

interface ClientStatusData {
  status: string;
  count: number;
  percentage: number;
  color: string;
  description: string;
  icon: string;
}

// Datos mock para el estado de clientes
const mockClientStatusData: ClientStatusData[] = [
  {
    status: "Activos",
    count: 156,
    percentage: 78,
    color: "#10b981",
    description: "Clientes con actividad reciente",
    icon: "✓"
  },
  {
    status: "Prospectos",
    count: 34,
    percentage: 17,
    color: "#06b6d4",
    description: "Clientes potenciales en proceso",
    icon: "◐"
  },
  {
    status: "Inactivos",
    count: 10,
    percentage: 5,
    color: "#6b7280",
    description: "Sin actividad en el período",
    icon: "○"
  }
];

export function ClientStatusChart({  }: ClientStatusChartProps) {
  const totalClients = mockClientStatusData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-6">
      {/* Estados con barras horizontales mejoradas */}
      <div className="space-y-4">
        {mockClientStatusData.map((status) => (
          <div 
            key={status.status}
            className="group p-4 rounded-lg transition-all hover:scale-[1.01]"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            {/* Header del estado */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: status.color }}
                >
                  {status.icon}
                </div>
                <div>
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {status.status}
                  </span>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {status.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                  {status.count}
                </span>
                <span className="text-sm ml-2" style={{ color: 'var(--text-secondary)' }}>
                  ({status.percentage}%)
                </span>
              </div>
            </div>

            {/* Barra de progreso con animación */}
            <div className="relative">
              <div 
                className="h-4 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <div 
                  className="h-full transition-all duration-1000 ease-out rounded-full relative"
                  style={{ 
                    backgroundColor: status.color,
                    width: `${status.percentage}%`
                  }}
                >
                  {/* Efecto de gradiente */}
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)`
                    }}
                  />
                </div>
              </div>
              
              {/* Indicador de porcentaje */}
              <div 
                className="absolute right-2 top-0.5 text-xs font-bold text-white"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
              >
                {status.percentage}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Estadísticas adicionales mejoradas */}
      <div className="grid grid-cols-2 gap-4">
        <div 
          className="p-4 rounded-lg text-center group hover:scale-105 transition-transform"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <div className="mb-2">
            <div className="w-8 h-8 mx-auto rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm mb-2">
              Σ
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {totalClients}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Total clientes
            </p>
          </div>
        </div>
        
        <div 
          className="p-4 rounded-lg text-center group hover:scale-105 transition-transform"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <div className="mb-2">
            <div className="w-8 h-8 mx-auto rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm mb-2">
              +
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              +{Math.floor(totalClients * 0.08)}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Nuevos este mes
            </p>
          </div>
        </div>
      </div>

      {/* Métricas de conversión */}
      <div 
        className="p-4 rounded-lg"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                %
              </div>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Tasa de conversión
              </span>
            </div>
            <span className="text-lg font-bold text-green-600 dark:text-green-400">
              67%
            </span>
          </div>
        </div>
        
        <div 
          className="h-3 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000 relative"
            style={{ width: '67%' }}
          >
            <div 
              className="absolute inset-0 bg-white bg-opacity-20 rounded-full"
              style={{
                background: `linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)`
              }}
            />
          </div>
        </div>
        
        <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
          Prospectos convertidos a clientes activos
        </p>
      </div>
    </div>
  );
}
