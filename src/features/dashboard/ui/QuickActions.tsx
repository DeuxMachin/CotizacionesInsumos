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
        setSection("catalogo");
        break;
      case "go-reports":
        setSection("reportes");
        break;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      {/* Header de la sección */}
      <div className="mb-4 sm:mb-6">
        <h3 className="section-title text-xl font-semibold text-gray-900 mb-1">
          Acciones Rápidas
        </h3>
        <p className="text-sm text-gray-600">
          Accede rápidamente a las funciones más utilizadas
        </p>
      </div>

      {/* Grid de acciones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {quickActions.map((a, idx) => (
          <button
            key={a.action}
            onClick={() => handleActionClick(a.action)}
            className="group text-left bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-orange-500 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-3">
                {a.icon}
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">
                {a.title}
              </h4>
              <p className="text-sm text-gray-600">
                {a.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Chips secundarios */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => {
            const csv = quotesToCSV(quotesData);
            downloadCSV(csv, "cotizaciones.csv");
            Toast?.success?.("Cotizaciones exportadas");
          }}
          className="px-3 py-1.5 rounded-full border border-gray-200 text-gray-700 hover:border-orange-400 hover:bg-orange-50 text-sm"
        >
          Exportar CSV
        </button>
        <button
          onClick={() => Toast?.info?.("Importación próximamente")}
          className="px-3 py-1.5 rounded-full border border-gray-200 text-gray-700 hover:border-orange-400 hover:bg-orange-50 text-sm"
        >
          Importar CSV
        </button>
        <button
          onClick={() => Toast?.info?.("Atajos: N nueva cotización, / buscar, G ir a sección")}
          className="px-3 py-1.5 rounded-full border border-gray-200 text-gray-700 hover:border-orange-400 hover:bg-orange-50 text-sm"
        >
          Atajos del teclado
        </button>
      </div>
      <NewQuoteModal.Root controlledOpen={openNew} onClose={() => setOpenNew(false)} />
    </div>
  );
}
