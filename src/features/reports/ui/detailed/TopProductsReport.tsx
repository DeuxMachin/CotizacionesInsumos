"use client";

import { useState, useEffect } from "react";
import { ReportPeriod, ReportType } from "@/app/dashboard/reportes/page";
import { supabase } from "@/lib/supabase";

interface TopProductsReportProps {
  period: ReportPeriod;
  reportType: ReportType;
}

interface ProductData {
  rank: number;
  name: string;
  sales: number;
  revenue: string;
  color: string;
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

export function TopProductsReport({ period, reportType }: TopProductsReportProps) {
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
        const products: ProductData[] = arr.map((p, index) => ({
          rank: index + 1,
          name: p.nombre,
          sales: p.cantidad,
          revenue: new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(p.ingresos),
          color: getProductColor(index)
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
            <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
              <div className="w-20 h-2 bg-gray-300 rounded"></div>
            </div>
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
    const amount = parseInt(product.revenue.replace(/[$.]/g, '').replace(/\./g, '')) || 0;
    return sum + amount;
  }, 0);
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
            Productos mostrados
          </span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {productsToShow.length} productos
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span style={{ color: 'var(--text-secondary)' }}>
            Ingresos top {productsToShow.length}
          </span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalIngresos)}
          </span>
        </div>
      </div>
    </div>
  );
}
