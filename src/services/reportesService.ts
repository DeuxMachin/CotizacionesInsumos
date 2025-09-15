import { ReportPeriod } from '@/app/dashboard/reportes/page';

export interface FinancialKPI {
  value: number;
  trend: number;
  previous?: number;
  transacciones?: number;
  cotizaciones?: number;
  meta?: number;
}

export interface ReportData {
  kpis: {
    totalVentas: FinancialKPI;
    exento: FinancialKPI;
    neto: FinancialKPI;
    iva: FinancialKPI;
    ticketPromedio: FinancialKPI;
    tasaConversion: FinancialKPI;
    crecimientoMensual: FinancialKPI;
    retencionClientes: FinancialKPI;
  };
  ventasMensuales: Array<{
    day: number;
    sales: number;
    label: string;
  }>;
  topProductos: Array<{
    id: number;
    nombre: string;
    cantidad: number;
    ingresos: number;
  }>;
  clientesPorEstado: Record<string, number>;
  estadisticas: {
    totalCotizaciones: number;
    cotizacionesAceptadas: number;
    totalClientes: number;
    totalProductos: number;
    period: string;
    startDate: string;
    endDate: string;
  };
}

export const reportesService = {
  async getReportData(period: ReportPeriod): Promise<ReportData> {
    try {
      const searchParams = new URLSearchParams({
        period: period
      });

      const response = await fetch(`/api/reportes?${searchParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener datos de reportes:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Error desconocido al obtener datos de reportes'
      );
    }
  },

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
  },

  formatNumber(value: number): string {
    return new Intl.NumberFormat('es-CL').format(value);
  }
};
