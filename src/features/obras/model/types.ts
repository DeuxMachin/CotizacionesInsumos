// Tipos para el módulo de Obras

export type EstadoObra = 
  | 'planificacion'     // En fase de planificación
  | 'activa'           // Obra en construcción activa
  | 'pausada'          // Obra temporalmente pausada
  | 'finalizada'       // Obra completada
  | 'cancelada'        // Obra cancelada
  | 'sin_contacto';    // No hay contacto con encargado

export type EtapaObra = 
  | 'fundacion'        // Fundación y cimientos
  | 'estructura'       // Estructura principal
  | 'albanileria'      // Albañilería gruesa
  | 'instalaciones'    // Instalaciones (eléctrica, sanitaria)
  | 'terminaciones'    // Terminaciones finales
  | 'entrega';         // Entrega final

export interface ContactoObra {
  nombre: string;
  cargo: string;
  telefono: string;
  email?: string;
  whatsapp?: string;
}

export interface EmpresaConstructora {
  nombre: string;
  rut: string;
  telefono: string;
  email?: string;
  direccion?: string;
  contactoPrincipal: ContactoObra;
}

export interface Obra {
  id: string;
  nombreEmpresa: string;           // Nombre del proyecto/empresa
  constructora: EmpresaConstructora;
  vendedorAsignado: string;        // ID del vendedor
  nombreVendedor: string;          // Nombre del vendedor para mostrar
  
  // Estados y etapas
  estado: EstadoObra;
  etapaActual: EtapaObra;
  etapasCompletadas: EtapaObra[];
  
  // Información adicional
  descripcion?: string;
  direccionObra: string;
  fechaInicio: Date;
  fechaEstimadaFin?: Date;
  fechaUltimoContacto: Date;
  
  // Métricas de negocio
  valorEstimado?: number;
  materialVendido: number;
  proximoSeguimiento?: Date;
  
  // Metadatos
  fechaCreacion: Date;
  fechaActualizacion: Date;
  notas?: string;
}

// Para filtros y búsqueda
export interface FiltroObras {
  estado?: EstadoObra[];
  etapa?: EtapaObra[];
  vendedor?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  busqueda?: string;
}

// Para estadísticas
export interface EstadisticasObras {
  totalObras: number;
  obrasPorEstado: Record<EstadoObra, number>;
  obrasPorEtapa: Record<EtapaObra, number>;
  valorTotalEstimado: number;
  materialVendidoTotal: number;
}
