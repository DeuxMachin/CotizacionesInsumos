"use client";

import { Sidebar } from "@/features/navigation/ui/Sidebar";
import { Header } from "@/features/navigation/ui/HeaderNew";
import { ToastHost } from "@/shared/ui/Toast";
import { useInactivityTimeout } from "@/features/auth/model/useAuth";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Aplicar el sistema de cierre de sesión por inactividad
  // useInactivityTimeout(); // Comentado temporalmente para debugging

  // Prefetch de rutas frecuentes para evitar latencia del primer click en dev
  // const router = useRouter();
  // useEffect(() => {
  //   const routesToPrefetch = [
  //     "/dashboard",
  //     "/dashboard/obras",
  //     "/dashboard/clientes",
  //     "/dashboard/cotizaciones",
  //     "/dashboard/stock",
  //     "/dashboard/reportes",
  //     "/dashboard/posibles-targets",
  //     "/admin"
  //   ];
    
  //   // Prefetch all main routes on dashboard load
  //   const prefetchRoutes = async () => {
  //     try {
  //       // Prefetch in sequence with slight delay to avoid network contention
  //       for (const route of routesToPrefetch) {
  //         await router.prefetch(route);
  //         // Small delay between prefetches
  //         await new Promise(resolve => setTimeout(resolve, 50));
  //       }
  //     } catch (e) {
  //       console.warn("Error prefetching routes:", e);
  //     }
  //   };
    
  //   prefetchRoutes();
  // }, [router]);

  return (
    <div 
      className="min-h-screen flex"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      {/* Navegación lateral */}
      <Sidebar />
      
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-h-screen ml-0 lg:ml-64">
        {/* Header fijo en la parte superior */}
        <Header />
        
        {/* Contenido scrolleable */}
        <main 
          className="flex-1 overflow-auto"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <div className="p-3 sm:p-4 lg:p-6">
            <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 lg:space-y-6">
              {/* Breadcrumbs */}
              <Breadcrumbs />
              {children}
            </div>
          </div>
        </main>
      </div>
      <ToastHost />
    </div>
  );
}
