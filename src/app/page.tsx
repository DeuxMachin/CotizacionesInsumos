"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Esperar a que el componente esté montado en el cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || loading) return;

    // Redirigir directamente al login si no está autenticado
    // o al dashboard si ya está autenticado
    if (!isAuthenticated) {
      router.replace("/login");
    } else {
      // Redirigir según el rol del usuario
      const redirectPath = (['admin', 'dueño', 'dueno'].includes(user?.role?.toLowerCase() || '')) ? '/admin' : '/dashboard';
      router.replace(redirectPath);
    }
  }, [isAuthenticated, router, user, loading, mounted]);

  // Página de carga mientras se redirecciona
  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-primary">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 mx-auto border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
        <p className="text-theme-secondary">Redirigiendo...</p>
      </div>
    </div>
  );
}
