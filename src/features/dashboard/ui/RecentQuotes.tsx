"use client";

import { quotesData } from "@/features/quotes/model/mock";
import { Badge } from "@/shared/ui/Badge";
import { FiEye, FiDownload } from "react-icons/fi";

export function RecentQuotes() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      {/* Header con título y acción */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Cotizaciones Recientes
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Últimas cotizaciones generadas en el sistema
          </p>
        </div>
  <button className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 font-medium hover:text-orange-700 dark:hover:text-orange-300 transition-colors">
          <FiEye className="w-4 h-4" />
          Ver Todas
        </button>
      </div>

      {/* Lista de cotizaciones */}
      <div className="space-y-4">
        {quotesData.slice(0, 3).map((quote, index) => (
          <div 
            key={quote.id} 
            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm transition-all duration-200 animate-slideUp"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Información de la cotización */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="font-semibold text-purple-600 text-sm">
                  {quote.id}
                </div>
                <Badge status={quote.status} />
              </div>
              
              <div className="text-gray-900 dark:text-white font-medium mb-1">
                {quote.client}
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(quote.date).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'short', 
                  day: 'numeric'
                })}
              </div>
            </div>

            {/* Monto y acciones */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="font-bold text-gray-900 dark:text-white">
                  ${quote.amount.toLocaleString("es-ES", { minimumFractionDigits: 0 })}
                </div>
              </div>
              
              <button 
                className="btn-icon"
                aria-label="Descargar cotización"
              >
                <FiDownload className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer con estadística rápida */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Total de cotizaciones activas: <span className="font-semibold text-gray-900 dark:text-white">24</span>
          </span>
          <span className="text-green-600 dark:text-green-500 font-medium">
            +12% este mes
          </span>
        </div>
      </div>
    </div>
  );
}
