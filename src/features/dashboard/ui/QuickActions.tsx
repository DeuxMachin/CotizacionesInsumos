"use client";

import { FiPlus, FiUsers, FiSettings, FiBarChart2 } from "react-icons/fi";
import { useSection } from "@/features/navigation/model/useSection";

// Configuración de acciones rápidas con navegación inteligente
const quickActions = [
  {
    icon: <FiPlus className="w-6 h-6" />,
    title: "Nueva Cotización", 
    description: "Crear nueva cotización",
    action: "create-quote",
    isPrimary: true,
  },
  {
    icon: <FiUsers className="w-6 h-6" />,
    title: "Ver Clientes",
    description: "Gestionar clientes",
    action: "view-clients",
    isPrimary: false,
  },
  {
    icon: <FiSettings className="w-6 h-6" />,
    title: "Gestionar Catálogo", 
    description: "Administrar productos",
    action: "manage-catalog",
    isPrimary: false,
  },
  {
    icon: <FiBarChart2 className="w-6 h-6" />,
    title: "Ver Reportes",
    description: "Análisis y métricas", 
    action: "view-reports",
    isPrimary: false,
  },
];

export function QuickActions() {
  const { setSection } = useSection();

  const handleActionClick = (action: string) => {
    switch (action) {
      case "create-quote":
        // Aquí podrías abrir un modal o navegar a crear cotización
        console.log("Abrir modal de nueva cotización");
        break;
      case "view-clients":
        setSection("clientes");
        break;
      case "manage-catalog":
        setSection("catalogo");
        break;
      case "view-reports":
        setSection("reportes");
        break;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      {/* Header de la sección */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Acciones Rápidas
        </h3>
        <p className="text-sm text-gray-600">
          Accede rápidamente a las funciones más utilizadas
        </p>
      </div>

      {/* Grid de acciones con diseño responsivo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action, index) => (
          <button
            key={action.action}
            onClick={() => handleActionClick(action.action)}
            className={`
              ${action.isPrimary ? 'quick-action-primary' : 'quick-action'}
              animate-slideUp
            `}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Icono con efecto hover */}
            <div className={`
              mb-3 transition-transform duration-200 group-hover:scale-110
              ${action.isPrimary ? 'text-white' : 'text-gray-700'}
            `}>
              {action.icon}
            </div>
            
            {/* Título de la acción */}
            <h4 className={`
              font-semibold text-sm mb-1
              ${action.isPrimary ? 'text-white' : 'text-gray-900'}
            `}>
              {action.title}
            </h4>
            
            {/* Descripción opcional */}
            <p className={`
              text-xs
              ${action.isPrimary ? 'text-purple-100' : 'text-gray-500'}
            `}>
              {action.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
