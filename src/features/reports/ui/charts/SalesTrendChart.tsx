"use client";

import { ReportPeriod } from "@/app/dashboard/reportes/page";
import { useEffect, useRef, useState } from "react";
import { reportesService } from "@/services/reportesService";

interface SalesTrendChartProps {
  period: ReportPeriod;
}

interface SalesDataPoint {
  month: string;
  value: number;
  label: string;
}

// Datos mock mejorados para el gráfico de líneas (fallback)
const mockSalesData: SalesDataPoint[] = [
  { month: "Ene", value: 45000, label: "Enero" },
  { month: "Feb", value: 52000, label: "Febrero" },
  { month: "Mar", value: 48000, label: "Marzo" },
  { month: "Abr", value: 61000, label: "Abril" },
  { month: "May", value: 55000, label: "Mayo" },
  { month: "Jun", value: 67000, label: "Junio" }
];

export function SalesTrendChart({ period }: SalesTrendChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [salesData, setSalesData] = useState<SalesDataPoint[]>(mockSalesData);
  const [loading, setLoading] = useState(true);

  // Cargar datos reales
  useEffect(() => {
    const loadSalesData = async () => {
      try {
        setLoading(true);
        const data = await reportesService.getReportData(period);
        
        // Convertir datos diarios a mensuales para el gráfico de tendencias
        // Tomar datos por semanas para simplificar
        const weeklyData: SalesDataPoint[] = [];
        const dailyData = data.ventasMensuales;
        
        for (let i = 0; i < dailyData.length; i += 5) {
          const weekData = dailyData.slice(i, i + 5);
          const weekTotal = weekData.reduce((sum, day) => sum + day.sales, 0);
          const weekNumber = Math.floor(i / 5) + 1;
          
          weeklyData.push({
            month: `S${weekNumber}`,
            value: weekTotal,
            label: `Semana ${weekNumber}`
          });
        }
        
        setSalesData(weeklyData.length > 0 ? weeklyData : mockSalesData);
      } catch (err) {
        console.error('Error cargando datos de tendencias:', err);
        setSalesData(mockSalesData); // Fallback a datos mock
      } finally {
        setLoading(false);
      }
    };

    loadSalesData();
  }, [period]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading) return;

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
    const padding = 50;
    const chartWidth = rect.width - padding * 2;
    const chartHeight = rect.height - padding * 2;

    // Encontrar valores máximo y mínimo
    const maxValue = Math.max(...salesData.map(d => d.value));
    const minValue = Math.min(...salesData.map(d => d.value)) * 0.9; // Un poco más bajo para mejor visualización
    const valueRange = maxValue - minValue;

    // Función para obtener coordenadas
    const getX = (index: number) => padding + (chartWidth / (salesData.length - 1)) * index;
    const getY = (value: number) => padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;

    // Dibujar líneas de cuadrícula más elegantes
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border') || '#e5e7eb';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;
    
    // Líneas horizontales
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }

    // Líneas verticales
    salesData.forEach((_, index) => {
      const x = getX(index);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + chartHeight);
      ctx.stroke();
    });

    ctx.globalAlpha = 1;

    // Crear gradiente para el área bajo la curva
    const gradient = ctx.createLinearGradient(0, padding, 0, padding + chartHeight);
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
    gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.1)');
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.05)');

    // Dibujar área bajo la curva con curvas suaves
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(salesData[0].value));
    
    for (let i = 1; i < salesData.length; i++) {
      const currentX = getX(i);
      const currentY = getY(salesData[i].value);
      const prevX = getX(i - 1);
      const prevY = getY(salesData[i - 1].value);
      
      // Control points para curva suave
      const cp1x = prevX + (currentX - prevX) / 3;
      const cp1y = prevY;
      const cp2x = currentX - (currentX - prevX) / 3;
      const cp2y = currentY;
      
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, currentX, currentY);
    }

    // Completar el área
    ctx.lineTo(getX(salesData.length - 1), padding + chartHeight);
    ctx.lineTo(getX(0), padding + chartHeight);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Dibujar la línea principal
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(salesData[0].value));
    
    for (let i = 1; i < salesData.length; i++) {
      const currentX = getX(i);
      const currentY = getY(salesData[i].value);
      const prevX = getX(i - 1);
      const prevY = getY(salesData[i - 1].value);
      
      const cp1x = prevX + (currentX - prevX) / 3;
      const cp1y = prevY;
      const cp2x = currentX - (currentX - prevX) / 3;
      const cp2y = currentY;
      
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, currentX, currentY);
    }
    
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Dibujar puntos con efecto glow
    salesData.forEach((point, index) => {
      const x = getX(index);
      const y = getY(point.value);
      
      // Glow effect
      ctx.shadowColor = '#8b5cf6';
      ctx.shadowBlur = 10;
      
      // Punto exterior
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#8b5cf6';
      ctx.fill();
      
      // Punto interior
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary') || '#ffffff';
      ctx.fill();
    });

    // Etiquetas de los meses
    ctx.shadowBlur = 0;
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#6b7280';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    
    salesData.forEach((point, index) => {
      const x = getX(index);
      ctx.fillText(point.month, x, rect.height - 15);
    });

    // Etiquetas de valores (opcional, solo en algunos puntos)
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary') || '#9ca3af';
    ctx.font = '10px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 4; i++) {
      const value = minValue + (valueRange / 4) * i;
      const y = padding + chartHeight - (chartHeight / 4) * i;
      ctx.fillText(`$${(value / 1000).toFixed(0)}k`, padding - 10, y + 3);
    }

  }, [period, salesData, loading]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-full h-64 rounded-lg"
        style={{ backgroundColor: 'transparent' }}
      />
      
      {/* Leyenda mejorada con estadísticas */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500 shadow-sm"></div>
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Ventas mensuales
            </span>
          </div>
          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Tendencia: <span className="text-green-600">↗ +22%</span>
          </div>
        </div>
        
        {/* Estadísticas adicionales */}
        <div className="grid grid-cols-3 gap-4 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="text-center">
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Promedio</p>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>$55,500</p>
          </div>
          <div className="text-center">
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Máximo</p>
            <p className="font-semibold text-green-600">$67,000</p>
          </div>
          <div className="text-center">
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Crecimiento</p>
            <p className="font-semibold text-blue-600">+49%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
