"use client";

import { Sidebar } from "@/features/navigation/ui/Sidebar";
import { Header } from "@/features/navigation/ui/HeaderNew";
import { ToastHost } from "@/shared/ui/Toast";
import { useAuth, useInactivityTimeout } from "@/features/auth/model/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Aplicar el sistema de cierre de sesión por inactividad
  useInactivityTimeout();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null; // Return nothing while redirecting
  }

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
