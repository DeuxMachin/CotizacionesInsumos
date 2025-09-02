"use client";

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NewQuotePage } from '@/features/quotes/ui/NewQuotePage';

export default function Page() {
  return (
    <ProtectedRoute resource="quotes" action="create">
      <NewQuotePage />
    </ProtectedRoute>
  );
}
