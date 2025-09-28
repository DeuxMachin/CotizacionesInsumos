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
    } else {
      console.log('[LoginPage] Sin usuario autenticado todavía.')
    }
  }, [user, router]);

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)' }}></div>
          <span>Verificando sesión...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Evitar parpadeo mientras redirige
  }

  return <LoginForm />;
}
