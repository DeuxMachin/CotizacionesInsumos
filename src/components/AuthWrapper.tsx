"use client";

import { useAuth } from "../features/auth/model/useAuth";
import { LoginForm } from "../features/auth/ui/LoginForm";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return <>{children}</>;
}
