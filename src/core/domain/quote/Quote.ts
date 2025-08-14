/**
 * Entidades de dominio para el módulo de Cotizaciones
 * Representa los conceptos fundamentales del negocio sin dependencias externas
 */

// Estados válidos que puede tener una cotización en el sistema
export type QuoteStatus = "pending" | "approved" | "rejected";

// Entidad principal de Cotización con sus propiedades esenciales
export interface Quote {
  /** Identificador único de la cotización (ej: COT-001) */
  id: string;
  
  /** Nombre del cliente asociado a la cotización */
  client: string;
  
  /** Fecha de creación en formato ISO (YYYY-MM-DD) */
  date: string;
  
  /** Estado actual de la cotización */
  status: QuoteStatus;
  
  /** Monto total de la cotización en la moneda del sistema */
  amount: number;
}

// Value Objects - Objetos de valor para validaciones y transformaciones

/**
 * Validador de estado de cotización
 * Asegura que solo se usen estados válidos en el dominio
 */
export class QuoteStatusValidator {
  private static readonly VALID_STATUSES: QuoteStatus[] = ["pending", "approved", "rejected"];
  
  static isValid(status: string): status is QuoteStatus {
    return this.VALID_STATUSES.includes(status as QuoteStatus);
  }
  
  static getDisplayName(status: QuoteStatus): string {
    const names = {
      pending: "Pendiente",
      approved: "Aprobada", 
      rejected: "Rechazada"
    };
    return names[status];
  }
}

/**
 * Generador de IDs de cotización
 * Maneja la lógica de negocio para crear identificadores únicos
 */
export class QuoteIdGenerator {
  static generate(sequential?: number): string {
    const num = sequential || Math.floor(Math.random() * 999) + 1;
    return `COT-${num.toString().padStart(3, '0')}`;
  }
  
  static isValidFormat(id: string): boolean {
    return /^COT-\d{3}$/.test(id);
  }
}

/**
 * Calculadora de montos
 * Centraliza la lógica de cálculos monetarios
 */
export class QuoteAmountCalculator {
  static formatCurrency(amount: number, locale: string = 'es-ES'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }
  
  static calculateTax(amount: number, taxRate: number = 0.21): number {
    return Math.round((amount * taxRate) * 100) / 100;
  }
  
  static calculateTotal(amount: number, taxRate?: number): number {
    const tax = taxRate ? this.calculateTax(amount, taxRate) : 0;
    return amount + tax;
  }
}
