"use client";

import { useAuthInitialization } from "@/features/auth/model/useAuth";

/**
 * Componente para inicializar la autenticación en el layout principal
 */
export function AuthInitializer() {
  useAuthInitialization();
  return null; // No renderiza nada
}
