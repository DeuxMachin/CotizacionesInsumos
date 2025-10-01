import { supabase } from '@/lib/supabase';

type AttemptInfo = {
  count: number; // windowed count
  firstAttempt: number; // epoch ms for window
  lockedUntil?: number; // epoch ms
  lifetimeCount: number; // since process start
};

const WINDOW_MS = 15 * 60_000; // 15 minutes
const TEMP_LOCK_THRESHOLD = 6; // 6 intentos fallidos => inhabilitar cuenta

const attemptsByEmail: Map<string, AttemptInfo> = new Map();

export function isTemporarilyLocked(email: string): { locked: boolean; lockedUntil?: number } {
  const info = attemptsByEmail.get(email.toLowerCase());
  if (!info) return { locked: false };
  const now = Date.now();
  if (info.lockedUntil && info.lockedUntil > now) {
    return { locked: true, lockedUntil: info.lockedUntil };
  }
  return { locked: false };
}

export async function registerFailedAttempt(email: string): Promise<{ locked: boolean; deactivated: boolean; lockedUntil?: number; windowCount: number; lifetimeCount: number }> {
  const key = email.toLowerCase();
  const now = Date.now();
  let info = attemptsByEmail.get(key);
  if (!info) {
    info = { count: 0, firstAttempt: now, lifetimeCount: 0 };
    attemptsByEmail.set(key, info);
  }

  // Reset window if expired
  if (now - info.firstAttempt > WINDOW_MS) {
    info.firstAttempt = now;
    info.count = 0;
  }

  info.count += 1;
  info.lifetimeCount += 1;

  // Política actual: a los 6 intentos fallidos se inhabilita la cuenta (activo = false)
  if (info.count >= TEMP_LOCK_THRESHOLD) {
    try {
      // Guardar un registro para indicar que la cuenta fue desactivada por demasiados intentos
      // y requerirá restablecer la contraseña para reactivarse
      await supabase.from('usuarios').update({ 
        activo: false,
        password_updated_at: null // Marca para indicar que debe cambiar su contraseña
      }).eq('email', key);
    } catch {
      // si falla, igual retornamos como desactivada para efectos de UX
    }
    // Bloqueo efectivo prolongado; el estado en DB impedirá acceso
    info.lockedUntil = now + 365 * 24 * 60 * 60_000; // ~1 año
    return { locked: true, deactivated: true, lockedUntil: info.lockedUntil, windowCount: info.count, lifetimeCount: info.lifetimeCount };
  }

  return { locked: false, deactivated: false, windowCount: info.count, lifetimeCount: info.lifetimeCount };
}

export function resetAttempts(email: string): void {
  const key = email.toLowerCase();
  attemptsByEmail.delete(key);
}

export function remainingLockDurationMs(email: string): number | undefined {
  const status = isTemporarilyLocked(email);
  if (!status.locked || !status.lockedUntil) return undefined;
  return Math.max(0, status.lockedUntil - Date.now());
}
