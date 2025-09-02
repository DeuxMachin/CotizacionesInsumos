"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiChevronRight, FiHome } from "react-icons/fi";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  admin: "Administración",
  cotizaciones: "Cotizaciones",
  clientes: "Clientes",
  obras: "Obras",
  stock: "Stock",
  reportes: "Reportes",
  "posibles-targets": "Posibles Targets",
  usuarios: "Usuarios",
  auditoria: "Auditoría",
  configuracion: "Configuración",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  // Eliminar cualquier slash inicial y dividir la ruta en segmentos
  const segments = pathname.replace(/^\/+/, "").split("/");
  
  // Si no hay segmentos o solo está el primer nivel, no mostramos breadcrumbs
  if (segments.length <= 1) {
    return null;
  }

  // Si el primer segmento es "dashboard", lo tratamos como home
  const isFirstDashboard = segments[0] === "dashboard";

  return (
    <nav aria-label="Breadcrumb" className="flex items-center mb-4 text-sm">
      <ol className="flex items-center flex-wrap">
        <li className="flex items-center">
          <Link 
            href={isFirstDashboard ? "/dashboard" : "/"}
            className="text-theme-secondary hover:text-theme-primary flex items-center"
          >
            <FiHome className="w-4 h-4 mr-1" />
            <span className="sr-only sm:not-sr-only">
              {isFirstDashboard ? "Dashboard" : "Inicio"}
            </span>
          </Link>
        </li>
        
        {segments.map((segment, index) => {
          // Saltamos el primer segmento si es "dashboard"
          if (index === 0 && isFirstDashboard) {
            return null;
          }
          
          // Construir la URL para este segmento
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const isLast = index === segments.length - 1;
          const label = routeLabels[segment] || segment;
          
          return (
            <li key={href} className="flex items-center">
              <FiChevronRight className="mx-2 text-theme-muted" />
              {isLast ? (
                <span className="font-medium text-theme-primary" aria-current="page">
                  {label}
                </span>
              ) : (
                <Link
                  href={href}
                  className="text-theme-secondary hover:text-theme-primary"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
