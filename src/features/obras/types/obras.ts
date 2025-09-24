// Tipos específicos para el sistema de Obras - Versión corregida

export type EstadoObra = 
  | 'planificacion'     
  | 'activa'           
  | 'pausada'          
  | 'finalizada'       
  | 'cancelada'        
  | 'sin_contacto';    

export type EtapaObra = 
  | 'fundacion'        
  | 'estructura'       
  | 'albanileria'      
  | 'instalaciones'    
  | 'terminaciones'    
  | 'entrega';         

export interface ContactoObra {
  nombre: string;
  cargo: string;
  telefono: string;
  email?: string;
}

// Contacto de obra extendido con marca de principal opcional
export interface ObraContacto extends ContactoObra {
  es_principal?: boolean;
}

// Cargos requeridos por cada obra (orden fijo)
export const REQUIRED_CARGOS: readonly string[] = [
  'Jefe de Obra',
  'Compras',
  'Logística',
  'Calidad',
  'Prevención de Riesgos',
] as const;

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
  nombreEmpresa: string;           
  constructora: EmpresaConstructora;
  vendedorAsignado: string;        
  nombreVendedor: string;          
  // Contactos de la obra (siempre 5 cargos fijos). Si no existe, usar { nombre: 'No existe' } para ese cargo
  contactos?: ObraContacto[];
  
  estado: EstadoObra;
  etapaActual: EtapaObra;
  etapasCompletadas: EtapaObra[];
  
  descripcion?: string;
  direccionObra: string;
  comuna?: string;
  ciudad?: string;
  fechaInicio: Date;
  fechaEstimadaFin?: Date;
  fechaUltimoContacto: Date;
  
  valorEstimado?: number;
  materialVendido: number;
  pendiente: number;
  proximoSeguimiento?: Date;
  
  fechaCreacion: Date;
  fechaActualizacion: Date;
  notas?: string;

  // Relaciones (IDs)
  clienteId?: number;          // clientes.id
  tipoObraId?: number;         // obra_tipos.id
  tamanoObraId?: number;       // obra_tamanos.id
}

// Tipos para filtros
export interface FiltroObras {
  estado?: EstadoObra[];
  etapa?: EtapaObra[];
  vendedor?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  busqueda?: string;
}

export interface EstadisticasObras {
  totalObras: number;
  obrasPorEstado: Record<EstadoObra, number>;
  obrasPorEtapa: Record<EtapaObra, number>;
  valorTotalEstimado: number;
  materialVendidoTotal: number;
}

// Tipos para eventos y handlers
export type OnFiltroChange = <K extends keyof FiltroObras>(
  key: K, 
  value: FiltroObras[K]
) => void;

export type OnObraUpdate = (obra: Obra) => Promise<boolean>;

// Tipos para opciones de UI
export interface OpcionVendedor {
  id: string;
  nombre: string;
}

// Colores para estados y etapas
export interface ColorConfig {
  bg: string;
  text: string;
}

export type GetEstadoColor = (estado: EstadoObra) => ColorConfig;
export type GetEtapaColor = (etapa: EtapaObra) => { bg: string; text: string };

// Props tipadas para componentes
export interface ObraCardProps {
  obra: Obra;
  getEstadoColor: GetEstadoColor;
  getEtapaColor: GetEtapaColor;
  formatMoney: (amount: number) => string;
  onVerDetalle: (obra: Obra) => void;
  onEliminar: (obraId: string) => void;
  onEstadoChange?: (obraId: string, nuevoEstado: EstadoObra) => void;
}

export interface ObrasTableProps {
  obras: Obra[];
  getEstadoColor: GetEstadoColor;
  formatMoney: (amount: number) => string;
  onVerDetalle: (obra: Obra) => void;
  onEliminar: (obraId: string) => void;
  onEstadoChange?: (obraId: string, nuevoEstado: EstadoObra) => void;
}


export interface FiltersBarProps {
  isOpen: boolean;
  filtros: FiltroObras;
  vendedores: OpcionVendedor[];
  onFiltroChange?: OnFiltroChange;
  onClearFilters?: () => void;
  onClose: () => void;
  onFiltrosChange: (filtros: FiltroObras) => void;
}

// Tipos para hooks
export interface UseObrasReturn {
  obras: Obra[];
  todasLasObras: Obra[];
  loading: boolean;
  estadisticas: EstadisticasObras;
  filtros: FiltroObras;
  setFiltros: (filtros: FiltroObras) => void;
  isAdmin: boolean;
  actualizarEstadoObra: (obraId: string, nuevoEstado: EstadoObra) => Promise<boolean>;
  eliminarObra: (obraId: string) => Promise<boolean>;
  crearObra: (obra: Omit<Obra, 'id' | 'fechaCreacion' | 'fechaActualizacion' | 'fechaUltimoContacto'>) => Promise<boolean>;
  paginationConfig: {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    totalItems: number;
  };
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  userId?: string;
  userName: string;
}
