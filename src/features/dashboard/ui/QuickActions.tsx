"use client";

import { useState } from "react";
import { FiPlusCircle, FiUserPlus, FiBox, FiTrendingUp } from "react-icons/fi";
import { useSection } from "@/features/navigation/model/useSection";
import { quotesData } from "@/features/quotes/model/mock";
import { quotesToCSV, downloadCSV } from "@/shared/lib/csv";
import { Toast } from "@/shared/ui/Toast";
import { NewQuoteModal } from "@/features/quotes/ui/NewQuoteModal";

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
  const [openNew, setOpenNew] = useState(false);

  const handleActionClick = (action: string) => {
    switch (action) {
      case "create-quote":
        setOpenNew(true);
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
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      {/* Header de la sección */}
      <div className="mb-3 sm:mb-4 lg:mb-6">
        <h3 className="section-title text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1">
          Acciones Rápidas
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Accede rápidamente a las funciones más utilizadas
        </p>
      </div>

      {/* Grid de acciones */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        {quickActions.map((a, idx) => (
          <button
            key={a.action}
            onClick={() => handleActionClick(a.action)}
            className="group text-left bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4 lg:p-5 hover:border-orange-500 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-2 sm:mb-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-orange-600 dark:text-orange-400">
                  {a.icon}
                </div>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm sm:text-base">
                {a.title}
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                {a.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Chips secundarios - responsive */}
      <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2">
        <button
          onClick={() => {
            const csv = quotesToCSV(quotesData);
            downloadCSV(csv, "cotizaciones.csv");
            Toast?.success?.("Cotizaciones exportadas");
          }}
          className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-orange-400 dark:hover:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-xs sm:text-sm"
        >
          Exportar CSV
        </button>
        <button
          onClick={() => Toast?.info?.("Importación próximamente")}
          className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-orange-400 dark:hover:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-xs sm:text-sm"
        >
          Importar CSV
        </button>
        <button
          onClick={() => Toast?.info?.("Atajos: N nueva cotización, / buscar, G ir a sección")}
          className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-orange-400 dark:hover:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-xs sm:text-sm hidden sm:inline-flex"
        >
          Atajos del teclado
        </button>
      </div>
      <NewQuoteModal.Root controlledOpen={openNew} onClose={() => setOpenNew(false)} />
    </div>
  );
}
