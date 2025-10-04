/**
 * Tipos para los contactos de clientes
 */

export type TipoContacto = 'principal' | 'pago' | 'secundario' | 'otro';

export interface ClienteContacto {
  id: number;
  cliente_id: number;
  tipo: TipoContacto;
  nombre: string;
  cargo?: string | null;
  email?: string | null;
  telefono?: string | null;
  celular?: string | null;
  es_principal: boolean;
  notas?: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClienteContactoInsert {
  cliente_id?: number; // Opcional cuando se crea junto con el cliente
  tipo: TipoContacto;
  nombre: string;
  cargo?: string | null;
  email?: string | null;
  telefono?: string | null;
  celular?: string | null;
  es_principal?: boolean;
  notas?: string | null;
  activo?: boolean;
}

export interface ClienteContactoUpdate {
  tipo?: TipoContacto;
  nombre?: string;
  cargo?: string | null;
  email?: string | null;
  telefono?: string | null;
  celular?: string | null;
  es_principal?: boolean;
  notas?: string | null;
  activo?: boolean;
}

/**
 * Interfaz para los datos de contacto desde el formulario
 */
export interface ContactoFormData {
  // Contacto Principal
  contactoPrincipal?: {
    nombre: string;
    cargo?: string;
    email: string;
    telefono: string;
    celular?: string;
  };
  
  // Responsable de Pago
  responsablePago?: {
    nombre: string;
    cargo?: string;
    email?: string;
    telefono?: string;
    celular?: string;
  };
  
  // Contacto Secundario
  contactoSecundario?: {
    nombre?: string;
    cargo?: string;
    email?: string;
    telefono?: string;
    celular?: string;
  };
}
