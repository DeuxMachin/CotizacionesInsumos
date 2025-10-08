"use client";

import { useState, useEffect } from "react";
import { ReportPeriod, ReportType } from "@/app/dashboard/reportes/page";
import { supabase } from "@/lib/supabase";

interface TopProductsChartProps {
  period: ReportPeriod;
  reportType: ReportType;
}

interface ProductData {
  rank: number;
  name: string;
  sales: number;
  revenue: string;
  color: string;
  percentage: number;
}

interface ItemRecord {
  cantidad: number;
  total_neto: number;
  productos: { nombre: string } | { nombre: string }[];
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

export function TopProductsChart({ period, reportType }: TopProductsChartProps) {
  const [topProducts, setTopProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTopProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        // Rango de fechas según periodo
        const now = new Date();
        const startDate = new Date();
        switch (period) {
          case 'Última semana': startDate.setDate(now.getDate() - 7); break;
          case 'Último mes': startDate.setMonth(now.getMonth() - 1); break;
          case 'Últimos 3 meses': startDate.setMonth(now.getMonth() - 3); break;
          case 'Últimos 6 meses': startDate.setMonth(now.getMonth() - 6); break;
          case 'Último año': startDate.setFullYear(now.getFullYear() - 1); break;
          default: startDate.setMonth(now.getMonth() - 6);
        }

        // Traer items según tipo
        let items: ItemRecord[] = [];
        if (reportType === 'cotizaciones') {
          // Primero obtenemos las cotizaciones del periodo
          const { data: cotizaciones, error: cotError } = await supabase
            .from('cotizaciones')
            .select('id')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', now.toISOString());
          if (cotError) throw new Error(cotError.message);
          
          const cotizacionIds = (cotizaciones || []).map(c => c.id);
          if (cotizacionIds.length === 0) {
            setTopProducts([]);
            setLoading(false);
            return;
          }
          
          // Ahora obtenemos los items de esas cotizaciones
          const { data, error: itemsError } = await supabase
            .from('cotizacion_items')
            .select(`
              cantidad,
              total_neto,
              productos ( id, nombre )
            `)
            .in('cotizacion_id', cotizacionIds);
          if (itemsError) throw new Error(itemsError.message);
          items = data || [];
        } else {
          // Primero obtenemos las notas de venta del periodo
          const { data: notas, error: notasError } = await supabase
            .from('notas_venta')
            .select('id')
            .gte('fecha_emision', startDate.toISOString())
            .lte('fecha_emision', now.toISOString());
          if (notasError) throw new Error(notasError.message);
          
          const notaIds = (notas || []).map(n => n.id);
          if (notaIds.length === 0) {
            setTopProducts([]);
            setLoading(false);
            return;
          }
          
          // Ahora obtenemos los items de esas notas
          const { data, error: itemsError } = await supabase
            .from('nota_venta_items')
            .select(`
              cantidad,
              total_neto,
              productos ( id, nombre )
            `)
            .in('nota_venta_id', notaIds);
          if (itemsError) throw new Error(itemsError.message);
          items = data || [];
        }

        // Agrupar por producto
        type Agg = { ingresos: number; cantidad: number; nombre: string };
        const map = new Map<string, Agg>();
        (items || []).forEach((it: ItemRecord) => {
          const nombre = (Array.isArray(it.productos) ? (it.productos[0] as { nombre: string })?.nombre : (it.productos as { nombre: string })?.nombre) || 'Producto';
          const key = nombre;
          const curr = map.get(key) || { ingresos: 0, cantidad: 0, nombre };
          curr.ingresos += it.total_neto || 0;
          curr.cantidad += it.cantidad || 0;
          map.set(key, curr);
        });

        // Ordenar por cantidad (ventas), no por ingresos
        const arr = Array.from(map.values()).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);
        const maxCantidad = arr.length ? Math.max(...arr.map(a => a.cantidad)) : 1;
        const products: ProductData[] = arr.map((p, index) => ({
          rank: index + 1,
          name: p.nombre,
          sales: p.cantidad,
          revenue: new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(p.ingresos),
          color: getProductColor(index),
          percentage: index === 0 ? 100 : Math.max(15, (p.cantidad / maxCantidad) * 100)
        }));

        setTopProducts(products);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
        setTopProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadTopProducts();
  }, [period, reportType]);

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
      </div>
    );
  }

  if (topProducts.length === 0) {
    return (
      <div className="text-center p-8">
        <div className="mb-4">
          <svg className="w-16 h-16 mx-auto" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          No hay productos en el período
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {reportType === 'cotizaciones' 
            ? 'Crea cotizaciones con productos para ver estadísticas'
            : 'Genera notas de venta con productos para ver estadísticas'}
        </p>
      </div>
    );
  }

  const productsToShow = topProducts;
  
  // Calcular totales dinámicos
  const totalIngresos = productsToShow.reduce((sum, product) => {
    const amount = parseInt(product.revenue.replace(/[$.]/g, '').replace(',', '')) || 0;
    return sum + amount;
  }, 0);
  
  const totalProductos = 83; // Este valor podría venir del endpoint
  const contribucionPorcentaje = 73; // Este valor podría calcularse dinámicamente

  return (
    <div className="space-y-3">
      {productsToShow.map((product, index) => (
        <div 
          key={product.rank}
          className="group relative p-2 sm:p-3 rounded-lg transition-colors hover:bg-opacity-50"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          {/* Header del producto */}
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div 
                className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-white text-xs sm:text-sm font-bold flex-shrink-0 shadow-sm"
                style={{ backgroundColor: product.color }}
              >
                #{product.rank}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-xs sm:text-sm truncate mb-1" style={{ color: 'var(--text-primary)' }}>
                  {product.name}
                </h4>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {product.sales} ventas
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2 sm:ml-4">
              <p className="font-bold text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                {product.revenue}
              </p>
              <div className="mt-1">
                <span 
                  className="text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full"
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
              {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalIngresos)}
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
