import { ReportPeriod } from "@/app/dashboard/reportes/page";

interface TopProductsReportProps {
  period: ReportPeriod;
}

interface ProductData {
  rank: number;
  name: string;
  sales: number;
  revenue: string;
  color: string;
}

// Datos mock para productos más vendidos
const mockProductsData: ProductData[] = [
  {
    rank: 1,
    name: "Consultoría Estratégica",
    sales: 15,
    revenue: "$22.500",
    color: "#8b5cf6"
  },
  {
    rank: 2,
    name: "Desarrollo Web Personalizado",
    sales: 8,
    revenue: "$40.000",
    color: "#06b6d4"
  },
  {
    rank: 3,
    name: "Licencia Microsoft Office 365",
    sales: 45,
    revenue: "$3.375",
    color: "#10b981"
  },
  {
    rank: 4,
    name: "Soporte Técnico Mensual",
    sales: 12,
    revenue: "$9.600",
    color: "#f59e0b"
  },
  {
    rank: 5,
    name: "Aplicación Mobile iOS/Android",
    sales: 3,
    revenue: "$24.000",
    color: "#ef4444"
  }
];

export function TopProductsReport({  }: TopProductsReportProps) {
  return (
    <div className="space-y-4">
      {mockProductsData.map((product) => (
        <div 
          key={product.rank}
          className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg transition-all duration-200 hover:scale-[1.01]"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          {/* Ranking badge */}
          <div 
            className="flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: product.color }}
          >
            #{product.rank}
          </div>

          {/* Información del producto */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm mb-1 truncate" style={{ color: 'var(--text-primary)' }}>
              {product.name}
            </h4>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {product.sales} ventas
            </p>
          </div>

          {/* Revenue */}
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              {product.revenue}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              ingresos
            </p>
          </div>

          {/* Barra de progreso visual */}
          <div className="w-20 flex-shrink-0">
            <div 
              className="h-2 rounded-full"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  backgroundColor: product.color,
                  width: `${Math.min((product.sales / 50) * 100, 100)}%`
                }}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Resumen */}
      <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center justify-between text-sm">
          <span style={{ color: 'var(--text-secondary)' }}>
            Total productos activos
          </span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            83 productos
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span style={{ color: 'var(--text-secondary)' }}>
            Ingresos top 5
          </span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            $99,475
          </span>
        </div>
      </div>
    </div>
  );
}
