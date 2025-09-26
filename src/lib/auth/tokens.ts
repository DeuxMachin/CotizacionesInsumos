import { SignJWT, jwtVerify } from 'jose'

const DEFAULT_ACCESS_TTL = 60 * 60 * 24; // 24 horas (en lugar de 10 minutos)
const DEFAULT_REFRESH_TTL = 60 * 60 * 24 * 7; // 7 días

function getSecret() {
  const secret = process.env.JWT_SECRET || 'dev-insecure-secret-change-me'
  return new TextEncoder().encode(secret)
}

export interface TokenUserPayload {
  id: string;
  email: string;
  rol: string;
}


export async function signAccessToken(user: TokenUserPayload, expiresIn = DEFAULT_ACCESS_TTL) {
  const expValue = typeof expiresIn === 'number' ? `${expiresIn}s` : expiresIn;
  return await new SignJWT({
    sub: user.id,
    email: user.email,
    rol: user.rol,
    type: 'access'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expValue)
    .sign(getSecret())
}

export async function signRefreshToken(user: TokenUserPayload, expiresIn = DEFAULT_REFRESH_TTL) {
  const expValue = typeof expiresIn === 'number' ? `${expiresIn}s` : expiresIn;
  return await new SignJWT({
    sub: user.id,
    email: user.email,
    rol: user.rol,
    type: 'refresh'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expValue)
    .sign(getSecret())
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: ['HS256']
  })
  return payload as any
}

export function isExpired(exp?: number) {
  if (!exp) return true
  const now = Math.floor(Date.now() / 1000)
  return exp <= now
}
