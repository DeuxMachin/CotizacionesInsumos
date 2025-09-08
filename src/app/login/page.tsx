"use client";

import { LoginForm } from "@/features/auth/ui/LoginForm";
import { useAuth } from "@/features/auth/model/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Solo redirigir si está realmente autenticado y tenemos los datos del usuario
    if (isAuthenticated && user && !isLoading) {
      const redirectPath = user.rol === 'admin' ? '/admin' : '/dashboard';
      router.replace(redirectPath);
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Mostrar loading mientras se verifica el estado de autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)' }}></div>
          <span>Verificando sesión...</span>
        </div>
      </div>
    );
  }

  return <LoginForm />;
}
