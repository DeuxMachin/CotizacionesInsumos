"use client";

import DashboardContent from "@/features/navigation/ui/DashboardContent";
import { useAuth } from "@/features/auth/model/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null; // Return nothing while redirecting
  }

  return <DashboardContent />;
}
