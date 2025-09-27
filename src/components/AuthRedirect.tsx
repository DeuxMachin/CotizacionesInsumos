"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AuthRedirectProps {
  children: React.ReactNode;
  requireAuth?: boolean; // Si es true, redirige a login si no está autenticado
  authRedirectTo?: string; // Donde redirigir si está autenticado
  nonAuthRedirectTo?: string; // Donde redirigir si no está autenticado
}

export function AuthRedirect({ 
  children, 
  requireAuth = true,
  authRedirectTo,
  nonAuthRedirectTo = '/login'
}: AuthRedirectProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (requireAuth && !isAuthenticated) {
      // Si requiere autenticación y no está autenticado, redirigir a página de login
      console.log("No autenticado, redirigiendo a", nonAuthRedirectTo);
      router.push(nonAuthRedirectTo);
    } else if (!requireAuth && isAuthenticated && authRedirectTo) {
      // Si no requiere autenticación y está autenticado, redirigir según el rol
  const redirectPath = authRedirectTo || ((['admin', 'dueño', 'dueno'].includes(user?.role?.toLowerCase() || '')) ? '/admin' : '/dashboard');
      console.log("Ya autenticado, redirigiendo a", redirectPath);
      router.push(redirectPath);
    }
  }, [isAuthenticated, requireAuth, router, authRedirectTo, nonAuthRedirectTo, user?.role]);

  // Solo mostrar el contenido si cumple con los requisitos de autenticación
  if (requireAuth && !isAuthenticated) {
    return null; // No mostrar nada durante la redirección
  }
  
  if (!requireAuth && isAuthenticated && authRedirectTo) {
    return null; // No mostrar nada durante la redirección
  }

  return <>{children}</>;
}
