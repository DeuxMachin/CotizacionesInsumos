"use client";

import { FiFileText, FiUsers, FiBox, FiTrendingUp } from "react-icons/fi";

// Datos de las estadísticas con iconos y colores mejorados
const statsData = [
  {
    icon: <FiFileText className="w-6 h-6" />,
    label: "Cotizaciones Activas", 
    value: "24",
    change: "+12% desde el mes pasado",
    changeType: "positive" as const,
  color: "bg-orange-100 text-orange-600"
  },
  {
    icon: <FiUsers className="w-6 h-6" />,
    label: "Clientes Registrados",
    value: "156", 
    change: "+8% desde el mes pasado",
    changeType: "positive" as const,
    color: "bg-blue-100 text-blue-600"
  },
  {
    icon: <FiBox className="w-6 h-6" />,
    label: "Productos en Catálogo",
    value: "89",
    change: "+3% desde el mes pasado", 
    changeType: "positive" as const,
    color: "bg-green-100 text-green-600"
  },
  {
    icon: <FiTrendingUp className="w-6 h-6" />,
    label: "Ventas del Mes",
    value: "$45,230",
    change: "+15% desde el mes pasado",
    changeType: "positive" as const,
    color: "bg-amber-100 text-amber-600"
  },
];

export function Stats() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {statsData.map((stat, index) => (
        <div 
          key={stat.label}
          className="stat-card group animate-slideUp"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Icono con fondo colorido */}
          <div className={`
            inline-flex h-12 w-12 items-center justify-center rounded-lg mb-4 
            ${stat.color} group-hover:scale-110 transition-transform duration-200
          `}>
            {stat.icon}
          </div>
          
          {/* Valor principal */}
          <div className="stat-number mb-1">
            {stat.value}
          </div>
          
          {/* Etiqueta descriptiva */}
          <div className="stat-label mb-3">
            {stat.label}
          </div>
          
          {/* Indicador de cambio */}
          <div className={`
            stat-change 
            ${stat.changeType === 'positive' 
              ? 'stat-change-positive' 
              : 'stat-change-negative'
            }
          `}>
            {stat.change}
          </div>
        </div>
      ))}
    </div>
  );
}
