"use client";

import { ReportPeriod } from "@/app/dashboard/reportes/page";
import { useEffect, useRef, useState } from "react";

interface CategoryDistributionChartProps {
  period: ReportPeriod;
}

// Datos mock para el gráfico de donut
const mockCategoryData = [
  { 
    category: "Servicios de Consultoría", 
    value: 35, 
    color: "#8b5cf6",
    amount: "$115,500",
    description: "Consultoría estratégica y asesoramiento"
  },
  { 
    category: "Desarrollo de Software", 
    value: 28, 
    color: "#06b6d4",
    amount: "$91,840",
    description: "Desarrollo web y aplicaciones"
  },
  { 
    category: "Licencias de Software", 
    value: 22, 
    color: "#10b981",
    amount: "$72,160",
    description: "Office 365, Windows, etc."
  },
  { 
    category: "Equipos y Hardware", 
    value: 15, 
    color: "#f59e0b",
    amount: "$49,200",
    description: "Computadores, servidores, etc."
  }
];

export function CategoryDistributionChart({ period }: CategoryDistributionChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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

    // Dibujar cada segmento con efectos mejorados
    mockCategoryData.forEach((segment, index) => {
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
    const totalValue = mockCategoryData.reduce((sum, item) => sum + parseFloat(item.amount.replace(/[$,]/g, '')), 0);
    
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#000000';
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Total Ventas', centerX, centerY - 12);

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

  }, [period, hoveredSegment]);

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

      for (let i = 0; i < mockCategoryData.length; i++) {
        const sliceAngle = (mockCategoryData[i].value / 100) * 2 * Math.PI;
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
          className="w-64 h-64 mx-auto cursor-pointer"
          style={{ backgroundColor: 'transparent' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        
        {/* Tooltip flotante */}
        {hoveredSegment !== null && (
          <div 
            className="absolute z-10 bg-black/80 text-white p-2 rounded-md text-xs pointer-events-none transition-all"
            style={{ 
              left: mousePos.x + 10,
              top: mousePos.y - 10,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div className="font-semibold">{mockCategoryData[hoveredSegment].category}</div>
            <div>{mockCategoryData[hoveredSegment].amount} ({mockCategoryData[hoveredSegment].value}%)</div>
          </div>
        )}
      </div>

      {/* Leyenda mejorada */}
      <div className="flex-1 space-y-3">
        {mockCategoryData.map((item, index) => (
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
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {item.category}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {item.description}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
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
        ))}

        {/* Resumen total mejorado */}
        <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Total de ventas por categoría
                </span>
                <div className="mt-1">
                  <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    $328,700
                  </span>
                  <span className="text-sm ml-2 text-green-600 dark:text-green-400">
                    +12% vs período anterior
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
