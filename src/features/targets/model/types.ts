export interface PosibleTarget {
  id: string;
  titulo: string;
  descripcion: string;
  ubicacion: {
    direccion: string;
    lat: number;
    lng: number;
    googleMapsUrl?: string;
    ciudad?: string;
    region?: string;
  };
  contacto: {
    nombre?: string;
    telefono?: string;
    email?: string;
    empresa?: string;
  };
  estado: 'pendiente' | 'contactado' | 'gestionando' | 'cerrado' | 'descartado';
  prioridad: 'baja' | 'media' | 'alta';
  fechaCreacion: string;
  fechaContacto?: string;
  creadoPor: string; // ID del vendedor que lo creó
  gestionadoPor?: string; // ID del vendedor que lo está gestionando
  nombreGestionadoPor?: string; // Nombre del vendedor para mostrar
  observaciones?: string;
  tipoObra?: string;
  fechaEstimadaInicio?: string;
  notas: {
    id: string;
    texto: string;
    fecha: string;
    autor: string;
  }[];
}

export interface CreateTargetData {
  titulo: string;
  descripcion: string;
  direccion: string;
  lat: number;
  lng: number;
  ciudad?: string;
  region?: string;
  contactoNombre?: string;
  contactoTelefono?: string;
  contactoEmail?: string;
  contactoEmpresa?: string;
  prioridad: 'baja' | 'media' | 'alta';
  tipoObra?: string;
  fechaEstimadaInicio?: string;
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

export interface AddNoteData {
  targetId: string;
  texto: string;
}
