"use client";

import { LoginForm } from "@/features/auth/ui/LoginForm";
import { useAuth } from "@/features/auth/model/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si ya está autenticado, redirigir según el rol
    if (isAuthenticated) {
      const user = useAuth.getState().user;
      const redirectPath = user?.role === 'admin' ? '/admin' : '/dashboard';
      router.replace(redirectPath);
    }
  }, [isAuthenticated, router]);

  return <LoginForm />;
}
