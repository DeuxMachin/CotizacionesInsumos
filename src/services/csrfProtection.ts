import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Función para generar un token CSRF
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Función para validar un token CSRF
export function validateCSRFToken(token: string, secret: string): boolean {
  try {
    // Aquí puedes implementar validación más compleja si es necesario
    // Por ahora, solo verificamos que el token no esté vacío y tenga la longitud correcta
    return Boolean(token && token.length === 64); // 32 bytes en hex = 64 caracteres
  } catch (error) {
    console.error('Error validating CSRF token:', error);
    return false;
  }
}

// Middleware para protección CSRF
export function csrfProtection(request: NextRequest): NextResponse | null {
  // Solo aplicar protección CSRF a métodos que modifican datos
  const protectedMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];

  if (!protectedMethods.includes(request.method)) {
    return null; // No aplicar protección
  }

  // Obtener el token CSRF del header o del body
  const csrfToken = request.headers.get('x-csrf-token') ||
                   request.headers.get('csrf-token');

  if (!csrfToken) {
    return NextResponse.json(
      { error: 'CSRF token missing' },
      { status: 403 }
    );
  }

  // Validar el token (aquí deberías comparar con el token de la sesión)
  const isValid = validateCSRFToken(csrfToken, process.env.CSRF_SECRET || 'default-secret');

  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }

  return null; // Token válido, continuar con la solicitud
}

// Función para obtener el token CSRF para el cliente
export function getCSRFToken(request: NextRequest): string {
  // En producción, esto debería venir de la sesión del usuario
  // Por ahora, generamos uno nuevo
  return generateCSRFToken();
}

// Hook personalizado para usar CSRF en componentes React
export function useCSRFToken() {
  // Esta función se ejecutaría en el cliente
  // En Next.js 13+, puedes usar 'use client' y obtener el token del contexto
  return {
    token: generateCSRFToken(),
    headerName: 'x-csrf-token'
  };
}

// Protección XSS - Validaciones de entrada
export const XSSProtection = {
  // Validar email contra caracteres peligrosos
  validateEmail: (email: string): boolean => {
    if (!email || typeof email !== 'string') return false;

    // Patrones peligrosos comunes
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /expression\s*\(/i,
      /vbscript:/i,
      /data:text\/html/i
    ];

    // Verificar que sea un email válido básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;

    // Verificar que no contenga patrones peligrosos
    return !dangerousPatterns.some(pattern => pattern.test(email));
  },

  // Validar contraseña contra caracteres peligrosos
  validatePassword: (password: string): boolean => {
    if (!password || typeof password !== 'string') return false;

    // La contraseña debe tener entre 6 y 128 caracteres
    if (password.length < 6 || password.length > 128) return false;

    // Patrones peligrosos comunes
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /expression\s*\(/i,
      /vbscript:/i,
      /data:text\/html/i
    ];

    // Verificar que no contenga patrones peligrosos
    return !dangerousPatterns.some(pattern => pattern.test(password));
  }
};

// Protección CSRF - Funciones para manejo de tokens CSRF
export const CSRFProtection = {
  // Generar token CSRF
  generateToken: (): string => {
    return generateCSRFToken();
  },

  // Validar token CSRF
  validateToken: (token: string): boolean => {
    return validateCSRFToken(token, process.env.CSRF_SECRET || 'default-secret');
  },

  // Obtener token para el cliente
  getClientToken: (): string => {
    return generateCSRFToken();
  }
};
