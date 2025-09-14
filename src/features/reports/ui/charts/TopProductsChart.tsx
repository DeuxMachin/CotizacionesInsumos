"use client";

import { ReportPeriod } from "@/app/dashboard/reportes/page";

interface TopProductsChartProps {
  period: ReportPeriod;
}

interface ProductData {
  rank: number;
  name: string;
  sales: number;
  revenue: string;
  color: string;
  percentage: number;
}

// Datos mock para productos más vendidos
const mockProductsData: ProductData[] = [
  {
    rank: 1,
    name: "Consultoría Estratégica",
    sales: 15,
    revenue: "$22.500",
    color: "#8b5cf6",
    percentage: 85
  },
  {
    rank: 2,
    name: "Desarrollo Web Personalizado",
    sales: 8,
    revenue: "$40.000",
    color: "#06b6d4",
    percentage: 92
  },
  {
    rank: 3,
    name: "Licencia Microsoft Office 365",
    sales: 45,
    revenue: "$3.375",
    color: "#10b981",
    percentage: 78
  },
  {
    rank: 4,
    name: "Soporte Técnico Mensual",
    sales: 12,
    revenue: "$9.600",
    color: "#f59e0b",
    percentage: 65
  },
  {
    rank: 5,
    name: "Aplicación Mobile iOS/Android",
    sales: 3,
    revenue: "$24.000",
    color: "#ef4444",
    percentage: 95
  }
];

export function TopProductsChart({  }: TopProductsChartProps) {
  return (
    <div className="space-y-4">
      {mockProductsData.map((product) => (
        <div 
          key={product.rank}
          className="group relative"
        >
          {/* Header del producto */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div 
                className="flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: product.color }}
              >
                #{product.rank}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                  {product.name}
                </h4>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {product.sales} ventas
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                {product.revenue}
              </p>
            </div>
          </div>

          {/* Barra de progreso animada */}
          <div className="relative">
            <div 
              className="h-3 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              <div 
                className="h-full transition-all duration-1000 ease-out rounded-full relative"
                style={{ 
                  backgroundColor: product.color,
                  width: `${product.percentage}%`
                }}
              >
                {/* Efecto de brillo */}
                <div 
                  className="absolute inset-0 bg-white bg-opacity-20 rounded-full"
                  style={{
                    background: `linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)`
                  }}
                />
              </div>
            </div>
            
            {/* Porcentaje flotante */}
            <div 
              className="absolute right-2 top-0.5 text-xs font-medium text-white"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
            >
              {product.percentage}%
            </div>
          </div>
        </div>
      ))}

      {/* Resumen total con diseño mejorado */}
      <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                83
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Productos activos
              </p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                $99,475
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Ingresos Top 5
              </p>
            </div>
          </div>
          
          {/* Barra de contribución total */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Contribución al total
              </span>
              <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                73%
              </span>
            </div>
            <div 
              className="h-2 rounded-full"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-700"
                style={{ width: '73%' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
