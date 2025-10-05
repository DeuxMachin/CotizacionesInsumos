import { useEffect, useRef, useState } from 'react';
import { ReportPeriod } from '@/app/dashboard/reportes/page';
import { reportesService, ReportData } from '@/services/reportesService';
import { supabase } from '@/lib/supabase';

interface MonthlySalesChartProps {
  period: ReportPeriod;
}

interface MonthlySalesData {
  day: number;
  sales: number;
  label: string;
  count: number; // Número de ventas del día
  fullDate?: string; // Fecha completa para tooltip
}

// Datos mock para las ventas diarias del mes
const mockMonthlySalesData: MonthlySalesData[] = [
  { day: 1, sales: 245000, label: 'D01', count: 3 },
  { day: 2, sales: 320000, label: 'D02', count: 5 },
  { day: 3, sales: 280000, label: 'D03', count: 4 },
  { day: 4, sales: 390000, label: 'D04', count: 6 },
  { day: 5, sales: 450000, label: 'D05', count: 7 },
  { day: 6, sales: 380000, label: 'D06', count: 5 },
  { day: 7, sales: 520000, label: 'D07', count: 8 },
  { day: 8, sales: 480000, label: 'D08', count: 7 },
  { day: 9, sales: 350000, label: 'D09', count: 5 },
  { day: 10, sales: 420000, label: 'D10', count: 6 },
  { day: 11, sales: 510000, label: 'D11', count: 8 },
  { day: 12, sales: 579290, label: 'D12', count: 9 }, // Punto actual según imagen
  { day: 13, sales: 490000, label: 'D13', count: 7 },
  { day: 14, sales: 440000, label: 'D14', count: 6 },
  { day: 15, sales: 380000, label: 'D15', count: 5 },
  { day: 16, sales: 320000, label: 'D16', count: 4 },
  { day: 17, sales: 290000, label: 'D17', count: 3 },
  { day: 18, sales: 340000, label: 'D18', count: 5 },
  { day: 19, sales: 410000, label: 'D19', count: 6 },
  { day: 20, sales: 460000, label: 'D20', count: 7 },
  { day: 21, sales: 520000, label: 'D21', count: 8 },
  { day: 22, sales: 480000, label: 'D22', count: 7 },
  { day: 23, sales: 390000, label: 'D23', count: 5 },
  { day: 24, sales: 450000, label: 'D24', count: 7 },
  { day: 25, sales: 510000, label: 'D25', count: 8 },
  { day: 26, sales: 470000, label: 'D26', count: 7 },
  { day: 27, sales: 420000, label: 'D27', count: 6 },
  { day: 28, sales: 380000, label: 'D28', count: 5 },
  { day: 29, sales: 340000, label: 'D29', count: 4 },
  { day: 30, sales: 310000, label: 'D30', count: 4 }
];

export function MonthlySalesChart({ period }: MonthlySalesChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [clickedPoint, setClickedPoint] = useState<number | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [tooltip, setTooltip] = useState<{x: number, y: number, data: MonthlySalesData} | null>(null);
  const [salesData, setSalesData] = useState<MonthlySalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Refs para optimización de rendimiento
  const lastMouseMoveTime = useRef<number>(0);
  const hoveredPointRef = useRef<number | null>(null);
  
  // Sincronizar ref con estado
  useEffect(() => {
    hoveredPointRef.current = hoveredPoint;
  }, [hoveredPoint]);

  // Cargar datos reales directamente desde Supabase
  useEffect(() => {
    const loadSalesData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Determinar el rango de fechas según el período seleccionado
        const now = new Date();
        const startDate = new Date();
        
        switch (period) {
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

        // Consultar directamente las ventas desde Supabase

        // Usar la columna correcta 'total' en vez de 'total_final'
        const { data: notasVenta, error: notasError } = await supabase
          .from('notas_venta')
          .select('created_at, total, id')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true });

        if (notasError) throw new Error(`Error al obtener datos: ${notasError.message}`);

        // Convertir los datos al formato esperado
        const dailySales: MonthlySalesData[] = [];
        const salesByDay: Map<string, { total: number; count: number; dateObj: Date }> = new Map();

        // Obtener la fecha actual en zona horaria local
        const today = new Date();
        today.setHours(12, 0, 0, 0); // Mediodía para evitar problemas

        // Inicializar los últimos 31 días manteniendo el orden
        const datesArray: string[] = [];
        for (let i = 30; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const dayKey = `${year}-${month}-${day}`;
          
          datesArray.push(dayKey);
          salesByDay.set(dayKey, { total: 0, count: 0, dateObj: date });
        }

        // Sumar las ventas por día y contar transacciones
        (notasVenta || []).forEach(nota => {
          // Crear fecha desde el timestamp de la base de datos
          const dbDate = new Date(nota.created_at);
          
          // Ajustar a hora de Chile manualmente
          const chileOffset = -3; // UTC-3 para horario de verano de Chile
          const chileDate = new Date(dbDate.getTime() + (chileOffset * 60 * 60 * 1000));
          
          const year = chileDate.getUTCFullYear();
          const month = String(chileDate.getUTCMonth() + 1).padStart(2, '0');
          const day = String(chileDate.getUTCDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          
          const existing = salesByDay.get(dateStr);
          if (existing) {
            existing.total += nota.total || 0;
            existing.count += 1;
          }
        });

        // Convertir a array para el gráfico en el orden correcto
        let dayIndex = 1;
        datesArray.forEach((dateKey) => {
          const data = salesByDay.get(dateKey)!;
          const dateObj = data.dateObj;
          
          // Crear etiqueta con mes para evitar confusión
          const monthShort = dateObj.toLocaleDateString('es-CL', { month: 'short' }).toUpperCase();
          const dayNum = String(dateObj.getDate()).padStart(2, '0');
          
          dailySales.push({
            day: dayIndex,
            sales: data.total,
            count: data.count,
            label: `${dayNum}/${monthShort}`, // Formato: 05/OCT, 24/SEP
            fullDate: dateKey
          });
          dayIndex++;
        });

        if (dailySales.length > 0) {
          setSalesData(dailySales);
        } else {
          // Si no hay datos, usar datos mock como fallback
          setSalesData(mockMonthlySalesData);
        }
      } catch (err) {
        console.error('Error cargando datos de ventas:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
        // Fallback a datos mock si hay error
        setSalesData(mockMonthlySalesData);
      } finally {
        setLoading(false);
      }
    };

    loadSalesData();
  }, [period]);

  // Detectar tema oscuro
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Manejo de interacciones del mouse con throttling y responsividad
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || salesData.length === 0) return;

    const handleMouseMove = (event: MouseEvent) => {
      // Throttling: solo procesar cada 16ms (60fps)
      const now = Date.now();
      if (now - lastMouseMoveTime.current < 16) return;
      lastMouseMoveTime.current = now;
      
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Configuración de márgenes adaptables (debe coincidir con el dibujo)
      const isMobile = rect.width < 640;
      const margin = isMobile 
        ? { top: 15, right: 15, bottom: 45, left: 50 }
        : { top: 20, right: 30, bottom: 60, left: 80 };
      const chartWidth = rect.width - margin.left - margin.right;
      const chartHeight = rect.height - margin.top - margin.bottom;
      
      // Pre-calcular valores comunes para optimización
      const maxSales = Math.max(...salesData.map(d => d.sales));
      const minSales = Math.min(...salesData.map(d => d.sales));
      const salesRange = maxSales - minSales;
      
      // Buscar punto más cercano al mouse
      let closestPoint = null;
      let minDistance = Infinity;
      const detectionRadius = isMobile ? 30 : 20; // Radio más grande en móvil
      
      for (const data of salesData) {
        const pointX = margin.left + (data.day - 1) * (chartWidth / (salesData.length - 1));
        const pointY = margin.top + chartHeight - ((data.sales - minSales) / salesRange) * chartHeight;
        
        const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);
        
        if (distance < detectionRadius && distance < minDistance) {
          minDistance = distance;
          closestPoint = data.day;
          
          // Ajustar posición del tooltip para que no se salga de la pantalla
          let tooltipX = pointX + 10;
          let tooltipY = pointY - 40;
          
          // Evitar que el tooltip se salga por la derecha
          if (tooltipX + 120 > rect.width) {
            tooltipX = pointX - 130;
          }
          // Evitar que el tooltip se salga por arriba
          if (tooltipY < 0) {
            tooltipY = pointY + 20;
          }
          
          setTooltip({ x: tooltipX, y: tooltipY, data });
        }
      }
      
      // Solo actualizar si cambió el punto
      if (closestPoint !== hoveredPointRef.current) {
        setHoveredPoint(closestPoint);
        if (!closestPoint) {
          setTooltip(null);
        }
        canvas.style.cursor = closestPoint ? 'pointer' : 'default';
      }
    };

    const handleClick = () => {
      const currentHovered = hoveredPointRef.current;
      if (currentHovered !== null) {
        setClickedPoint(currentHovered);
        // Ocultar tooltip al hacer click para mostrar la info en la tarjeta
        setTooltip(null);
      }
    };

    const handleMouseLeave = () => {
      setHoveredPoint(null);
      setTooltip(null);
      canvas.style.cursor = 'default';
    };

    // Soporte táctil para móviles
    const handleTouchStart = (event: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const touch = event.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      const isMobile = rect.width < 640;
      const margin = isMobile 
        ? { top: 15, right: 15, bottom: 45, left: 50 }
        : { top: 20, right: 30, bottom: 60, left: 80 };
      const chartWidth = rect.width - margin.left - margin.right;
      const chartHeight = rect.height - margin.top - margin.bottom;
      
      const maxSales = Math.max(...salesData.map(d => d.sales));
      const minSales = Math.min(...salesData.map(d => d.sales));
      const salesRange = maxSales - minSales;
      
      let closestPoint = null;
      let minDistance = Infinity;
      const detectionRadius = 40; // Radio más grande para touch
      
      for (const data of salesData) {
        const pointX = margin.left + (data.day - 1) * (chartWidth / (salesData.length - 1));
        const pointY = margin.top + chartHeight - ((data.sales - minSales) / salesRange) * chartHeight;
        
        const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);
        
        if (distance < detectionRadius && distance < minDistance) {
          minDistance = distance;
          closestPoint = data.day;
          
          // Solo prevenir default si tocamos un punto
          event.preventDefault();
        }
      }
      
      // En móvil, al tocar seleccionamos directamente sin mostrar tooltip
      if (closestPoint !== null) {
        setClickedPoint(closestPoint);
        setHoveredPoint(null);
        setTooltip(null);
      }
    };

    const handleTouchEnd = () => {
      // Limpiar hover al terminar el toque
      setHoveredPoint(null);
      setTooltip(null);
    };

    canvas.addEventListener('mousemove', handleMouseMove, { passive: true });
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [salesData]); // Solo depende de salesData

  // Redibujar cuando cambien los datos, tema o interacciones
  useEffect(() => {
    if (loading || salesData.length === 0) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuración del canvas
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    
    // Detectar si es móvil para ajustar márgenes
    const isMobile = width < 640;
    
    // Función para obtener el valor real de una variable CSS
    const getCssVarColor = (varName: string) => {
      const style = getComputedStyle(document.documentElement);
      return style.getPropertyValue(varName).trim();
    };
    
    // Colores según tema - usando variables CSS para compatibilidad con tema
    const colors = {
      background: getCssVarColor('--bg-primary'),
      gridLines: getCssVarColor('--border-subtle'),
      textPrimary: getCssVarColor('--text-primary'),
      textSecondary: getCssVarColor('--text-secondary'),
      textTertiary: getCssVarColor('--text-tertiary'),
      lineColor: getCssVarColor('--accent-text'), // color acento principal
      gradientStart: isDark ? 'rgba(234, 88, 12, 0.3)' : 'rgba(249, 115, 22, 0.2)',
      gradientEnd: isDark ? 'rgba(234, 88, 12, 0.03)' : 'rgba(249, 115, 22, 0.01)',
      pointColor: getCssVarColor('--orange-color'),
      pointHover: getCssVarColor('--accent-text')
    };

    // Limpiar canvas
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);

    // Márgenes adaptables según el tamaño de pantalla
    const margin = isMobile 
      ? { top: 15, right: 15, bottom: 45, left: 50 }  // Márgenes reducidos para móvil
      : { top: 20, right: 30, bottom: 60, left: 80 }; // Márgenes normales para desktop
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Escalas
    const maxSales = Math.max(...salesData.map(d => d.sales));
    const minSales = Math.min(...salesData.map(d => d.sales));
    const salesRange = maxSales - minSales;
    
    const xScale = (day: number) => margin.left + (day - 1) * (chartWidth / (salesData.length - 1));
    const yScale = (sales: number) => margin.top + chartHeight - ((sales - minSales) / salesRange) * chartHeight;

    // Líneas de cuadrícula horizontal
    ctx.strokeStyle = colors.gridLines;
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = margin.top + (i * chartHeight) / gridLines;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartWidth, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Etiquetas del eje Y
    ctx.fillStyle = colors.textSecondary;
    ctx.font = isMobile ? '9px system-ui' : '11px system-ui';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i <= gridLines; i++) {
      const value = minSales + (i * salesRange) / gridLines;
      const y = margin.top + chartHeight - (i * chartHeight) / gridLines;
      const formattedValue = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        notation: isMobile ? 'compact' : 'standard', // Usar notación compacta en móvil
        compactDisplay: 'short'
      }).format(value);
      ctx.fillText(formattedValue, margin.left - 5, y);
    }

    // Gradiente de área bajo la curva
    const gradient = ctx.createLinearGradient(0, margin.top, 0, margin.top + chartHeight);
    gradient.addColorStop(0, colors.gradientStart);
    gradient.addColorStop(1, colors.gradientEnd);

    // Área bajo la curva
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(xScale(salesData[0].day), yScale(salesData[0].sales));
    
    for (let i = 1; i < salesData.length; i++) {
      const prev = salesData[i - 1];
      const curr = salesData[i];
      
      const cp1x = xScale(prev.day) + (xScale(curr.day) - xScale(prev.day)) * 0.4;
      const cp1y = yScale(prev.sales);
      const cp2x = xScale(curr.day) - (xScale(curr.day) - xScale(prev.day)) * 0.4;
      const cp2y = yScale(curr.sales);
      
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, xScale(curr.day), yScale(curr.sales));
    }
    
    ctx.lineTo(xScale(salesData[salesData.length - 1].day), margin.top + chartHeight);
    ctx.lineTo(xScale(salesData[0].day), margin.top + chartHeight);
    ctx.closePath();
    ctx.fill();

    // Línea principal con glow effect
    ctx.strokeStyle = colors.lineColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = colors.lineColor;
    ctx.shadowBlur = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(xScale(salesData[0].day), yScale(salesData[0].sales));
    
    for (let i = 1; i < salesData.length; i++) {
      const prev = salesData[i - 1];
      const curr = salesData[i];
      
      const cp1x = xScale(prev.day) + (xScale(curr.day) - xScale(prev.day)) * 0.4;
      const cp1y = yScale(prev.sales);
      const cp2x = xScale(curr.day) - (xScale(curr.day) - xScale(prev.day)) * 0.4;
      const cp2y = yScale(curr.sales);
      
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, xScale(curr.day), yScale(curr.sales));
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Puntos de datos con interactividad
    salesData.forEach((data, index) => {
      const x = xScale(data.day);
      const y = yScale(data.sales);
      
      // Ajustar tamaño de puntos según dispositivo
      const normalSize = isMobile ? 2.5 : 3;
      const hoverSize = isMobile ? 4 : 5;
      const selectedSize = isMobile ? 5 : 6;
      const haloSize = isMobile ? 10 : 12;
      const hoverHaloSize = isMobile ? 7 : 8;
      
      // Punto seleccionado (clickeado)
      if (data.day === clickedPoint) {
        // Halo exterior para el punto seleccionado
        ctx.strokeStyle = colors.pointHover;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, haloSize, 0, Math.PI * 2);
        ctx.stroke();
        
        // Punto principal
        ctx.fillStyle = colors.pointHover;
        ctx.beginPath();
        ctx.arc(x, y, selectedSize, 0, Math.PI * 2);
        ctx.fill();
      }
      // Punto con hover
      else if (data.day === hoveredPoint) {
        // Efecto de hover
        ctx.fillStyle = colors.pointHover;
        ctx.beginPath();
        ctx.arc(x, y, hoverSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Borde suave
        ctx.strokeStyle = colors.pointHover;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, hoverHaloSize, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Puntos normales
      else {
        ctx.fillStyle = colors.pointColor;
        ctx.beginPath();
        ctx.arc(x, y, normalSize, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Etiquetas del eje X (ajustadas según dispositivo)
    ctx.fillStyle = colors.textSecondary;
    ctx.font = isMobile ? '9px system-ui' : '10px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const labelInterval = isMobile ? 7 : 5; // Menos etiquetas en móvil
    salesData.forEach((data, index) => {
      if (index % labelInterval === 0) {
        const x = xScale(data.day);
        const y = margin.top + chartHeight + (isMobile ? 5 : 10);
        ctx.fillText(data.label, x, y);
      }
    });

    // Título del gráfico - solo en desktop
    if (!isMobile) {
      ctx.fillStyle = colors.textPrimary;
      ctx.font = 'bold 14px system-ui';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('Ventas a lo largo del mes', margin.left, 5);

      // Información del día actual
      ctx.fillStyle = colors.textSecondary;
      ctx.font = '12px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText('Monto total vendido en cada período', width - margin.right, 5);
    }

    // Ya no mostramos el tooltip en el canvas porque ahora tenemos 
    // la tarjeta de información completa debajo del gráfico

  }, [period, isDark, hoveredPoint, clickedPoint, salesData, loading]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 rounded-xl border" style={{ 
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-subtle)'
      }}>
        <div className="mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Ventas a lo largo del mes
          </h3>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            Cargando datos...
          </p>
        </div>
        <div className="min-h-[250px] sm:min-h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 rounded-xl border" style={{ 
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-subtle)'
      }}>
        <div className="mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Ventas a lo largo del mes
          </h3>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-danger)' }}>
            Error: {error}
          </p>
        </div>
        <div className="min-h-[250px] sm:min-h-[300px] flex items-center justify-center">
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>Los datos no pudieron cargarse</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 rounded-xl border" style={{ 
      backgroundColor: 'var(--bg-primary)',
      borderColor: 'var(--border-subtle)'
    }}>
      <div className="mb-3 sm:mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 sm:gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Ventas a lo largo del mes
          </h3>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            Evolución del monto vendido día a día - visualiza los ingresos reales
          </p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full" style={{ backgroundColor: 'var(--accent-text)' }}></div>
            <span style={{ color: 'var(--text-secondary)' }}>Monto vendido</span>
          </div>
          <div className="hidden sm:block px-3 py-1 rounded-lg text-xs font-medium" style={{
            backgroundColor: 'var(--accent-bg)',
            color: 'var(--accent-text)'
          }}>
            Hover/Click para detalles
          </div>
        </div>
      </div>

      {/* Canvas para el gráfico */}
      <div className="relative w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full max-w-full"
          style={{ height: 'clamp(200px, 25vh, 350px)' }}
        />
        
        {/* Tooltip solo para hover (no para click) */}
        {tooltip && !clickedPoint && (
          <div 
            className="absolute pointer-events-none z-10 px-3 py-2 rounded-lg shadow-lg border"
            style={{ 
              left: tooltip.x + 10,
              top: tooltip.y - 40,
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
              minWidth: '160px'
            }}
          >
            <div className="font-semibold mb-1" style={{ color: 'var(--accent-text)' }}>
              {tooltip.data.fullDate 
                ? new Date(tooltip.data.fullDate).toLocaleDateString('es-CL', { 
                    day: 'numeric', 
                    month: 'long',
                    weekday: 'short'
                  })
                : tooltip.data.label
              }
            </div>
            <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              {new Intl.NumberFormat('es-CL', {
                style: 'currency',
                currency: 'CLP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(tooltip.data.sales)}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {tooltip.data.count} {tooltip.data.count === 1 ? 'venta' : 'ventas'}
            </div>
          </div>
        )}
      </div>

      {/* Información del punto seleccionado (visible y persistente) */}
      {clickedPoint && (
        <div 
          className="mt-4 p-4 rounded-lg border-2 transition-all duration-300"
          style={{ 
            backgroundColor: 'var(--accent-bg)',
            borderColor: 'var(--accent-text)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                📅 DÍA SELECCIONADO
              </p>
              <p className="text-lg sm:text-xl font-bold mb-1" style={{ color: 'var(--accent-text)' }}>
                {salesData.find(d => d.day === clickedPoint)?.fullDate 
                  ? new Date(salesData.find(d => d.day === clickedPoint)!.fullDate!).toLocaleDateString('es-CL', { 
                      day: 'numeric', 
                      month: 'long',
                      year: 'numeric',
                      weekday: 'long'
                    })
                  : salesData.find(d => d.day === clickedPoint)?.label
                }
              </p>
            </div>
            
            <div className="flex gap-6 flex-wrap">
              <div className="text-center">
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  💰 MONTO VENDIDO
                </p>
                <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--success-text)' }}>
                  {new Intl.NumberFormat('es-CL', {
                    style: 'currency',
                    currency: 'CLP',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(salesData.find(d => d.day === clickedPoint)?.sales || 0)}
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  🛒 TRANSACCIONES
                </p>
                <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--accent-text)' }}>
                  {salesData.find(d => d.day === clickedPoint)?.count || 0}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {salesData.find(d => d.day === clickedPoint)?.count === 1 ? 'venta' : 'ventas'}
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  📊 TICKET PROMEDIO
                </p>
                <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {new Intl.NumberFormat('es-CL', {
                    style: 'currency',
                    currency: 'CLP',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(
                    (salesData.find(d => d.day === clickedPoint)?.sales || 0) / 
                    (salesData.find(d => d.day === clickedPoint)?.count || 1)
                  )}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setClickedPoint(null)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              ✕ Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Resumen estadístico mejorado */}
      <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-center">
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
              TOTAL
            </p>
            <p className="text-sm font-bold" style={{ color: 'var(--success-text)' }}>
              ${salesData.reduce((sum, d) => sum + d.sales, 0).toLocaleString('es-CL')}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
              TRANSACCIONES
            </p>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {salesData.reduce((sum, d) => sum + d.count, 0)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
              MÁXIMO
            </p>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              ${Math.max(...salesData.map(d => d.sales)).toLocaleString('es-CL')}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
              PROMEDIO
            </p>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              ${Math.round(salesData.reduce((sum, d) => sum + d.sales, 0) / salesData.length).toLocaleString('es-CL')}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
              {clickedPoint ? '✅ SELECCIONADO' : 'SELECCIONAR'}
            </p>
            <p className="text-sm font-bold" style={{ color: clickedPoint ? 'var(--accent-text)' : 'var(--text-tertiary)' }}>
              {clickedPoint ? (
                <>
                  <span className="block">${salesData.find(d => d.day === clickedPoint)?.sales.toLocaleString('es-CL') || '0'}</span>
                  <span className="text-xs font-normal" style={{ color: 'var(--text-secondary)' }}>
                    {salesData.find(d => d.day === clickedPoint)?.count || 0} ventas
                  </span>
                </>
              ) : (
                'Click en gráfico'
              )}
            </p>
          </div>
        </div>
        
        {/* Instrucciones de uso */}
        <div className="mt-3 text-center">
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {clickedPoint 
              ? '✅ Día seleccionado - La información detallada se muestra arriba'
              : '💡 Hover para preview rápido • Click en cualquier punto para ver información completa'}
          </p>
        </div>
      </div>
    </div>
  );
}
