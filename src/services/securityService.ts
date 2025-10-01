// Servicio para manejar la seguridad de login
import { SecurityLogger } from './securityLogger';

export class SecurityService {
  private static readonly MAX_ATTEMPTS = 6;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutos en milisegundos
  private static readonly STORAGE_KEY = 'login_attempts';
  private static readonly LOG_KEY = 'security_logs';

  // Normalizar email para uso como clave
  private static normalizeEmail(email: string): string {
    return (email || '').trim().toLowerCase();
  }

  // Logging de eventos de seguridad
  private static logSecurityEvent(event: string, details: Record<string, unknown>) {
    try {
      const stored = localStorage.getItem(this.LOG_KEY);
      const logs = stored ? JSON.parse(stored) : [];

      const logEntry = {
        timestamp: new Date().toISOString(),
        event,
        details,
        userAgent: navigator.userAgent,
        ip: 'client-side' // En producción, esto vendría del servidor
      };

      logs.push(logEntry);

      // Mantener solo los últimos 100 logs
      if (logs.length > 100) {
        logs.shift();
      }

      localStorage.setItem(this.LOG_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  // Obtener logs de seguridad
  static getSecurityLogs() {
    try {
      const stored = localStorage.getItem(this.LOG_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Obtener intentos de login desde localStorage
  private static getAttempts(email: string) {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return { count: 0, lastAttempt: 0 };
      
      const attempts = JSON.parse(stored);
      const key = this.normalizeEmail(email);
      return attempts[key] || { count: 0, lastAttempt: 0 };
    } catch {
      return { count: 0, lastAttempt: 0 };
    }
  }

  // Guardar intentos de login en localStorage
  private static setAttempts(email: string, count: number, lastAttempt: number) {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const attempts = stored ? JSON.parse(stored) : {};

      const key = this.normalizeEmail(email);
      attempts[key] = { count, lastAttempt };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(attempts));
    } catch (error) {
      console.error('Error guardando intentos de login:', error);
    }
  }

  // Verificar si la cuenta está bloqueada
  static isAccountLocked(email: string): { locked: boolean; remainingTime?: number } {
    const attempts = this.getAttempts(email);
    
    if (attempts.count >= this.MAX_ATTEMPTS) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
      
      if (timeSinceLastAttempt < this.LOCKOUT_DURATION) {
        const remainingTime = this.LOCKOUT_DURATION - timeSinceLastAttempt;
        return { locked: true, remainingTime };
      } else {
        // El tiempo de bloqueo ha expirado, resetear intentos
        this.resetAttempts(email);
        return { locked: false };
      }
    }
    
    return { locked: false };
  }

  // Registrar un intento de login fallido
  static registerFailedAttempt(email: string): number {
    const attempts = this.getAttempts(email);
    const newCount = attempts.count + 1;
    this.setAttempts(email, newCount, Date.now());

    // Log del intento fallido usando SecurityLogger
    SecurityLogger.logLoginFailure(email, 'invalid_credentials', newCount);

    // Log si se acerca al límite
    if (newCount >= this.MAX_ATTEMPTS - 1) {
      SecurityLogger.logSuspiciousActivity('multiple_failed_attempts', {
        email: this.maskEmail(email),
        attemptCount: newCount
      });
    }
    return newCount;
  }

  // Resetear intentos después de login exitoso
  static resetAttempts(email: string) {
    this.setAttempts(email, 0, 0);

    // Log del login exitoso
    SecurityLogger.logLoginAttempt(email, true);
  }

  // Obtener tiempo restante de bloqueo en formato legible
  static getRemainingLockoutTime(remainingMs: number): string {
    const minutes = Math.ceil(remainingMs / (60 * 1000));
    return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  }

  // Enmascarar email para logging (ocultar parte del email por privacidad)
  private static maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local}***@${domain}`;
    return `${local.substring(0, 2)}***@${domain}`;
  }

  // Limpiar intentos antiguos (llamar periódicamente)
  static cleanupOldAttempts() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;
      
  const attempts = JSON.parse(stored) as Record<string, { count: number; lastAttempt: number }>;
  const now = Date.now();
  const cleanedAttempts: Record<string, { count: number; lastAttempt: number }> = {};
      
      for (const [email, data] of Object.entries(attempts)) {
        const attemptData = data as { count: number; lastAttempt: number };
        
        // Mantener solo intentos recientes
        if (now - attemptData.lastAttempt < this.LOCKOUT_DURATION) {
          cleanedAttempts[email] = attemptData;
        }
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cleanedAttempts));
    } catch (error) {
      console.error('Error limpiando intentos antiguos:', error);
    }
  }

  // Obtener el conteo actual de intentos para un email normalizado
  static getAttemptCount(email: string): number {
    const attempts = this.getAttempts(email);
    return attempts.count || 0;
  }
}
