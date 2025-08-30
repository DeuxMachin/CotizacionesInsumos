"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import DashboardContent from "@/features/navigation/ui/DashboardContent";
import { useAuth } from "@/features/auth/model/useAuth";

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
          onClick={() => window.location.href = '/'}
          className="btn-primary w-full"
        >
          Volver al Dashboard
        </button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { isAuthenticated } = useAuth();

  // Mostrar loading mientras se resuelve la autenticación
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
      <DashboardContent />
    </ProtectedRoute>
  );
}
