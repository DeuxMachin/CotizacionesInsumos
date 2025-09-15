"use client";

import { LoginForm } from "@/features/auth/ui/LoginForm";
import { useAuth } from "@/features/auth/model/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Marcar como inicializado después de un breve momento
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Solo redirigir si está realmente autenticado, tenemos los datos del usuario, y está inicializado
    if (isAuthenticated && user && isInitialized && !isLoading) {
      console.log('🔄 Redirigiendo usuario autenticado:', user.rol);
      const redirectPath = user.rol === 'admin' ? '/admin' : '/dashboard';
      router.replace(redirectPath);
    }
  }, [isAuthenticated, user, isInitialized, isLoading, router]);

  // Mostrar loading inicial muy breve
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)' }}></div>
          <span>Cargando...</span>
        </div>
      </div>
    );
  }

  return <LoginForm />;
}
