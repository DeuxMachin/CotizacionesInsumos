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
export function toAppUser(raw: any): AppUser { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!raw) return raw
  const role = raw.role || raw.rol
  const name = raw.name || (raw.nombre && raw.apellido ? `${raw.nombre} ${raw.apellido}` : raw.nombre) || undefined
  return {
    id: raw.id,
    email: raw.email,
    name,
    role,
    isAdmin: role === 'admin'
  }
}