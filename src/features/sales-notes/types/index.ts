// Re-export types from service for convenience
export type {
  SalesNoteRecord,
  SalesNoteItemRow,
  SalesNoteInput,
  SalesNoteItemInput
} from '@/services/notasVentaService';

// Additional UI-specific types
export interface SalesNoteListFilters {
  searchTerm: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface SalesNoteStats {
  total: number;
  confirmed: number;
  draft: number;
  cancelled: number;
  totalAmount: number;
  averageAmount: number;
}