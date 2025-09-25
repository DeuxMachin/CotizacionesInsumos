"use client";

import { Sidebar } from "@/features/navigation/ui/Sidebar";
import { Header } from "@/features/navigation/ui/HeaderNew";
import { ToastHost } from "@/shared/ui/Toast";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log('[DashboardLayout] Usuario no autenticado, redirigiendo a /login')
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Verificando sesión...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
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
