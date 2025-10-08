"use client";

import { ReportPeriod, ReportType } from "@/app/dashboard/reportes/page";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

interface CategoryDistributionChartProps {
  period: ReportPeriod;
  reportType: ReportType;
}

interface ItemRecord {
  producto_id: number;
  total_neto: number;
  cantidad: number;
}

interface ProductoRecord {
  id: number;
  nombre: string;
  tipo_id: number | null;
}

interface TipoRecord {
  id: number;
  nombre: string;
}

interface CategoryData {
  category: string;
  value: number;
  color: string;
  amount: string;
  description: string;
}

// Colores para las categorías
const categoryColors = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899"];

// Mock data eliminado - ahora solo se muestran datos reales de la base de datos

export function CategoryDistributionChart({ period, reportType }: CategoryDistributionChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dataArr = categoryData; // Usar solo datos reales, sin fallback a mock
  
  // Cargar datos reales directamente desde Supabase
  useEffect(() => {
    const loadCategoryData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Determinar el rango de fechas según el período seleccionado
        const now = new Date();
        const startDate = new Date();
        
        switch (period) {
          case 'Última semana':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'Último mes':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'Últimos 3 meses':
            startDate.setMonth(now.getMonth() - 3);
            break;
          case 'Últimos 6 meses':
            startDate.setMonth(now.getMonth() - 6);
            break;
          case 'Último año':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
          default:
            startDate.setMonth(now.getMonth() - 6);
        }
        
        console.log(`🔍 [CategoryDistributionChart] Iniciando carga para ${reportType}, período: ${period}`);
        console.log(`📅 Rango de fechas: ${startDate.toISOString().split('T')[0]} a ${now.toISOString().split('T')[0]}`);
        
        // Obtener identificadores y items segun tipo de reporte
        let items: ItemRecord[] = [];
        if (reportType === 'cotizaciones') {
          // 1) Cotizaciones dentro del periodo
          console.log('📋 Buscando cotizaciones...');
          const { data: cotizacionesData, error: cotError } = await supabase
            .from('cotizaciones')
            .select('id')
            .gte('created_at', startDate.toISOString())
            .lt('created_at', now.toISOString());
          if (cotError) throw new Error(`Error al obtener cotizaciones: ${cotError.message}`);
          const cotizacionIds = (cotizacionesData || []).map(c => c.id);
          if (cotizacionIds.length === 0) {
            console.log('⚠️ No hay cotizaciones en el período');
            setCategoryData([]);
            setLoading(false);
            return;
          }
          console.log('📊 Cotizaciones encontradas:', cotizacionIds.length);
          const { data: cotizacionItems, error: itemsError } = await supabase
            .from('cotizacion_items')
            .select('id, cantidad, total_neto, producto_id')
            .in('cotizacion_id', cotizacionIds);
          if (itemsError) throw new Error(`Error al obtener items: ${itemsError.message}`);
          items = cotizacionItems || [];
        } else {
          // 1) Notas de venta dentro del periodo (usar created_at como en MonthlySalesChart)
          console.log('🛒 Buscando notas de venta...');
          const { data: notasData, error: notasError } = await supabase
            .from('notas_venta')
            .select('id')
            .gte('created_at', startDate.toISOString())
            .lt('created_at', now.toISOString());
          if (notasError) throw new Error(`Error al obtener notas de venta: ${notasError.message}`);
          const notasIds = (notasData || []).map(n => n.id);
          if (notasIds.length === 0) {
            console.log('⚠️ No hay notas de venta en el período');
            setCategoryData([]);
            setLoading(false);
            return;
          }
          console.log('📊 Notas de venta encontradas:', notasIds.length);
          const { data: ventaItems, error: itemsError } = await supabase
            .from('nota_venta_items')
            .select('id, cantidad, total_neto, producto_id')
            .in('nota_venta_id', notasIds);
          if (itemsError) throw new Error(`Error al obtener items de ventas: ${itemsError.message}`);
          items = ventaItems || [];
          console.log('📦 Items de nota_venta_items obtenidos:', items.length);
          if (items.length > 0) {
            console.log('📦 Primeros 5 items:', items.slice(0, 5));
            console.log('📦 IDs de notas de venta usados:', notasIds.slice(0, 5));
          } else {
            console.log('⚠️ No se encontraron items para las notas de venta encontradas');
          }
        }

        // 3) Obtener los productos únicos para mapear a su tipo (producto_tipos)
        const productIds = Array.from(new Set((items || []).map((i: ItemRecord) => i.producto_id).filter(Boolean)));
        console.log('📦 Product IDs encontrados:', productIds.length, productIds.slice(0, 10)); // Mostrar primeros 10

        if (productIds.length === 0) {
          console.log('⚠️ No hay productos en los items');
          setCategoryData([]);
          setLoading(false);
          return;
        }

        let productosById: Record<number, { nombre: string; tipo_id: number | null }> = {};
        const { data: productos, error: prodError } = await supabase
          .from('productos')
          .select('id, nombre, tipo_id')
          .in('id', productIds as number[]);
        if (prodError) throw new Error(`Error al obtener productos: ${prodError.message}`);
        console.log('🏷️ Productos obtenidos:', productos?.length || 0);
        if (productos && productos.length > 0) {
          console.log('🏷️ Primeros 5 productos:', productos.slice(0, 5));
        }
        productosById = (productos || []).reduce((acc: Record<number, { nombre: string; tipo_id: number | null }>, p: ProductoRecord) => {
          acc[p.id] = { nombre: p.nombre, tipo_id: p.tipo_id };
          return acc;
        }, {});

        // 4) Obtener los nombres de tipos de producto
        const tipoIds = Array.from(new Set(Object.values(productosById).map(p => p.tipo_id).filter(Boolean))) as number[];
        console.log('🏗️ Tipo IDs encontrados:', tipoIds.length, tipoIds);
        console.log('🏗️ Productos con tipo_id null:', Object.values(productosById).filter(p => p.tipo_id === null).length);
        
        let tiposById: Record<number, string> = {};
        if (tipoIds.length > 0) {
          const { data: tipos, error: tiposError } = await supabase
            .from('producto_tipos')
            .select('id, nombre')
            .in('id', tipoIds);
          if (tiposError) throw new Error(`Error al obtener tipos: ${tiposError.message}`);
          console.log('📂 Tipos obtenidos:', tipos?.length || 0, tipos);
          tiposById = (tipos || []).reduce((acc: Record<number, string>, t: TipoRecord) => {
            acc[t.id] = t.nombre;
            return acc;
          }, {});
        } else {
          console.log('⚠️ No hay tipos de producto asignados a los productos');
        }

        // 5) Agrupar por tipo de producto (categoría)
        const categoriesMap: Record<string, { total: number; count: number; categoryName: string }> = {};
        console.log(`🔄 Procesando ${items.length} items para agrupar por categoría`);
        
        (items || []).forEach((item: ItemRecord, idx: number) => {
          const prod = productosById[item.producto_id];
          if (!prod) {
            console.log(`⚠️ Item ${idx}: producto_id ${item.producto_id} no encontrado en productosById`);
            console.log(`   Productos disponibles:`, Object.keys(productosById));
          }
          const typeName = prod?.tipo_id ? (tiposById[prod.tipo_id] || 'Sin Categoría') : 'Sin Categoría';
          const total = item.total_neto || 0;
          
          if (idx < 3) { // Log los primeros 3 items para debugging
            console.log(`📦 Item ${idx}:`, {
              producto_id: item.producto_id,
              producto: prod?.nombre || 'N/A',
              tipo_id: prod?.tipo_id || 'N/A',
              categoria: typeName,
              total_neto: total
            });
          }
          
          if (!categoriesMap[typeName]) {
            categoriesMap[typeName] = { total: 0, count: 0, categoryName: typeName };
          }
          categoriesMap[typeName].total += total;
          categoriesMap[typeName].count += item.cantidad || 1;
        });
        
        console.log('📊 Categories Map:', categoriesMap);
        
        // Convertir a array y calcular porcentajes
        const categoriesArray = Object.values(categoriesMap).filter(cat => cat.total > 0); // Filtrar categorías vacías
        const totalAmount = categoriesArray.reduce((sum, cat) => sum + cat.total, 0);
        console.log('💰 Total amount:', totalAmount, 'Categories:', categoriesArray.length);
        
        if (totalAmount === 0 || categoriesArray.length === 0) {
          console.log('⚠️ No hay categorías con datos para mostrar');
          console.log('   Total amount:', totalAmount);
          console.log('   Categories found:', categoriesArray.length);
          console.log('   Categories map:', categoriesMap);
          setCategoryData([]);
          setLoading(false);
          return;
        }
        
        // Formatear datos para el gráfico
        const formattedData: CategoryData[] = categoriesArray
          .sort((a, b) => b.total - a.total)
          .slice(0, 5) // Mostrar solo top 5 categorías
          .map((cat, index) => {
            const percentage = (cat.total / totalAmount) * 100;
            return {
              category: cat.categoryName,
              value: parseFloat(percentage.toFixed(2)),
              color: categoryColors[index % categoryColors.length],
              amount: new Intl.NumberFormat('es-CL', { 
                style: 'currency', 
                currency: 'CLP',
                maximumFractionDigits: 0
              }).format(cat.total),
              description: `${cat.count} ${reportType === 'cotizaciones' ? 'unidades cotizadas' : 'unidades vendidas'}`
            };
          });

        // Asegurar que los porcentajes sumen 100%
        const totalPercentage = formattedData.reduce((sum, item) => sum + item.value, 0);
        if (totalPercentage < 100 && formattedData.length > 0) {
          const diff = 100 - totalPercentage;
          formattedData[0].value = parseFloat((formattedData[0].value + diff).toFixed(2));
        }

        console.log('✅ Categorías formateadas para el gráfico:', formattedData.length);
        console.log('📊 Datos finales:', formattedData);
        setCategoryData(formattedData);
      } catch (err) {
        console.error('Error cargando distribución de categorías:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
        setCategoryData([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadCategoryData();
  }, [period, reportType]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar canvas para alta resolución
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Limpiar canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Configuración del gráfico
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const outerRadius = Math.min(rect.width, rect.height) * 0.35;
    const innerRadius = outerRadius * 0.55; // Más grueso para mejor visualización

    let currentAngle = -Math.PI / 2; // Empezar desde arriba

    // Si está cargando, mostrar indicador visual
    if (loading) {
      ctx.font = '16px Arial';
      ctx.fillStyle = '#6b7280';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Cargando datos...', centerX, centerY);
      return;
    }

    // Si hay error, mostrar mensaje
    if (error) {
      ctx.font = '14px Arial';
      ctx.fillStyle = '#ef4444';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Error al cargar datos', centerX, centerY);
      return;
    }

    // Si no hay datos, mostrar mensaje
    if (categoryData.length === 0) {
      ctx.font = '14px Arial';
      ctx.fillStyle = '#6b7280';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No hay datos', centerX, centerY - 10);
      ctx.font = '12px Arial';
      ctx.fillText('en el período', centerX, centerY + 10);
      return;
    }

    const dataToUse = categoryData;
    
    // Dibujar cada segmento con efectos mejorados
    dataToUse.forEach((segment, index) => {
      // Saltar segmentos con valores muy pequeños o 0
      if (segment.value <= 0.1) return;
      
      const sliceAngle = (segment.value / 100) * 2 * Math.PI;
      const isHovered = hoveredSegment === index;
      const radius = isHovered ? outerRadius + 5 : outerRadius;

      // Dibujar el segmento
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();

      // Gradiente para cada segmento
      const gradient = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, radius);
      const baseColor = segment.color;
      gradient.addColorStop(0, baseColor + '40'); // Más transparente hacia adentro
      gradient.addColorStop(0.7, baseColor);
      gradient.addColorStop(1, baseColor + 'DD'); // Más opaco hacia afuera

      ctx.fillStyle = gradient;
      ctx.fill();

      // Borde elegante
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary') || '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Sombra sutil para profundidad
      if (isHovered) {
        ctx.shadowColor = segment.color + '40';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      currentAngle += sliceAngle;
    });

    // Dibujar círculo interior decorativo
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary') || '#ffffff';
    ctx.fill();
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border') || '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Texto central mejorado
    const totalValue = categoryData.reduce((sum, item) => sum + parseFloat(item.amount.replace(/[$,]/g, '')), 0);
    
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#000000';
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const centerLabel = reportType === 'cotizaciones' ? 'Total Cotizado' : 'Total Vendido';
    ctx.fillText(centerLabel, centerX, centerY - 12);

    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#8b5cf6';
    ctx.fillText(`$${(totalValue / 1000).toFixed(0)}K`, centerX, centerY + 8);

    // Línea decorativa
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-subtle') || '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - 25, centerY - 2);
    ctx.lineTo(centerX + 25, centerY - 2);
    ctx.stroke();

  }, [categoryData, loading, error, hoveredSegment, reportType]);

  // Manejar interacciones del mouse
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    // Detectar qué segmento está siendo hovereado
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    const outerRadius = Math.min(rect.width, rect.height) * 0.35;
    const innerRadius = outerRadius * 0.55;

    if (distance >= innerRadius && distance <= outerRadius) {
      const angle = Math.atan2(y - centerY, x - centerX);
      const normalizedAngle = angle < -Math.PI / 2 ? angle + 2 * Math.PI : angle;
      const adjustedAngle = normalizedAngle + Math.PI / 2;
      
      let currentAngle = 0;
      let segmentIndex = -1;

      for (let i = 0; i < dataArr.length; i++) {
        const sliceAngle = (dataArr[i].value / 100) * 2 * Math.PI;
        if (adjustedAngle >= currentAngle && adjustedAngle < currentAngle + sliceAngle) {
          segmentIndex = i;
          break;
        }
        currentAngle += sliceAngle;
      }

      setHoveredSegment(segmentIndex);
    } else {
      setHoveredSegment(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredSegment(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Gráfico donut interactivo */}
      <div className="flex-shrink-0 relative">
        <canvas
          ref={canvasRef}
          className="mx-auto cursor-pointer"
          style={{ 
            backgroundColor: 'transparent',
            width: window.innerWidth < 640 ? '200px' : '256px',
            height: window.innerWidth < 640 ? '200px' : '256px'
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        
        {/* Tooltip flotante */}
        {hoveredSegment !== null && dataArr.length > 0 && dataArr[hoveredSegment] && (
          <div 
            className="absolute z-10 p-2 rounded-md text-xs pointer-events-none transition-all shadow-lg border"
            style={{ 
              left: mousePos.x + 10,
              top: mousePos.y - 10,
              transform: 'translate(-50%, -100%)',
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          >
            <div className="font-semibold" style={{ color: 'var(--accent-text)' }}>{dataArr[hoveredSegment].category}</div>
            <div style={{ color: 'var(--text-secondary)' }}>{dataArr[hoveredSegment].amount} ({dataArr[hoveredSegment].value}%)</div>
          </div>
        )}
      </div>

      {/* Leyenda mejorada */}
      <div className="flex-1 space-y-3">
        {categoryData.length === 0 ? (
          <div className="text-center p-8">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              No hay datos en el período
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {reportType === 'cotizaciones' 
                ? 'Crea cotizaciones para ver la distribución por categorías'
                : 'Genera notas de venta para ver la distribución por categorías'}
            </p>
          </div>
        ) : (
          dataArr.map((item, index) => (
          <div 
            key={index} 
            className={`group p-4 rounded-lg transition-all duration-200 cursor-pointer ${
              hoveredSegment === index ? 'scale-105 shadow-lg' : 'hover:scale-[1.02]'
            }`}
            style={{ 
              backgroundColor: hoveredSegment === index ? item.color + '10' : 'var(--bg-secondary)',
              borderLeft: `4px solid ${item.color}`
            }}
            onMouseEnter={() => setHoveredSegment(index)}
            onMouseLeave={() => setHoveredSegment(null)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {item.category}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {item.description}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2 sm:ml-3">
                <p className="text-xs sm:text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {item.amount}
                </p>
                <p className="text-xs font-medium" style={{ color: item.color }}>
                  {item.value}%
                </p>
              </div>
            </div>

            {/* Barra de progreso en la leyenda */}
            <div className="mt-3">
              <div 
                className="h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <div 
                  className="h-full transition-all duration-700 ease-out rounded-full"
                  style={{ 
                    backgroundColor: item.color,
                    width: `${item.value}%`
                  }}
                />
              </div>
            </div>
          </div>
        ))
        )}

        {/* Resumen total mejorado */}
        {categoryData.length > 0 && (
        <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {reportType === 'cotizaciones' ? 'Total cotizado por categoría' : 'Total vendido por categoría'}
                </span>
                <div className="mt-1">
                  <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {new Intl.NumberFormat('es-CL', { 
                      style: 'currency', 
                      currency: 'CLP',
                      maximumFractionDigits: 0
                    }).format(categoryData.reduce((sum, cat) => {
                      const amount = parseFloat(cat.amount.replace(/[$.]/g, '').replace(/\./g, '')) || 0;
                      return sum + amount;
                    }, 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
