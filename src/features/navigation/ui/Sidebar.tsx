"use client";

import { useSection } from "../model/useSection";
import { FiHome, FiFileText, FiUsers, FiBox, FiBarChart2, FiX } from "react-icons/fi";

// Elementos de navegación con iconos más profesionales y descriptivos
const navigationItems = [
  { key: "dashboard", icon: <FiHome className="w-5 h-5" />, label: "Dashboard" },
  { key: "cotizaciones", icon: <FiFileText className="w-5 h-5" />, label: "Cotizaciones" },
  { key: "clientes", icon: <FiUsers className="w-5 h-5" />, label: "Clientes" },
  { key: "catalogo", icon: <FiBox className="w-5 h-5" />, label: "Catálogo" },
  { key: "reportes", icon: <FiBarChart2 className="w-5 h-5" />, label: "Reportes" },
] as const;

export function Sidebar() {
  const { section, setSection, sidebarOpen, setSidebarOpen } = useSection();

  return (
    <>
      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/30 lg:hidden backdrop-blur-sm animate-fadeIn" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar principal */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white flex flex-col
        border-r border-gray-100
        overflow-y-auto
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Header del sidebar - alineado con header principal */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 text-white font-bold text-sm">
              PA
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-900 text-sm">Panel Admin</span>
              <span className="text-xs text-gray-500">Sistema v1.0</span>
            </div>
          </div>
          
          {/* Botón cerrar en móvil */}
          <button 
            className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
        
        {/* Navegación principal - ocupa el espacio disponible */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = section === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => { 
                    setSection(item.key as any); 
                    setSidebarOpen(false); 
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200
                    ${isActive
                      ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600 pl-2'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                    }
                  `}
                >
                  <div className={`${isActive ? 'text-purple-600' : ''}`}>
                    {item.icon}
                  </div>
                  <span className="flex-1 text-left">{item.label}</span>
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer del sidebar - fijo en la parte inferior */}
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <div className="text-center">
            <p className="text-xs text-gray-400 font-medium">Sistema de Gestión v1.0</p>
          </div>
        </div>
      </aside>
    </>
  );
}
