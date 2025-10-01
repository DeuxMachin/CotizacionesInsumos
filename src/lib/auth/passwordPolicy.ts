export const COMMON_PASSWORDS: readonly string[] = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
  'qwerty123', 'welcome123', 'admin123', 'root', 'user', 'guest'
] as const;

export function isCommonPassword(pwd: string): boolean {
  return COMMON_PASSWORDS.includes(pwd.toLowerCase());
}

export function validatePassword(pwd: string): { valid: boolean; error?: string } {
  if (pwd.length < 6) return { valid: false, error: 'La contraseña debe tener al menos 6 caracteres' };
  if (pwd.length > 128) return { valid: false, error: 'La contraseña no puede exceder los 128 caracteres' };
  if (isCommonPassword(pwd)) return { valid: false, error: 'Esta contraseña es muy común. Por favor elija una más segura.' };
  return { valid: true };
}
