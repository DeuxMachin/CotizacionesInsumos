/**
 * Re-exportación de tipos de dominio para mantener compatibilidad
 * Gradualmente migraremos a usar directamente desde core/domain
 */

export type { 
  Quote, 
  QuoteStatus
} from "@/core/domain/quote/Quote";

export { 
  QuoteStatusValidator,
  QuoteIdGenerator,
  QuoteAmountCalculator 
} from "@/core/domain/quote/Quote";
