// Servicio para manejar la seguridad de login
export class SecurityService {
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutos en milisegundos
  private static readonly STORAGE_KEY = 'login_attempts';

  // Obtener intentos de login desde localStorage
  private static getAttempts(email: string) {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return { count: 0, lastAttempt: 0 };
      
      const attempts = JSON.parse(stored);
      return attempts[email] || { count: 0, lastAttempt: 0 };
    } catch {
      return { count: 0, lastAttempt: 0 };
    }
  }

  // Guardar intentos de login en localStorage
  private static setAttempts(email: string, count: number, lastAttempt: number) {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const attempts = stored ? JSON.parse(stored) : {};
      
      attempts[email] = { count, lastAttempt };
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
  static registerFailedAttempt(email: string) {
    const attempts = this.getAttempts(email);
    this.setAttempts(email, attempts.count + 1, Date.now());
  }

  // Resetear intentos después de login exitoso
  static resetAttempts(email: string) {
    this.setAttempts(email, 0, 0);
  }

  // Obtener tiempo restante de bloqueo en formato legible
  static getRemainingLockoutTime(remainingMs: number): string {
    const minutes = Math.ceil(remainingMs / (60 * 1000));
    return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
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
}
