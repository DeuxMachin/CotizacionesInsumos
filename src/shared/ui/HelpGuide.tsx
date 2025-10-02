"use client";

import React from 'react';
import { FiX, FiHelpCircle, FiEdit2, FiTrash2, FiXCircle, FiShoppingCart, FiDownload, FiCopy, FiEye } from 'react-icons/fi';

interface HelpGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpGuide({ isOpen, onClose }: HelpGuideProps) {
  if (!isOpen) return null;

  const actions = [
    {
      icon: FiEye,
      title: "Ver Detalle",
      description: "Visualiza toda la información de la cotización, incluyendo productos, cliente, condiciones comerciales y estado.",
      color: "text-blue-500"
    },
    {
      icon: FiEdit2,
      title: "Editar",
      description: "Modifica los productos y la información de despacho de la cotización. Solo disponible para cotizaciones no aceptadas ni rechazadas.",
      color: "text-orange-500"
    },
    {
      icon: FiShoppingCart,
      title: "Pasar a Venta",
      description: "Convierte la cotización en una nota de venta. Esta acción marca la cotización como 'Aceptada' y genera el documento de venta correspondiente.",
      color: "text-green-500"
    },
    {
      icon: FiDownload,
      title: "Descargar PDF",
      description: "Genera y descarga un PDF profesional de la cotización para enviar al cliente o guardar en tus registros.",
      color: "text-purple-500"
    },
    {
      icon: FiCopy,
      title: "Duplicar",
      description: "Crea una copia de la cotización con todos sus productos y configuración. Útil para crear cotizaciones similares rápidamente.",
      color: "text-gray-500"
    },
    {
      icon: FiXCircle,
      title: "Cancelar (Admin/Dueño)",
      description: "Rechaza la cotización permanentemente. Las cotizaciones rechazadas no se pueden modificar ni eliminar. Esta acción es solo para usuarios con rol de Administrador o Dueño.",
      color: "text-orange-600"
    },
    {
      icon: FiTrash2,
      title: "Eliminar (Admin/Dueño)",
      description: "Elimina permanentemente la cotización y todos sus datos relacionados. Solo se pueden eliminar cotizaciones que no estén aceptadas ni rechazadas. Esta acción es solo para usuarios con rol de Administrador o Dueño.",
      color: "text-red-500"
    }
  ];

  const states = [
    {
      name: "Borrador",
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-500",
      description: "Cotización en proceso de creación o pendiente de enviar al cliente."
    },
    {
      name: "Enviada",
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-500",
      description: "Cotización enviada al cliente, esperando respuesta."
    },
    {
      name: "Aceptada",
      color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-500",
      description: "Cotización aceptada por el cliente y convertida en venta."
    },
    {
      name: "Rechazada",
      color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-500",
      description: "Cotización rechazada por el cliente."
    },
    {
      name: "Expirada",
      color: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-500",
      description: "Cotización que ha superado su fecha de validez."
    },
    {
      name: "Rechazada",
      color: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-500",
      description: "Cotización rechazada por un administrador. No se puede modificar."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-4xl rounded-lg shadow-xl animate-slideUp my-8 flex flex-col"
        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', maxHeight: 'calc(100vh - 4rem)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0" 
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full" style={{ backgroundColor: 'var(--accent-bg)' }}>
              <FiHelpCircle className="w-6 h-6" style={{ color: 'var(--accent-text)' }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                Guía de Uso - Cotizaciones
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Aprende cómo usar cada función del sistema
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <FiX className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {/* Acciones Disponibles */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Acciones Disponibles
            </h3>
            <div className="space-y-4">
              {actions.map((action, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-lg border"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <action.icon className={`w-5 h-5 ${action.color}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                        {action.title}
                      </h4>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {action.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Estados de Cotización */}
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Estados de Cotización
            </h3>
            <div className="space-y-3">
              {states.map((state, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-lg border"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}
                >
                  <div className="flex items-start gap-3">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${state.color}`}>
                      {state.name}
                    </span>
                    <p className="text-sm flex-1" style={{ color: 'var(--text-secondary)' }}>
                      {state.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Consejos */}
          <div className="mt-8 p-4 rounded-lg" style={{ backgroundColor: 'var(--info-bg)', border: '1px solid var(--info-text)' }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--info-text)' }}>
              💡 Consejos Útiles
            </h3>
            <ul className="text-sm space-y-1" style={{ color: 'var(--info-text)' }}>
              <li>• Las cotizaciones aceptadas no se pueden modificar ni eliminar</li>
              <li>• Las cotizaciones rechazadas no se pueden modificar ni eliminar</li>
              <li>• Usa &quot;Duplicar&quot; para crear nuevas cotizaciones basadas en anteriores</li>
              <li>• Descarga el PDF antes de enviar la cotización al cliente</li>
              <li>• Solo Admin y Dueño pueden eliminar o cancelar cotizaciones</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t flex-shrink-0" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-orange-500 hover:bg-orange-600 text-white"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
