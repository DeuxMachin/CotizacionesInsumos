// Servicio de logging de seguridad para cumplimiento ISO 27001
export class SecurityLogger {
  private static readonly LOG_KEY = 'security_logs';
  private static readonly MAX_LOGS = 500;

  static logEvent(event: SecurityEvent, details: SecurityEventDetails) {
    try {
      const logEntry: SecurityLogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        event,
        details,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server-side',
        ip: 'client-side', // En producción, obtener del servidor
        sessionId: this.getCurrentSessionId()
      };

      const logs = this.getLogs();
      logs.push(logEntry);

      // Mantener solo los logs más recientes
      if (logs.length > this.MAX_LOGS) {
        logs.splice(0, logs.length - this.MAX_LOGS);
      }

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.LOG_KEY, JSON.stringify(logs));
      }

      // En producción, enviar a servidor de logging
      console.log(`🔐 Security Event: ${event}`, logEntry);

    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  static getLogs(): SecurityLogEntry[] {
    try {
      if (typeof localStorage === 'undefined') return [];
      const stored = localStorage.getItem(this.LOG_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static getLogsByEvent(event: SecurityEvent): SecurityLogEntry[] {
    return this.getLogs().filter(log => log.event === event);
  }

  static getRecentLogs(hours: number = 24): SecurityLogEntry[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.getLogs().filter(log => new Date(log.timestamp) > cutoff);
  }

  static clearLogs() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.LOG_KEY);
    }
  }

  private static getCurrentSessionId(): string | undefined {
    try {
      if (typeof document === 'undefined') return undefined;
      const cookies = document.cookie.split(';');
      const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth-storage='));
      if (!authCookie) return undefined;

      const cookieValue = authCookie.split('=')[1];
      const decoded = decodeURIComponent(cookieValue);
      const parsed = JSON.parse(decoded);
      return parsed.sessionId || parsed.state?.sessionId;
    } catch {
      return undefined;
    }
  }

  // Métodos específicos para diferentes tipos de eventos
  static logLoginAttempt(email: string, success: boolean, ip?: string) {
    this.logEvent('login_attempt', {
      email: this.maskEmail(email),
      success,
      ip: ip || 'client-side'
    });
  }

  static logLoginFailure(email: string, reason: string, attemptCount: number) {
    this.logEvent('login_failure', {
      email: this.maskEmail(email),
      reason,
      attemptCount
    });
  }

  static logAccountLocked(email: string, duration: number) {
    this.logEvent('account_locked', {
      email: this.maskEmail(email),
      durationMinutes: Math.ceil(duration / (60 * 1000))
    });
  }

  static logPasswordChange(userId: string, success: boolean) {
    this.logEvent('password_change', {
      userId,
      success
    });
  }

  static logSessionExpired(sessionId: string) {
    this.logEvent('session_expired', {
      sessionId
    });
  }

  static logSuspiciousActivity(activity: string, details: Record<string, unknown>) {
    this.logEvent('suspicious_activity', {
      activity,
      details
    });
  }

  private static maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local}***@${domain}`;
    return `${local.substring(0, 2)}***@${domain}`;
  }
}

// Tipos para el logging
export type SecurityEvent =
  | 'login_attempt'
  | 'login_failure'
  | 'login_success'
  | 'account_locked'
  | 'password_change'
  | 'session_expired'
  | 'suspicious_activity'
  | 'csrf_attempt'
  | 'xss_attempt';

export interface SecurityEventDetails {
  [key: string]: unknown;
}

export interface SecurityLogEntry {
  id: string;
  timestamp: string;
  event: SecurityEvent;
  details: SecurityEventDetails;
  userAgent: string;
  ip: string;
  sessionId?: string;
}
