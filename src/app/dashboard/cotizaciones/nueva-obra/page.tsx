"use client";

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NewQuoteFromObraPage } from '../../../../features/quotes/ui/NewQuoteFromObraPage';

export default function Page() {
  return (
    <ProtectedRoute resource="quotes" action="create">
      <NewQuoteFromObraPage />
    </ProtectedRoute>
  );
}
