"use client";

import { useAuth } from "@/features/auth/model/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirigir directamente al login si no está autenticado
    // o al dashboard si ya está autenticado
    if (!isAuthenticated) {
      router.replace("/login");
    } else {
      // Redirigir según el rol del usuario
      const redirectPath = user?.rol === 'admin' ? '/admin' : '/dashboard';
      router.replace(redirectPath);
    }
  }, [isAuthenticated, router, user]);

  // Página de carga mientras se redirecciona
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 mx-auto border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
        <p className="text-theme-secondary">Redirigiendo...</p>
      </div>
    </div>
  );
}
