/**
 * Entidades de dominio para el módulo de Cotizaciones
 * Representa los conceptos fundamentales del negocio sin dependencias externas
 */

// Estados válidos que puede tener una cotización en el sistema
export type QuoteStatus = "borrador" | "enviada" | "aceptada" | "rechazada" | "expirada";

// Información del cliente de la cotización
export interface ClientInfo {
  razonSocial: string;
  rut: string;
  nombreFantasia?: string;
  giro: string;
  direccion: string;
  ciudad: string;
  comuna: string;
  telefono?: string;
  email?: string;
  nombreContacto?: string;
  telefonoContacto?: string;
}

// Información de despacho
export interface DeliveryInfo {
  direccion: string;
  ciudad: string;
  comuna: string;
  fechaEstimada?: string;
  costoDespacho?: number;
  observaciones?: string;
}

// Item de la cotización
export interface QuoteItem {
  id: string;
  productId?: number; // ID real en la BD si corresponde
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
  subtotal: number;
}

// Condiciones comerciales
export interface CommercialTerms {
  validezOferta: number; // días
  formaPago: string;
  tiempoEntrega: string;
  garantia?: string;
  observaciones?: string;
}

// Entidad principal de Cotización con sus propiedades esenciales
export interface Quote {
  /** Identificador único de la cotización (ej: COT-2024-001) */
  id: string;
  
  /** Número correlativo de la cotización */
  numero: string;
  
  /** Información del cliente */
  cliente: ClientInfo;
  
  /** Fecha de creación */
  fechaCreacion: string;
  
  /** Fecha de última modificación */
  fechaModificacion: string;
  
  /** Estado actual de la cotización */
  estado: QuoteStatus;
  
  /** ID del vendedor que creó la cotización */
  vendedorId: string;
  
  /** Nombre del vendedor */
  vendedorNombre: string;
  
  /** Items de la cotización */
  items: QuoteItem[];
  
  /** Información de despacho */
  despacho?: DeliveryInfo;
  
  /** Condiciones comerciales */
  condicionesComerciales: CommercialTerms;
  
  /** Subtotal sin impuestos */
  subtotal: number;
  
  /** Descuento total */
  descuentoTotal: number;
  /** Descuento acumulado de líneas (suma de descuentos por ítem) */
  descuentoLineasMonto?: number;
  /** Descuento global aplicado adicionalmente */
  descuentoGlobalMonto?: number;
  
  /** IVA */
  iva: number;
  
  /** Total con impuestos */
  total: number;
  
  /** Notas adicionales */
  notas?: string;
  
  /** Fecha de expiración de la oferta */
  fechaExpiracion?: string;
}

// Value Objects - Objetos de valor para validaciones y transformaciones

/**
 * Validador de estado de cotización
 * Asegura que solo se usen estados válidos en el dominio
 */
export class QuoteStatusValidator {
  private static readonly VALID_STATUSES: QuoteStatus[] = ["borrador", "enviada", "aceptada", "rechazada", "expirada"];
  
  static isValid(status: string): status is QuoteStatus {
    return this.VALID_STATUSES.includes(status as QuoteStatus);
  }
  
  static getDisplayName(status: QuoteStatus): string {
    const names = {
      borrador: "Borrador",
      enviada: "Enviada",
      aceptada: "Aceptada", 
      rechazada: "Rechazada",
      expirada: "Expirada"
    };
    return names[status];
  }
  
  static getStatusColor(status: QuoteStatus) {
    const colors = {
      borrador: { bg: 'var(--warning-bg)', text: 'var(--warning-text)' },
      enviada: { bg: 'var(--info-bg)', text: 'var(--info-text)' },
      aceptada: { bg: 'var(--success-bg)', text: 'var(--success-text)' },
      rechazada: { bg: 'var(--danger-bg)', text: 'var(--danger-text)' },
      expirada: { bg: 'var(--neutral-bg)', text: 'var(--neutral-text)' }
    };
    return colors[status];
  }
}

/**
 * Generador de IDs de cotización
 * Maneja la lógica de negocio para crear identificadores únicos
 */
export class QuoteIdGenerator {
  static generate(sequential?: number): string {
    const year = new Date().getFullYear();
    const num = sequential || Math.floor(Math.random() * 999) + 1;
    return `COT-${year}-${num.toString().padStart(3, '0')}`;
  }
  
  static isValidFormat(id: string): boolean {
    return /^COT-\d{4}-\d{3}$/.test(id);
  }
}

/**
 * Calculadora de montos para cotizaciones
 * Centraliza la lógica de cálculos monetarios
 */
export class QuoteAmountCalculator {
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
  
  static calculateItemSubtotal(cantidad: number, precioUnitario: number, descuento: number = 0): number {
    const subtotal = cantidad * precioUnitario;
    const descuentoAmount = (subtotal * descuento) / 100;
    return Math.round((subtotal - descuentoAmount));
  }
  
  static calculateQuoteTotals(items: QuoteItem[], costoDespacho: number = 0) {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const descuentoTotal = items.reduce((sum, item) => {
      const itemTotal = item.cantidad * item.precioUnitario;
      const descuentoItem = item.descuento ? (itemTotal * item.descuento) / 100 : 0;
      return sum + descuentoItem;
    }, 0);
    
    const baseImponible = subtotal + costoDespacho;
    const iva = Math.round(baseImponible * 0.19);
    const total = baseImponible + iva;
    
    return {
      subtotal,
      descuentoTotal: Math.round(descuentoTotal),
      iva,
      total,
      baseImponible
    };
  }
}

/**
 * Filtros para cotizaciones
 */
export interface QuoteFilters {
  busqueda?: string;
  estado?: QuoteStatus[];
  vendedor?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  cliente?: string;
}

/**
 * Configuración de paginación para cotizaciones
 */
export interface QuotePaginationConfig {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}
