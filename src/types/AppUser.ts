// Shared application-level user type.
// DB still uses fields: id, email, nombre, apellido, rol
// UI & client code should depend on this normalized shape.
export interface AppUser {
  id: string
  email: string
  name?: string
  role?: string
  isAdmin?: boolean
}

// Helper to build AppUser from a raw DB user or API payload
export function toAppUser(raw: unknown): AppUser {
  if (!raw || typeof raw !== 'object') return {} as AppUser;
  const r = raw as Record<string, unknown>;
  const role = (r.role as string) || (r.rol as string);
  const name = (r.name as string) || ((r.nombre as string) && (r.apellido as string) ? `${r.nombre} ${r.apellido}` : (r.nombre as string)) || undefined;
  return {
    id: r.id as string,
    email: r.email as string,
    name,
    role,
    isAdmin: role === 'admin'
  };
}