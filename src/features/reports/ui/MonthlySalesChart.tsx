import { useEffect, useRef, useState } from 'react';
import { ReportPeriod } from '@/app/dashboard/reportes/page';
import { reportesService, ReportData } from '@/services/reportesService';

interface MonthlySalesChartProps {
  period: ReportPeriod;
}

interface MonthlySalesData {
  day: number;
  sales: number;
  label: string;
}

// Datos mock para las ventas diarias del mes
const mockMonthlySalesData: MonthlySalesData[] = [
  { day: 1, sales: 245000, label: 'D01' },
  { day: 2, sales: 320000, label: 'D02' },
  { day: 3, sales: 280000, label: 'D03' },
  { day: 4, sales: 390000, label: 'D04' },
  { day: 5, sales: 450000, label: 'D05' },
  { day: 6, sales: 380000, label: 'D06' },
  { day: 7, sales: 520000, label: 'D07' },
  { day: 8, sales: 480000, label: 'D08' },
  { day: 9, sales: 350000, label: 'D09' },
  { day: 10, sales: 420000, label: 'D10' },
  { day: 11, sales: 510000, label: 'D11' },
  { day: 12, sales: 579290, label: 'D12' }, // Punto actual según imagen
  { day: 13, sales: 490000, label: 'D13' },
  { day: 14, sales: 440000, label: 'D14' },
  { day: 15, sales: 380000, label: 'D15' },
  { day: 16, sales: 320000, label: 'D16' },
  { day: 17, sales: 290000, label: 'D17' },
  { day: 18, sales: 340000, label: 'D18' },
  { day: 19, sales: 410000, label: 'D19' },
  { day: 20, sales: 460000, label: 'D20' },
  { day: 21, sales: 520000, label: 'D21' },
  { day: 22, sales: 480000, label: 'D22' },
  { day: 23, sales: 390000, label: 'D23' },
  { day: 24, sales: 450000, label: 'D24' },
  { day: 25, sales: 510000, label: 'D25' },
  { day: 26, sales: 470000, label: 'D26' },
  { day: 27, sales: 420000, label: 'D27' },
  { day: 28, sales: 380000, label: 'D28' },
  { day: 29, sales: 340000, label: 'D29' },
  { day: 30, sales: 310000, label: 'D30' }
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

  // Cargar datos reales
  useEffect(() => {
    const loadSalesData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await reportesService.getReportData(period);
        setSalesData(data.ventasMensuales);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
        setSalesData(mockMonthlySalesData); // Fallback a datos mock
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

  // Manejo de interacciones del mouse
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Configuración de margenes (debe coincidir con el dibujo)
      const margin = { top: 20, right: 30, bottom: 60, left: 80 };
      const chartWidth = rect.width - margin.left - margin.right;
      const chartHeight = rect.height - margin.top - margin.bottom;
      
      // Buscar punto más cercano al mouse
      let closestPoint = null;
      let minDistance = Infinity;
      
      salesData.forEach((data) => {
        const pointX = margin.left + (data.day - 1) * (chartWidth / (salesData.length - 1));
        const maxSales = Math.max(...salesData.map(d => d.sales));
        const minSales = Math.min(...salesData.map(d => d.sales));
        const salesRange = maxSales - minSales;
        const pointY = margin.top + chartHeight - ((data.sales - minSales) / salesRange) * chartHeight;
        
        const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);
        
        if (distance < 20 && distance < minDistance) { // Radio de detección de 20px
          minDistance = distance;
          closestPoint = data.day;
          setTooltip({ x: pointX, y: pointY, data });
        }
      });
      
      if (closestPoint !== hoveredPoint) {
        setHoveredPoint(closestPoint);
        if (!closestPoint) {
          setTooltip(null);
        }
        canvas.style.cursor = closestPoint ? 'pointer' : 'default';
      }
    };

    const handleClick = (event: MouseEvent) => {
      if (hoveredPoint) {
        setClickedPoint(hoveredPoint);
      }
    };

    const handleMouseLeave = () => {
      setHoveredPoint(null);
      setTooltip(null);
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
  }, [hoveredPoint]);

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

    // Márgenes
    const margin = { top: 20, right: 30, bottom: 60, left: 80 };
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
    ctx.font = '11px system-ui';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i <= gridLines; i++) {
      const value = minSales + (i * salesRange) / gridLines;
      const y = margin.top + chartHeight - (i * chartHeight) / gridLines;
      const formattedValue = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
      ctx.fillText(formattedValue, margin.left - 10, y);
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
      
      // Punto seleccionado (clickeado)
      if (data.day === clickedPoint) {
        // Halo exterior para el punto seleccionado
        ctx.strokeStyle = colors.pointHover;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.stroke();
        
        // Punto principal
        ctx.fillStyle = colors.pointHover;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      // Punto con hover
      else if (data.day === hoveredPoint) {
        // Efecto de hover
        ctx.fillStyle = colors.pointHover;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Borde suave
        ctx.strokeStyle = colors.pointHover;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Puntos normales
      else {
        ctx.fillStyle = colors.pointColor;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Etiquetas del eje X (cada 5 días para no saturar)
    ctx.fillStyle = colors.textSecondary;
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    mockMonthlySalesData.forEach((data, index) => {
      if (index % 5 === 0) {
        const x = xScale(data.day);
        const y = margin.top + chartHeight + 10;
        ctx.fillText(data.label, x, y);
      }
    });

    // Título del gráfico
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

    // Valor destacado del punto seleccionado
    const selectedData = mockMonthlySalesData.find(d => d.day === clickedPoint);
    if (selectedData) {
      ctx.fillStyle = colors.lineColor;
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'left';
      const x = xScale(selectedData.day);
      const y = yScale(selectedData.sales) - 25;
      const formattedValue = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(selectedData.sales);
      
      // Fondo para el texto
      const textWidth = ctx.measureText(`${selectedData.label}: ${formattedValue}`).width;
      ctx.fillStyle = 'var(--bg-tooltip)';
      ctx.fillRect(x + 10, y - 5, textWidth + 10, 20);
      
      // Texto
      ctx.fillStyle = colors.lineColor;
      ctx.fillText(`${selectedData.label}: ${formattedValue}`, x + 15, y + 8);
    }

  }, [period, isDark, hoveredPoint, clickedPoint, salesData, loading]);

  if (loading) {
    return (
      <div className="p-6 rounded-xl border" style={{ 
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-subtle)'
      }}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Ventas a lo largo del mes
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Cargando datos...
          </p>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl border" style={{ 
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-subtle)'
      }}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Ventas a lo largo del mes
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
    <div className="p-6 rounded-xl border" style={{ 
      backgroundColor: 'var(--bg-primary)',
      borderColor: 'var(--border-subtle)'
    }}>
      <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Ventas a lo largo del mes
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Monto total vendido en cada período
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--accent-text)' }}></div>
            <span style={{ color: 'var(--text-secondary)' }}>Ventas diarias</span>
          </div>
          <div className="px-3 py-1 rounded-lg text-xs font-medium" style={{
            backgroundColor: 'var(--accent-bg)',
            color: 'var(--accent-text)'
          }}>
            Click para seleccionar
          </div>
        </div>
      </div>

      {/* Canvas para el gráfico */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ height: '350px' }}
        />
        
        {/* Tooltip interactivo */}
        {tooltip && (
          <div 
            className="absolute pointer-events-none z-10 px-3 py-2 rounded-lg shadow-lg border text-sm"
            style={{ 
              left: tooltip.x + 10,
              top: tooltip.y - 40,
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          >
            <div className="font-semibold" style={{ color: 'var(--accent-text)' }}>
              {tooltip.data.label}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {new Intl.NumberFormat('es-CL', {
                style: 'currency',
                currency: 'CLP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(tooltip.data.sales)}
            </div>
          </div>
        )}
      </div>

      {/* Resumen estadístico */}
      <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
              MÁXIMO
            </p>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              ${Math.max(...mockMonthlySalesData.map(d => d.sales)).toLocaleString('es-CL')}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
              MÍNIMO
            </p>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              ${Math.min(...mockMonthlySalesData.map(d => d.sales)).toLocaleString('es-CL')}
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
              SELECCIONADO
            </p>
            <p className="text-sm font-bold" style={{ color: 'var(--accent-text)' }}>
              {clickedPoint ? 
                `D${clickedPoint.toString().padStart(2, '0')}: $${salesData.find(d => d.day === clickedPoint)?.sales.toLocaleString('es-CL') || '0'}`
                : 'Ninguno'
              }
            </p>
          </div>
        </div>
        
        {/* Instrucciones de uso */}
        <div className="mt-3 text-center">
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Haz hover sobre los puntos para ver detalles • Click para seleccionar
          </p>
        </div>
      </div>
    </div>
  );
}
