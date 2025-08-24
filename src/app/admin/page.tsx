"use client";

import { useEffect } from "react";
import { useAuth } from "@/features/auth/model/useAuth";
import { useRouter } from "next/navigation";
import { AuthWrapper } from "@/components/AuthWrapper";
import DashboardContent from "@/features/navigation/ui/DashboardContent";

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user && user.role !== "admin") {
      router.replace("/");
    }
  }, [isAuthenticated, user, router]);

  return (
    <AuthWrapper>
      <DashboardContent />
    </AuthWrapper>
  );
}
