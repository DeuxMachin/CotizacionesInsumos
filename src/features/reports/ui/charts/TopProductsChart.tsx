"use client";

import { useState, useEffect } from "react";
import { ReportPeriod } from "@/app/dashboard/reportes/page";
import { reportesService, ReportData } from "@/services/reportesService";

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

export function TopProductsChart({ period }: TopProductsChartProps) {
  const [topProducts, setTopProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTopProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await reportesService.getReportData(period);
        
        // Convertir datos reales a formato ProductData
        const maxIngresos = Math.max(...data.topProductos.map(p => p.ingresos));
        const products: ProductData[] = data.topProductos.map((producto, index) => ({
          rank: index + 1,
          name: producto.nombre,
          sales: producto.cantidad,
          revenue: reportesService.formatCurrency(producto.ingresos),
          color: getProductColor(index),
          percentage: index === 0 ? 100 : Math.max(15, (producto.ingresos / maxIngresos) * 100)
        }));
        
        setTopProducts(products);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
        setTopProducts(mockProductsData); // Fallback a datos mock
      } finally {
        setLoading(false);
      }
    };

    loadTopProducts();
  }, [period]);

  // Función para asignar colores a los productos
  const getProductColor = (index: number): string => {
    const colors = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                <div className="space-y-1">
                  <div className="h-4 bg-gray-300 rounded w-32"></div>
                  <div className="h-3 bg-gray-300 rounded w-16"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-300 rounded w-16"></div>
            </div>
            <div className="h-3 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <p style={{ color: 'var(--text-danger)' }}>Error: {error}</p>
        <p style={{ color: 'var(--text-secondary)' }}>Mostrando datos de ejemplo</p>
      </div>
    );
  }

  const productsToShow = topProducts.length > 0 ? topProducts : mockProductsData;
  
  // Calcular totales dinámicos
  const totalIngresos = productsToShow.reduce((sum, product) => {
    // Extraer el número de la string de revenue (ej: "$20,808" -> 20808)
    const amount = parseInt(product.revenue.replace(/[$,]/g, '')) || 0;
    return sum + amount;
  }, 0);
  
  const totalProductos = 83; // Este valor podría venir del endpoint
  const contribucionPorcentaje = 73; // Este valor podría calcularse dinámicamente

  return (
    <div className="space-y-3">
      {productsToShow.map((product, index) => (
        <div 
          key={product.rank}
          className="group relative p-3 rounded-lg transition-colors hover:bg-opacity-50"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          {/* Header del producto */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div 
                className="flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold flex-shrink-0 shadow-sm"
                style={{ backgroundColor: product.color }}
              >
                #{product.rank}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-sm truncate mb-1" style={{ color: 'var(--text-primary)' }}>
                  {product.name}
                </h4>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {product.sales} ventas
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                {product.revenue}
              </p>
              <div className="mt-1">
                <span 
                  className="text-xs font-medium px-2 py-1 rounded-full"
                  style={{ 
                    backgroundColor: product.color + '20',
                    color: product.color
                  }}
                >
                  {Math.round(product.percentage)}%
                </span>
              </div>
            </div>
          </div>

          {/* Barra de progreso mejorada */}
          <div className="relative">
            <div 
              className="h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--border-subtle)' }}
            >
              <div 
                className="h-full transition-all duration-1000 ease-out rounded-full relative"
                style={{ 
                  backgroundColor: product.color,
                  width: `${product.percentage}%`,
                  boxShadow: `0 0 10px ${product.color}40`
                }}
              >
                {/* Efecto de brillo animado */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 rounded-full animate-pulse"
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Resumen total con diseño mejorado */}
      <div className="mt-6 pt-4">
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {totalProductos}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Productos activos
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold mb-1" 
               style={{ color: 'var(--success-text)' }}>
              {reportesService.formatCurrency(totalIngresos)}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Ingresos Top 5
            </p>
          </div>
        </div>
        
        {/* Barra de contribución total */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Contribución al total
            </span>
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {contribucionPorcentaje}%
            </span>
          </div>
          <div 
            className="h-3 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--border-subtle)' }}
          >
            <div 
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ 
                background: 'linear-gradient(90deg, #8b5cf6 0%, #06b6d4 100%)',
                width: `${contribucionPorcentaje}%`,
                boxShadow: '0 0 15px rgba(139, 92, 246, 0.3)'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
