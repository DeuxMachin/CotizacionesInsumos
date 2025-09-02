/**
 * Puerto (interface) para el repositorio de cotizaciones
 * Define el contrato que deben cumplir todas las implementaciones de persistencia
 * Siguiendo el principio de Inversión de Dependencias
 */

import { Quote, QuoteStatus } from "../domain/quote/Quote";

// Criterios de filtrado para búsquedas avanzadas
export interface QuoteFilters {
  /** Filtro por estado de cotización */
  status?: QuoteStatus;
  
  /** Filtro por nombre de cliente (búsqueda parcial) */
  clientName?: string;
  
  /** Filtro por rango de fechas */
  dateRange?: {
    from: string;
    to: string;
  };
  
  /** Filtro por rango de montos */
  amountRange?: {
    min: number;
    max: number;
  };
}

// Opciones de paginación para grandes conjuntos de datos
export interface PaginationOptions {
  /** Número de página (empezando en 1) */
  page: number;
  
  /** Cantidad de elementos por página */
  limit: number;
  
  /** Campo por el cual ordenar */
  sortBy?: keyof Quote;
  
  /** Dirección del ordenamiento */
  sortOrder?: "asc" | "desc";
}

// Resultado paginado con metadatos útiles
export interface PaginatedResult<T> {
  /** Elementos de la página actual */
  data: T[];
  
  /** Información de paginación */
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Datos necesarios para crear una nueva cotización
export interface CreateQuoteRequest {
  client: string;
  amount: number;
  /** Fecha opcional, si no se proporciona se usa la actual */
  date?: string;
}

// Datos permitidos para actualizar una cotización existente
export interface UpdateQuoteRequest {
  client?: string;
  amount?: number;
  status?: QuoteStatus;
}

/**
 * Interface principal del repositorio de cotizaciones
 * Abstrae las operaciones de persistencia del dominio de negocio
 */
export interface QuoteRepository {
  /**
   * Obtiene todas las cotizaciones con filtros opcionales
   * @param filters - Criterios de filtrado
   * @param pagination - Opciones de paginación
   * @returns Promise con el resultado paginado
   */
  findAll(
    filters?: QuoteFilters, 
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Quote>>;
  
  /**
   * Busca una cotización por su ID único
   * @param id - Identificador de la cotización
   * @returns Promise con la cotización o null si no existe
   */
  findById(id: string): Promise<Quote | null>;
  
  /**
   * Crea una nueva cotización en el sistema
   * @param data - Datos de la nueva cotización
   * @returns Promise con la cotización creada
   */
  create(data: CreateQuoteRequest): Promise<Quote>;
  
  /**
   * Actualiza una cotización existente
   * @param id - Identificador de la cotización a actualizar
   * @param data - Datos a actualizar
   * @returns Promise con la cotización actualizada o null si no existe
   */
  update(id: string, data: UpdateQuoteRequest): Promise<Quote | null>;
  
  /**
   * Elimina una cotización del sistema
   * @param id - Identificador de la cotización a eliminar
   * @returns Promise con true si se eliminó, false si no existía
   */
  delete(id: string): Promise<boolean>;
  
  /**
   * Obtiene estadísticas rápidas del sistema
   * @returns Promise con métricas de cotizaciones
   */
  getStats(): Promise<{
    total: number;
    byStatus: Record<QuoteStatus, number>;
    totalAmount: number;
    averageAmount: number;
  }>;
}
