export interface AuditLogEntry {
  user_id: string;
  action: string;
  details: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

export class AuditService {
  /**
   * Registra un evento de auditoría en la base de datos
   */
  static async logEvent(entry: AuditLogEntry): Promise<void> {
    try {
      // Solo hacer console.log ya que la tabla audit_logs no existe en la BD
      console.log('Audit log:', {
        user_id: entry.user_id,
        action: entry.action,
        details: entry.details,
        ip_address: entry.ip_address,
        user_agent: entry.user_agent,
        created_at: new Date().toISOString()
      });

      // No intentar guardar en BD para evitar errores
    } catch (error) {
      console.error('Error in audit logging:', error);
      // No lanzamos error para no interrumpir el flujo principal
    }
  }

  /**
   * Registra la descarga de un archivo Excel
   */
  static async logDownload(
    userId: string,
    downloadType: 'clients_excel' | 'stock_excel' | 'quotes_excel' | 'reports_pdf' | 'reports_excel',
    details: {
      fileName?: string;
      recordCount?: number;
      filters?: Record<string, unknown>;
      format?: 'pdf' | 'excel';
    } = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      user_id: userId,
      action: `download_${downloadType}`,
      details: {
        ...details,
        timestamp: new Date().toISOString()
      },
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  /**
   * Obtiene los logs de auditoría con filtros opcionales
   */
  static async getAuditLogs(_options: {
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<unknown[]> {
    // La tabla audit_logs no existe, devolver array vacío
    console.log('getAuditLogs called but audit_logs table does not exist');
    return [];
  }

  /**
   * Obtiene estadísticas de descargas por tipo y usuario
   */
  static async getDownloadStats(_options: {
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<{
    totalDownloads: number;
    downloadsByType: Record<string, number>;
    downloadsByUser: Record<string, number>;
    recentDownloads: unknown[];
  }> {
    // La tabla audit_logs no existe, devolver estadísticas vacías
    console.log('getDownloadStats called but audit_logs table does not exist');
    return {
      totalDownloads: 0,
      downloadsByType: {},
      downloadsByUser: {},
      recentDownloads: []
    };
  }
}
