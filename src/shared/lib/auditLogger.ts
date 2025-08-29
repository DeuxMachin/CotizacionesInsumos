"use client";

export type AuditEventType = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'EXPORT'
  | 'UNAUTHORIZED_ACCESS'
  | 'PERMISSION_DENIED';

export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  userRole: string;
  eventType: AuditEventType;
  resource: string;
  action: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

class AuditLogger {
  private events: AuditEvent[] = [];
  private maxEvents = 1000; // Límite de eventos en memoria

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getClientInfo() {
    return {
      ipAddress: 'localhost', // En producción sería la IP real
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    };
  }

  log(event: Omit<AuditEvent, 'id' | 'timestamp' | 'ipAddress' | 'userAgent'>): void {
    const auditEvent: AuditEvent = {
      ...event,
      id: this.generateId(),
      timestamp: new Date(),
      ...this.getClientInfo(),
    };

    this.events.unshift(auditEvent);
    
    // Mantener solo los últimos maxEvents
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }

    // En desarrollo, log a console
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Audit Log:', {
        timestamp: auditEvent.timestamp.toISOString(),
        user: `${auditEvent.userEmail} (${auditEvent.userRole})`,
        action: `${auditEvent.eventType}: ${auditEvent.action} on ${auditEvent.resource}`,
        details: auditEvent.details,
      });
    }

    // En producción, aquí enviarías a un servicio de logging
    // this.sendToLoggingService(auditEvent);
  }

  getEvents(filters?: {
    userId?: string;
    eventType?: AuditEventType;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
  }): AuditEvent[] {
    let filteredEvents = [...this.events];

    if (filters) {
      if (filters.userId) {
        filteredEvents = filteredEvents.filter(e => e.userId === filters.userId);
      }
      if (filters.eventType) {
        filteredEvents = filteredEvents.filter(e => e.eventType === filters.eventType);
      }
      if (filters.resource) {
        filteredEvents = filteredEvents.filter(e => e.resource === filters.resource);
      }
      if (filters.startDate) {
        filteredEvents = filteredEvents.filter(e => e.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filteredEvents = filteredEvents.filter(e => e.timestamp <= filters.endDate!);
      }
    }

    return filteredEvents;
  }

  getEventsByUser(userId: string): AuditEvent[] {
    return this.getEvents({ userId });
  }

  getRecentEvents(count: number = 10): AuditEvent[] {
    return this.events.slice(0, count);
  }

  clearEvents(): void {
    this.events = [];
  }

  exportEvents(): string {
    return JSON.stringify(this.events, null, 2);
  }

  // Métodos de conveniencia para eventos comunes
  logLogin(userId: string, userEmail: string, userRole: string): void {
    this.log({
      userId,
      userEmail,
      userRole,
      eventType: 'LOGIN',
      resource: 'auth',
      action: 'user_login',
    });
  }

  logLogout(userId: string, userEmail: string, userRole: string): void {
    this.log({
      userId,
      userEmail,
      userRole,
      eventType: 'LOGOUT',
      resource: 'auth',
      action: 'user_logout',
    });
  }

  logUnauthorizedAccess(
    userId: string,
    userEmail: string,
    userRole: string,
    resource: string,
    action: string
  ): void {
    this.log({
      userId,
      userEmail,
      userRole,
      eventType: 'UNAUTHORIZED_ACCESS',
      resource,
      action,
      details: {
        attempted_resource: resource,
        attempted_action: action,
        user_permissions: 'insufficient',
      },
    });
  }

  logResourceAccess(
    userId: string,
    userEmail: string,
    userRole: string,
    resource: string,
    action: string,
  details?: Record<string, unknown>
  ): void {
    const eventType = this.getEventTypeFromAction(action);
    this.log({
      userId,
      userEmail,
      userRole,
      eventType,
      resource,
      action,
      details,
    });
  }

  private getEventTypeFromAction(action: string): AuditEventType {
    if (action.includes('create')) return 'CREATE';
    if (action.includes('update') || action.includes('edit')) return 'UPDATE';
    if (action.includes('delete') || action.includes('remove')) return 'DELETE';
    if (action.includes('export')) return 'EXPORT';
    if (action.includes('view') || action.includes('read')) return 'VIEW';
    return 'VIEW';
  }
}

// Instancia singleton del logger
export const auditLogger = new AuditLogger();

// Hook para usar el audit logger en componentes React
export function useAuditLogger() {
  return {
    log: auditLogger.log.bind(auditLogger),
    logLogin: auditLogger.logLogin.bind(auditLogger),
    logLogout: auditLogger.logLogout.bind(auditLogger),
    logUnauthorizedAccess: auditLogger.logUnauthorizedAccess.bind(auditLogger),
    logResourceAccess: auditLogger.logResourceAccess.bind(auditLogger),
    getEvents: auditLogger.getEvents.bind(auditLogger),
    getRecentEvents: auditLogger.getRecentEvents.bind(auditLogger),
  };
}
