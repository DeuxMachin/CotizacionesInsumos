"use client";
import { FiPlusCircle, FiUserPlus, FiBox, FiTrendingUp } from "react-icons/fi";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const handleActionClick = (action: string) => {
    switch (action) {
      case "create-quote":
        router.push("/dashboard/cotizaciones/nueva");
        break;
      case "go-clients":
        router.push("/dashboard/clientes");
        break;
      case "go-catalog":
        router.push("/dashboard/stock");
        break;
      case "go-reports":
        router.push("/dashboard/reportes");
        break;
      default:
        console.log("Funcionalidad en desarrollo");
    }
  };

  return (
    <div 
      className="rounded-xl p-3 sm:p-6"
      style={{ 
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-subtle)' 
      }}
    >
      {/* Header de la sección */}
      <div className="mb-3 sm:mb-4 lg:mb-6">
        <h3 className="section-title text-base sm:text-lg mb-1">
          Acciones Rápidas
        </h3>
        <p className="text-xs sm:text-sm text-theme-secondary">
          Accede rápidamente a las funciones más utilizadas
        </p>
      </div>

      {/* Grid de acciones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        {quickActions.map((a, idx) => (
          <button
            key={a.action}
            onClick={() => handleActionClick(a.action)}
            className="group text-left rounded-xl p-2 sm:p-4 lg:p-5 hover:shadow-theme-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 animate-slideUp w-full"
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
                <div className="w-4 h-4 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-orange-600 dark:text-orange-400">
                  {a.icon}
                </div>
              </div>
              <h4 className="font-semibold text-theme-primary mb-1 text-xs sm:text-sm truncate">
                {a.title}
              </h4>
              <p className="text-xs sm:text-sm text-theme-secondary hidden sm:block truncate">
                {a.description}
              </p>
            </div>
          </button>
        ))}
      </div>

   
      
    </div>
  );
}
