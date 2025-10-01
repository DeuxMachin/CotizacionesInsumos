import { NextRequest } from 'next/server';

export function getClientIp(req: NextRequest): string {
  // Respect common proxy headers; fall back to remote address
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    // Use the first IP in the list
    return xff.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;
  // NextRequest doesn't expose remote ip directly; use a stable fallback
  return 'unknown';
}

export function getUserAgent(req: NextRequest): string {
  return req.headers.get('user-agent') || 'unknown';
}

export function getRateKey(req: NextRequest, extra?: string): string {
  const ip = getClientIp(req);
  const ua = getUserAgent(req);
  return [ip, ua, extra ?? ''].filter(Boolean).join('|');
}
