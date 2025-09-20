// Dominio interno para mostrar un Target (o "PosibleTarget") en la UI.
// Se mapea desde las tablas:
//  - targets
//  - target_contactos (opcional 0..n -> usamos el primero)
//  - target_notas
//  - target_eventos (derivamos fechaContacto del primer evento tipo 'contacto')
//  - target_tipos (para nombre del tipo)
// NOTA: La BD NO tiene actualmente columnas para:
//  - observaciones (UI lo usa) -> se almacenará como primera nota especial
//  - fechaEstimadaInicio -> se registra como evento tipo 'estimado_inicio'
//  - fechaContacto directa -> se deriva del primer evento tipo 'contacto'
// Si deseas persistirlas directamente conviene agregar columnas:
//  - targets.observaciones TEXT NULL
//  - targets.fecha_estimada_inicio DATE NULL
//  - targets.fecha_primer_contacto TIMESTAMP WITH TIME ZONE NULL
export interface PosibleTarget {
  id: number; // bigint en BD
  titulo: string;
  descripcion: string; // 'descripcion' en BD (no incluye observaciones adicionales)
  ubicacion: {
    direccion: string;
    lat: number;
    lng: number;
    googleMapsUrl?: string; // derivado en cliente
    ciudad?: string | null;
    region?: string | null;
    comuna?: string | null;
  };
  contacto: {
    id?: number;
    nombre?: string | null;
    telefono?: string | null;
    email?: string | null;
    empresa?: string | null;
  };
  estado: 'pendiente' | 'contactado' | 'gestionando' | 'cerrado' | 'descartado';
  prioridad: 'baja' | 'media' | 'alta';
  fechaCreacion: string; // created_at
  fechaContacto?: string; // derivada
  creadoPor: string; // creado_por (uuid)
  gestionadoPor?: string | null; // asignado_a (uuid)
  nombreGestionadoPor?: string | null; // join usuarios
  observaciones?: string; // (si viene como primera nota especial)
  tipoObra?: string | null; // nombre en target_tipos
  fechaEstimadaInicio?: string; // derivada de evento 'estimado_inicio'
  // notas eliminadas de la interfaz
}

export interface CreateTargetData {
  titulo: string;
  descripcion: string;
  direccion: string;
  lat: number;
  lng: number;
  ciudad?: string;
  region?: string;
  comuna?: string;
  contactoNombre?: string;
  contactoTelefono?: string;
  contactoEmail?: string;
  contactoEmpresa?: string;
  prioridad: 'baja' | 'media' | 'alta';
  tipoObra?: string; // nombre del tipo (buscaremos su id)
  fechaEstimadaInicio?: string; // YYYY-MM-DD
  observaciones?: string;
}

export interface UpdateTargetData {
  titulo?: string;
  descripcion?: string;
  direccion?: string;
  lat?: number;
  lng?: number;
  ciudad?: string;
  region?: string;
  comuna?: string;
  clienteId?: number;
  contactoNombre?: string;
  contactoTelefono?: string;
  contactoEmail?: string;
  contactoEmpresa?: string;
  prioridad?: 'baja' | 'media' | 'alta';
  estado?: 'pendiente' | 'contactado' | 'gestionando' | 'cerrado' | 'descartado';
  tipoObra?: string;
  fechaEstimadaInicio?: string;
  observaciones?: string;
}

// (Notas eliminadas de la UI)
