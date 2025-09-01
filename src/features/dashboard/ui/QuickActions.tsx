"use client";
import { FiPlusCircle, FiUserPlus, FiBox, FiTrendingUp } from "react-icons/fi";
import { useSection } from "@/features/navigation/model/useSection";


import { Toast } from "@/shared/ui/Toast";

// Acciones rápidas inspiradas en el HTML de referencia
const quickActions = [
  {
    icon: <FiPlusCircle className="w-7 h-7 text-orange-600" />,
    title: "Nueva Cotización",
    description: "Crear una nueva cotización para un cliente",
    action: "create-quote",
  },
  {
    icon: <FiUserPlus className="w-7 h-7 text-orange-600" />,
    title: "Agregar Cliente",
    description: "Registrar un nuevo cliente en el sistema",
    action: "go-clients",
  },
  {
    icon: <FiBox className="w-7 h-7 text-orange-600" />,
    title: "Gestionar Productos",
    description: "Administrar catálogo de productos",
    action: "go-catalog",
  },
  {
    icon: <FiTrendingUp className="w-7 h-7 text-orange-600" />,
    title: "Ver Reportes",
    description: "Analizar métricas y rendimiento",
    action: "go-reports",
  },
];

export function QuickActions() {
  const { setSection } = useSection();

  const handleActionClick = (action: string) => {
  switch (action) {
      case "create-quote":
    // TODO: open new quote modal or navigate
        break;
      case "go-clients":
        setSection("clientes");
        break;
      case "go-catalog":
  setSection("stock");
        break;
      case "go-reports":
        setSection("reportes");
        break;
    }
  };

  return (
    <div 
      className="rounded-xl p-4 sm:p-6"
      style={{ 
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-subtle)' 
      }}
    >
      {/* Header de la sección */}
      <div className="mb-3 sm:mb-4 lg:mb-6">
        <h3 className="section-title text-lg sm:text-xl mb-1">
          Acciones Rápidas
        </h3>
        <p className="text-xs sm:text-sm text-theme-secondary">
          Accede rápidamente a las funciones más utilizadas
        </p>
      </div>

      {/* Grid de acciones */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        {quickActions.map((a, idx) => (
          <button
            key={a.action}
            onClick={() => handleActionClick(a.action)}
            className="group text-left rounded-xl p-3 sm:p-4 lg:p-5 hover:shadow-theme-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 animate-slideUp"
            style={{ 
              backgroundColor: 'var(--bg-primary)',
              animationDelay: `${idx * 60}ms`,
              border: '2px solid var(--border-subtle)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-2 sm:mb-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-orange-600 dark:text-orange-400">
                  {a.icon}
                </div>
              </div>
              <h4 className="font-semibold text-theme-primary mb-1 text-sm sm:text-base">
                {a.title}
              </h4>
              <p className="text-xs sm:text-sm text-theme-secondary hidden sm:block">
                {a.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Chips secundarios - responsive */}
      <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2">

        <button
          onClick={() => Toast?.info?.("Importación próximamente")}
          className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-theme-secondary hover:bg-theme-accent text-xs sm:text-sm transition-colors"
          style={{ border: '1px solid var(--border-subtle)' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          Importar CSV
        </button>
        <button
          onClick={() => Toast?.info?.("Atajos: N nueva cotización, / buscar, G ir a sección")}
          className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-theme-secondary hover:bg-theme-accent text-xs sm:text-sm hidden sm:inline-flex transition-colors"
          style={{ border: '1px solid var(--border-subtle)' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          Atajos del teclado
        </button>
      </div>
      
    </div>
  );
}
