/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Configuración de seguridad HTTPS
  async headers() {
    return [
      {
        // Aplicar a todas las rutas
        source: '/(.*)',
        headers: [
          // HSTS - HTTP Strict Transport Security
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          // Prevenir MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Prevenir clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // Prevenir XSS
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Content Security Policy básica
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'production'
              ? [
                  "default-src 'self'",
                  // Evitar inline/eval en prod; permitir Next.js runtime con nonce/crossorigin
                  "script-src 'self'",
                  "style-src 'self' 'unsafe-inline'",
                  "img-src 'self' data: https:",
                  "font-src 'self' data:",
                  "connect-src 'self' https:",
                  "frame-ancestors 'none'",
                  "base-uri 'self'",
                  "form-action 'self'"
                ].join('; ')
              : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
          }
        ],
      },
      {
        // Configuración específica para rutas de autenticación
        source: '/login',
        headers: [
          // Cache control para login
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          }
        ],
      }
    ];
  },

  // Configuración de output para deployment - solo en producción para evitar problemas de symlinks en Windows
  ...(process.env.NODE_ENV === 'production' && process.env.DOCKER_BUILD === 'true' ? { output: 'standalone' } : {}),
};

export default nextConfig;
