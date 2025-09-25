"use client";

import { Sidebar } from "@/features/navigation/ui/Sidebar";
import { Header } from "@/features/navigation/ui/HeaderNew";
import { ToastHost } from "@/shared/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";

// Loading fallback para mostrar mientras se resuelve la autenticación
function AdminLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 mx-auto border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
        <p className="text-theme-secondary">Verificando permisos...</p>
      </div>
    </div>
  );
}

// Fallback para usuarios no autorizados
function AdminUnauthorizedFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div 
        className="max-w-md w-full mx-4 p-8 text-center rounded-xl"
        style={{ 
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)' 
        }}
      >
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-3">
          Acceso de Administrador Requerido
        </h3>
        <p className="text-theme-secondary mb-6">
          Esta sección está reservada exclusivamente para administradores del sistema.
        </p>
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="btn-primary w-full"
        >
          Volver al Dashboard
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return <AdminLoadingFallback />;
  }

  return (
    <ProtectedRoute 
      resource="admin" 
      action="read"
      requireAdmin={true}
      fallback={<AdminUnauthorizedFallback />}
    >
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
    </ProtectedRoute>
  );
}
