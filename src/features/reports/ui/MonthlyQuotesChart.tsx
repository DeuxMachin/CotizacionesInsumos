import { useEffect, useRef, useState } from 'react';
import { ReportPeriod, ReportType } from '@/app/dashboard/reportes/page';
import { supabase } from '@/lib/supabase';

interface MonthlyQuotesChartProps {
  period: ReportPeriod;
  reportType: ReportType;
}

interface MonthlyQuotesData {
  day: number;
  amount: number; // monto cotizado/vendido del día
  count: number;  // número de cotizaciones/ventas del día
  label: string;
  fullDate?: string; // Fecha completa para mostrar en tooltips
}

interface CotizacionRecord {
  created_at: string;
  total_final: number;
}

interface NotaVentaRecord {
  created_at: string;
  total: number;
}

const mockMonthlyQuotesData: MonthlyQuotesData[] = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  amount: Math.floor(200000 + Math.random() * 600000),
  count: Math.floor(Math.random() * 8) + 1,
  label: `D${String(i + 1).padStart(2, '0')}`
}));

export function MonthlyQuotesChart({ period, reportType }: MonthlyQuotesChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [clickedPoint, setClickedPoint] = useState<number | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [tooltip, setTooltip] = useState<{x: number, y: number, data: MonthlyQuotesData} | null>(null);
  const [quotesData, setQuotesData] = useState<MonthlyQuotesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuotesData = async () => {
      try {
        setLoading(true);
        setError(null);
        setClickedPoint(null); // Reset clicked point when changing report type or period
        const now = new Date();
        const startDate = new Date();
        let daysToShow = 30; // Default para la mayoría de casos
        
        switch (period) {
          case 'Última semana':
            startDate.setDate(now.getDate() - 6); // Los últimos 7 días (incluyendo hoy)
            daysToShow = 7;
            break;
          case 'Último mes':
            startDate.setDate(now.getDate() - 29); // Los últimos 30 días
            daysToShow = 30;
            break;
          case 'Últimos 3 meses':
            startDate.setDate(now.getDate() - 89); // Los últimos 90 días
            daysToShow = 90;
            break;
          case 'Últimos 6 meses':
            startDate.setDate(now.getDate() - 179); // Los últimos 180 días
            daysToShow = 180;
            break;
          case 'Último año':
            startDate.setDate(now.getDate() - 364); // Los últimos 365 días
            daysToShow = 365;
            break;
          default:
            startDate.setDate(now.getDate() - 29);
            daysToShow = 30;
        }

        // Traer datos del período según el tipo de reporte
        const tableName = reportType === 'cotizaciones' ? 'cotizaciones' : 'notas_venta';
        const amountField = reportType === 'cotizaciones' ? 'total_final' : 'total';
        
        const { data: records, error: fetchError } = await supabase
          .from(tableName)
          .select(`created_at, ${amountField}`)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', now.toISOString())
          .order('created_at', { ascending: true });
        if (fetchError) throw new Error(`Error al obtener datos: ${fetchError.message}`);

        // Para períodos largos (3+ meses), solo mostrar días con cotizaciones
        const showOnlyDaysWithQuotes = period === 'Últimos 3 meses' || period === 'Últimos 6 meses' || period === 'Último año';
        
        // Inicializar días según el período seleccionado
        type DayAgg = { amount: number; count: number; fullDate: string };
        const quotesByDay: Record<string, DayAgg> = {};
        const dateMap: string[] = []; // Para mantener el orden de las fechas
        
        if (!showOnlyDaysWithQuotes) {
          // Para períodos cortos (semana, mes), mostrar todos los días
          for (let i = daysToShow - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayKey = date.toISOString().split('T')[0];
            quotesByDay[dayKey] = { amount: 0, count: 0, fullDate: dayKey };
            dateMap.push(dayKey);
          }
        }

        const typedRecords = reportType === 'cotizaciones' ? (records as CotizacionRecord[]) : (records as NotaVentaRecord[]);

        typedRecords.forEach(record => {
          const dateStr = new Date(record.created_at).toISOString().split('T')[0];
          const amount = reportType === 'cotizaciones' ? (record as CotizacionRecord).total_final : (record as NotaVentaRecord).total;
          
          if (showOnlyDaysWithQuotes) {
            // Solo agregar días que tienen datos
            if (!quotesByDay[dateStr]) {
              quotesByDay[dateStr] = { amount: 0, count: 0, fullDate: dateStr };
              dateMap.push(dateStr);
            }
            quotesByDay[dateStr].count += 1;
            quotesByDay[dateStr].amount += amount || 0;
          } else {
            // Para períodos cortos, agregar a días existentes
            if (quotesByDay[dateStr] !== undefined) {
              quotesByDay[dateStr].count += 1;
              quotesByDay[dateStr].amount += amount || 0;
            }
          }
        });

        // Convertir a arreglo manteniendo el orden de fechas
        const dailyQuotes: MonthlyQuotesData[] = dateMap.map((dateKey, index) => {
          const agg = quotesByDay[dateKey];
          const dateObj = new Date(dateKey);
          const dayOfMonth = dateObj.getDate();
          const monthShort = dateObj.toLocaleDateString('es-CL', { month: 'short' });
          
          return {
            day: index + 1,
            amount: agg.amount,
            count: agg.count,
            label: period === 'Última semana' 
              ? dateObj.toLocaleDateString('es-CL', { weekday: 'short' }).toUpperCase()
              : `${dayOfMonth} ${monthShort}`,
            fullDate: dateKey
          };
        });

        setQuotesData(dailyQuotes.length > 0 ? dailyQuotes : mockMonthlyQuotesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
        setQuotesData(mockMonthlyQuotesData);
      } finally {
        setLoading(false);
      }
    };
    loadQuotesData();
  }, [period, reportType]);

  // Detectar tema oscuro
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Interacciones del mouse
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const margin = { top: 20, right: 30, bottom: 60, left: 80 };
      const chartWidth = rect.width - margin.left - margin.right;
      const chartHeight = rect.height - margin.top - margin.bottom;

      let closestPoint: number | null = null;
      let minDistance = Infinity;
      let foundTooltipData: { x: number; y: number; data: MonthlyQuotesData } | null = null;
      
      quotesData.forEach((data) => {
        const pointX = margin.left + (data.day - 1) * (chartWidth / (quotesData.length - 1));
        const maxVal = Math.max(...quotesData.map(d => d.amount));
        const minVal = Math.min(...quotesData.map(d => d.amount));
        const range = Math.max(1, maxVal - minVal);
        const pointY = margin.top + chartHeight - ((data.amount - minVal) / range) * chartHeight;
        const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);
        if (distance < 20 && distance < minDistance) {
          minDistance = distance;
          closestPoint = data.day;
          foundTooltipData = { x: pointX, y: pointY, data };
        }
      });

      if (closestPoint !== hoveredPoint) {
        setHoveredPoint(closestPoint);
        // Si el usuario está hovering sobre un nuevo punto, desbloquear el click y mostrar tooltip
        if (closestPoint && foundTooltipData) {
          setClickedPoint(null);
          setTooltip(foundTooltipData);
        }
        // Si no hay punto cerca, mantener tooltip solo si hay punto clickeado
        if (!closestPoint && clickedPoint) {
          // Mantener el tooltip del punto clickeado
          const clickedData = quotesData.find(d => d.day === clickedPoint);
          if (clickedData) {
            const pointX = margin.left + (clickedData.day - 1) * (chartWidth / (quotesData.length - 1));
            const maxVal = Math.max(...quotesData.map(d => d.amount));
            const minVal = Math.min(...quotesData.map(d => d.amount));
            const range = Math.max(1, maxVal - minVal);
            const pointY = margin.top + chartHeight - ((clickedData.amount - minVal) / range) * chartHeight;
            setTooltip({ x: pointX, y: pointY, data: clickedData });
          }
        } else if (!closestPoint && !clickedPoint) {
          setTooltip(null);
        }
        canvas.style.cursor = closestPoint ? 'pointer' : 'default';
      }
    };

    const handleClick = () => {
      if (hoveredPoint) {
        // Fijar el tooltip en el punto actual
        setClickedPoint(hoveredPoint);
        // Mantener el tooltip actual
        const clickedData = quotesData.find(d => d.day === hoveredPoint);
        if (clickedData && tooltip) {
          setTooltip({ ...tooltip, data: clickedData });
        }
      } else {
        // Click fuera de un punto, deseleccionar
        setClickedPoint(null);
        setTooltip(null);
      }
    };

    const handleMouseLeave = () => {
      setHoveredPoint(null);
      // Si hay un punto clickeado, mantener su tooltip visible
      if (clickedPoint) {
        const rect = canvas.getBoundingClientRect();
        const margin = { top: 20, right: 30, bottom: 60, left: 80 };
        const chartWidth = rect.width - margin.left - margin.right;
        const chartHeight = rect.height - margin.top - margin.bottom;
        const clickedData = quotesData.find(d => d.day === clickedPoint);
        if (clickedData) {
          const pointX = margin.left + (clickedData.day - 1) * (chartWidth / (quotesData.length - 1));
          const maxVal = Math.max(...quotesData.map(d => d.amount));
          const minVal = Math.min(...quotesData.map(d => d.amount));
          const range = Math.max(1, maxVal - minVal);
          const pointY = margin.top + chartHeight - ((clickedData.amount - minVal) / range) * chartHeight;
          setTooltip({ x: pointX, y: pointY, data: clickedData });
        }
      } else {
        setTooltip(null);
      }
      canvas.style.cursor = 'default';
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hoveredPoint, quotesData]);

  // Dibujar gráfico
  useEffect(() => {
    if (loading || quotesData.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    const getCssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const colors = {
      background: getCssVar('--bg-primary'),
      gridLines: getCssVar('--border-subtle'),
      textPrimary: getCssVar('--text-primary'),
      textSecondary: getCssVar('--text-secondary'),
      textTertiary: getCssVar('--text-tertiary'),
      lineColor: getCssVar('--accent-text'),
      gradientStart: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(139, 92, 246, 0.18)',
      gradientEnd: isDark ? 'rgba(99, 102, 241, 0.04)' : 'rgba(139, 92, 246, 0.01)',
      pointColor: getCssVar('--purple-color') || '#8b5cf6',
      pointHover: getCssVar('--accent-text')
    } as const;

    // Fondo
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);

    const margin = { top: 20, right: 30, bottom: 60, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const maxVal = Math.max(...quotesData.map(d => d.amount));
    const minVal = Math.min(...quotesData.map(d => d.amount));
    const range = Math.max(1, maxVal - minVal);
    const xScale = (day: number) => margin.left + (day - 1) * (chartWidth / (quotesData.length - 1));
    const yScale = (val: number) => margin.top + chartHeight - ((val - minVal) / range) * chartHeight;

    // Grid horizontal
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

    // Etiquetas eje Y
    ctx.fillStyle = colors.textSecondary;
    ctx.font = '11px system-ui';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= gridLines; i++) {
      const value = minVal + (i * range) / gridLines;
      const y = margin.top + chartHeight - (i * chartHeight) / gridLines;
      const formatted = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
      ctx.fillText(formatted, margin.left - 10, y);
    }

    // Área bajo la curva
    const gradient = ctx.createLinearGradient(0, margin.top, 0, margin.top + chartHeight);
    gradient.addColorStop(0, colors.gradientStart);
    gradient.addColorStop(1, colors.gradientEnd);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(xScale(quotesData[0].day), yScale(quotesData[0].amount));
    for (let i = 1; i < quotesData.length; i++) {
      const prev = quotesData[i - 1];
      const curr = quotesData[i];
      const cp1x = xScale(prev.day) + (xScale(curr.day) - xScale(prev.day)) * 0.4;
      const cp1y = yScale(prev.amount);
      const cp2x = xScale(curr.day) - (xScale(curr.day) - xScale(prev.day)) * 0.4;
      const cp2y = yScale(curr.amount);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, xScale(curr.day), yScale(curr.amount));
    }
    ctx.lineTo(xScale(quotesData[quotesData.length - 1].day), margin.top + chartHeight);
    ctx.lineTo(xScale(quotesData[0].day), margin.top + chartHeight);
    ctx.closePath();
    ctx.fill();

    // Línea principal
    ctx.strokeStyle = colors.lineColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = colors.lineColor;
    ctx.shadowBlur = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(xScale(quotesData[0].day), yScale(quotesData[0].amount));
    for (let i = 1; i < quotesData.length; i++) {
      const prev = quotesData[i - 1];
      const curr = quotesData[i];
      const cp1x = xScale(prev.day) + (xScale(curr.day) - xScale(prev.day)) * 0.4;
      const cp1y = yScale(prev.amount);
      const cp2x = xScale(curr.day) - (xScale(curr.day) - xScale(prev.day)) * 0.4;
      const cp2y = yScale(curr.amount);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, xScale(curr.day), yScale(curr.amount));
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Puntos
    quotesData.forEach((data) => {
      const x = xScale(data.day);
      const y = yScale(data.amount);
      // Mostrar el mismo estilo para hovered y clicked
      if (data.day === hoveredPoint || data.day === clickedPoint) {
        ctx.fillStyle = colors.pointHover;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = colors.pointHover;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = colors.pointColor;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Etiquetas eje X
    ctx.fillStyle = colors.textSecondary;
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    quotesData.forEach((data, index) => {
      if (index % 5 === 0) {
        const x = xScale(data.day);
        const y = margin.top + chartHeight + 10;
        ctx.fillText(data.label, x, y);
      }
    });

    // Título
    ctx.fillStyle = colors.textPrimary;
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const title = reportType === 'cotizaciones' ? 'Cotizaciones a lo largo del mes' : 'Ventas a lo largo del mes';
    ctx.fillText(title, margin.left, 5);

    // Subtítulo
    ctx.fillStyle = colors.textSecondary;
    ctx.font = '12px system-ui';
    ctx.textAlign = 'right';
    const subtitle = reportType === 'cotizaciones' ? 'Monto total cotizado por día' : 'Monto total vendido por día';
    ctx.fillText(subtitle, width - margin.right, 5);
  }, [period, isDark, hoveredPoint, clickedPoint, quotesData, loading]);

  if (loading) {
    return (
      <div className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            {reportType === 'cotizaciones' ? 'Cotizaciones' : 'Ventas'} a lo largo del tiempo
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Cargando datos...
          </p>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            {reportType === 'cotizaciones' ? 'Cotizaciones' : 'Ventas'} a lo largo del tiempo
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-danger)' }}>
            Error: {error}
          </p>
        </div>
        <div className="h-64 flex items-center justify-center">
          <p style={{ color: 'var(--text-secondary)' }}>Los datos no pudieron cargarse</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}>
      <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            {reportType === 'cotizaciones' ? 'Cotizaciones a lo Largo del Tiempo' : 'Ventas a lo Largo del Tiempo'}
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {reportType === 'cotizaciones' 
              ? 'Evolución del monto cotizado día a día - visualiza las propuestas generadas'
              : 'Evolución del monto vendido día a día - visualiza los ingresos reales'}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--accent-text)' }}></div>
            <span style={{ color: 'var(--text-secondary)' }}>{reportType === 'cotizaciones' ? 'Monto cotizado' : 'Monto vendido'}</span>
          </div>
          <div className="px-3 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
            Click para seleccionar
          </div>
        </div>
      </div>

      <div className="relative">
        <canvas ref={canvasRef} className="w-full" style={{ height: window.innerWidth < 640 ? '250px' : '350px' }} />
        {tooltip && (
          <div className="absolute pointer-events-none z-10 px-3 py-2 rounded-lg shadow-lg border text-sm whitespace-nowrap"
               style={{ left: tooltip.x + 10, top: tooltip.y - 40, backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
            <div className="font-semibold mb-1" style={{ color: 'var(--accent-text)' }}>
              {tooltip.data.fullDate ? new Date(tooltip.data.fullDate).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: period === 'Último año' ? 'numeric' : undefined }) : tooltip.data.label}
            </div>
            <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(tooltip.data.amount)}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
              MÁXIMO
            </p>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              ${Math.max(...quotesData.map(d => d.amount)).toLocaleString('es-CL')}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
              MÍNIMO
            </p>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              ${Math.min(...quotesData.map(d => d.amount)).toLocaleString('es-CL')}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
              PROMEDIO
            </p>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              ${Math.round(quotesData.reduce((s, d) => s + d.amount, 0) / quotesData.length).toLocaleString('es-CL')}
            </p>
          </div>
        </div>
        <div className="mt-3 text-center">
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Hover para ver detalles de cada punto
          </p>
        </div>
      </div>
    </div>
  );
}
