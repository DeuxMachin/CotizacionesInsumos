"use client";

import { AuthWrapper } from "@/components/AuthWrapper";
import DashboardContent from "@/features/navigation/ui/DashboardContent";

export default function HomePage() {
  return (
    <AuthWrapper>
      <DashboardContent />
    </AuthWrapper>
  );
}
