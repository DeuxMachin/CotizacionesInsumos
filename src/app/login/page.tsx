"use client";

import { LoginForm } from "@/features/auth/ui/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      console.log('[LoginPage] Detectado usuario autenticado, redirigiendo...', user.email)
      const redirectPath = (['admin', 'dueño', 'dueno'].includes(user.role?.toLowerCase() || '')) ? '/admin' : '/dashboard';
      router.replace(redirectPath);
      // Fallback duro por si el enrutador no navega 
      const t = setTimeout(() => {
        if (window.location.pathname === '/login') {
          window.location.assign(redirectPath);
        }
      }, 600);
      return () => clearTimeout(t);
    } else {
      console.log('[LoginPage] Sin usuario autenticado todavía.')
    }
  }, [user, router]);

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-primary">
        <div className="flex items-center gap-3 text-theme-primary">
          <div className="w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
          <span>Verificando sesión...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    // Mostrar spinner mientras se ejecuta la redirección para evitar pantalla en blanco
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-primary">
        <div className="flex items-center gap-3 text-theme-primary">
          <div className="w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
          <span>Redirigiendo…</span>
        </div>
      </div>
    );
  }

  return <LoginForm />;
}
