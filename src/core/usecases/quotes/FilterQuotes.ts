/**
 * Caso de uso: Filtrar Cotizaciones
 * Maneja la lógica de negocio para buscar y filtrar cotizaciones
 * según diferentes criterios definidos por el usuario
 */

import { Quote, QuoteStatusValidator } from "../../domain/quote/Quote";
import { 
  QuoteRepository, 
  QuoteFilters, 
  PaginationOptions, 
  PaginatedResult 
} from "../../ports/QuoteRepository";

// Resultado de una operación de filtrado con información adicional
export interface FilterQuotesResult {
  /** Cotizaciones que cumplen los criterios */
  quotes: PaginatedResult<Quote>;
  
  /** Filtros aplicados para referencia del usuario */
  appliedFilters: QuoteFilters;
  
  /** Metadatos de la operación */
  metadata: {
    executionTime: number;
    totalFiltered: number;
  };
}

/**
 * Implementación del caso de uso FilterQuotes
 * Coordina la validación de filtros y la consulta al repositorio
 */
export class FilterQuotesUseCase {
  constructor(private quoteRepository: QuoteRepository) {}

  /**
   * Ejecuta el filtrado de cotizaciones con validaciones de negocio
   * @param filters - Filtros a aplicar
   * @param pagination - Opciones de paginación
   * @returns Promise con el resultado del filtrado
   */
  async execute(
    filters: QuoteFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<FilterQuotesResult> {
    const startTime = Date.now();

    // Validación de filtros de negocio
    const validatedFilters = this.validateFilters(filters);
    
    // Validación de opciones de paginación
    const validatedPagination = this.validatePagination(pagination);

    try {
      // Ejecutar consulta en el repositorio
      const result = await this.quoteRepository.findAll(
        validatedFilters,
        validatedPagination
      );

      const executionTime = Date.now() - startTime;

      return {
        quotes: result,
        appliedFilters: validatedFilters,
        metadata: {
          executionTime,
          totalFiltered: result.pagination.totalItems
        }
      };

    } catch (error) {
      throw new Error(`Error al filtrar cotizaciones: ${error}`);
    }
  }

  /**
   * Valida y normaliza los filtros según las reglas de negocio
   */
  private validateFilters(filters: QuoteFilters): QuoteFilters {
    const validated: QuoteFilters = {};

    // Validar estado si está presente
    if (filters.status) {
      if (!QuoteStatusValidator.isValid(filters.status)) {
        throw new Error(`Estado de cotización inválido: ${filters.status}`);
      }
      validated.status = filters.status;
    }

    // Validar y normalizar nombre de cliente
    if (filters.clientName) {
      const normalizedName = filters.clientName.trim();
      if (normalizedName.length < 2) {
        throw new Error("El nombre del cliente debe tener al menos 2 caracteres");
      }
      validated.clientName = normalizedName;
    }

    // Validar rango de fechas
    if (filters.dateRange) {
      const { from, to } = filters.dateRange;
      const fromDate = new Date(from);
      const toDate = new Date(to);
      
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        throw new Error("Formato de fecha inválido en el rango");
      }
      
      if (fromDate > toDate) {
        throw new Error("La fecha 'desde' no puede ser posterior a la fecha 'hasta'");
      }
      
      validated.dateRange = { from, to };
    }

    // Validar rango de montos
    if (filters.amountRange) {
      const { min, max } = filters.amountRange;
      
      if (min < 0 || max < 0) {
        throw new Error("Los montos no pueden ser negativos");
      }
      
      if (min > max) {
        throw new Error("El monto mínimo no puede ser mayor al máximo");
      }
      
      validated.amountRange = { min, max };
    }

    return validated;
  }

  /**
   * Valida las opciones de paginación
   */
  private validatePagination(pagination: PaginationOptions): PaginationOptions {
    const validated = { ...pagination };

    // Validar página
    if (validated.page < 1) {
      validated.page = 1;
    }

    // Validar límite
    if (validated.limit < 1) {
      validated.limit = 10;
    } else if (validated.limit > 100) {
      // Límite máximo para evitar sobrecarga
      validated.limit = 100;
    }

    // Validar campo de ordenamiento si está presente
    if (validated.sortBy) {
      const validSortFields: (keyof Quote)[] = ['id', 'cliente', 'fechaCreacion', 'estado', 'total'];
      if (!validSortFields.includes(validated.sortBy)) {
        throw new Error(`Campo de ordenamiento inválido: ${validated.sortBy}`);
      }
    }

    // Validar dirección de ordenamiento
    if (validated.sortOrder && !['asc', 'desc'].includes(validated.sortOrder)) {
      throw new Error(`Dirección de ordenamiento inválida: ${validated.sortOrder}`);
    }

    return validated;
  }
}
