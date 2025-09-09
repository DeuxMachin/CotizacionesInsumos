import type { Obra, EmpresaConstructora } from './types';

// Mock de empresas constructoras
const mockConstructoras: EmpresaConstructora[] = [
  {
    nombre: "Constructora San Martín S.A.",
    rut: "76.123.456-7",
    telefono: "+56 9 1234 5678",
    email: "contacto@sanmartin.cl",
    direccion: "Av. Providencia 1234, Santiago",
    contactoPrincipal: {
      nombre: "Carlos Rodriguez",
      cargo: "Jefe de Obra",
      telefono: "+56 9 8765 4321",
      email: "carlos.rodriguez@sanmartin.cl",
  // whatsapp eliminado, usar teléfono
    }
  },
  {
    nombre: "Inmobiliaria Los Andes Ltda.",
    rut: "96.789.012-3",
    telefono: "+56 2 2345 6789",
    email: "proyectos@losandes.cl",
    direccion: "Las Condes 5678, Santiago",
    contactoPrincipal: {
      nombre: "María González",
      cargo: "Gerente de Proyectos",
      telefono: "+56 9 5432 1098",
      email: "m.gonzalez@losandes.cl",
  // whatsapp eliminado, usar teléfono
    }
  },
  {
    nombre: "Constructora Horizonte",
    rut: "77.456.789-0",
    telefono: "+56 9 3456 7890",
    email: "info@horizonte.cl",
    contactoPrincipal: {
      nombre: "Pedro Morales",
      cargo: "Ingeniero Residente",
      telefono: "+56 9 6789 0123",
      email: "p.morales@horizonte.cl"
    }
  },
  {
    nombre: "Edificaciones del Sur S.A.",
    rut: "89.123.456-4",
    telefono: "+56 41 234 5678",
    email: "obras@edisur.cl",
    direccion: "Valdivia 890, Los Ríos",
    contactoPrincipal: {
      nombre: "Ana Sepúlveda",
      cargo: "Coordinadora de Obra",
      telefono: "+56 9 7890 1234",
      email: "a.sepulveda@edisur.cl",
  // whatsapp eliminado, usar teléfono
    }
  }
];

// Mock de obras
export const mockObras: Obra[] = [
  {
    id: "obra-001",
    nombreEmpresa: "Condominio Alto Las Condes",
    constructora: mockConstructoras[0],
    vendedorAsignado: "2", // user@empresa.com
    nombreVendedor: "Usuario Estándar",
    estado: "activa",
    etapaActual: "estructura",
    etapasCompletadas: ["fundacion"],
    descripcion: "Condominio de 120 departamentos en Las Condes, 15 pisos",
    direccionObra: "Av. Las Condes 1234, Las Condes, Santiago",
    fechaInicio: new Date('2024-01-15'),
    fechaEstimadaFin: new Date('2025-08-30'),
    fechaUltimoContacto: new Date('2025-08-25'),
    valorEstimado: 850000000,
    materialVendido: 125000000,
    proximoSeguimiento: new Date('2025-09-05'),
    fechaCreacion: new Date('2024-01-10'),
    fechaActualizacion: new Date('2025-08-25'),
    notas: "Cliente muy puntual en pagos. Requiere materiales de alta calidad."
  },
  {
    id: "obra-002",
    nombreEmpresa: "Torre Los Andes",
    constructora: mockConstructoras[1],
    vendedorAsignado: "2", // user@empresa.com
    nombreVendedor: "Usuario Estándar",
    estado: "activa",
    etapaActual: "albanileria",
    etapasCompletadas: ["fundacion", "estructura"],
    descripcion: "Torre de oficinas de 25 pisos con estacionamientos subterráneos",
    direccionObra: "Av. Apoquindo 4567, Las Condes, Santiago",
    fechaInicio: new Date('2024-03-01'),
    fechaEstimadaFin: new Date('2025-12-15'),
    fechaUltimoContacto: new Date('2025-08-28'),
    valorEstimado: 1200000000,
    materialVendido: 89000000,
    proximoSeguimiento: new Date('2025-09-02'),
    fechaCreacion: new Date('2024-02-20'),
    fechaActualizacion: new Date('2025-08-28'),
    notas: "Proyecto de gran envergadura. Contacto directo con gerencia."
  },
  {
    id: "obra-003",
    nombreEmpresa: "Casas del Valle",
    constructora: mockConstructoras[2],
    vendedorAsignado: "2", // user@empresa.com
    nombreVendedor: "Usuario Estándar",
    estado: "pausada",
    etapaActual: "instalaciones",
    etapasCompletadas: ["fundacion", "estructura", "albanileria"],
    descripcion: "Conjunto habitacional de 45 casas",
    direccionObra: "Parcela 12, Melipilla, Región Metropolitana",
    fechaInicio: new Date('2024-05-10'),
    fechaEstimadaFin: new Date('2025-10-30'),
    fechaUltimoContacto: new Date('2025-08-10'),
    valorEstimado: 450000000,
    materialVendido: 156000000,
    proximoSeguimiento: new Date('2025-09-15'),
    fechaCreacion: new Date('2024-04-25'),
    fechaActualizacion: new Date('2025-08-10'),
    notas: "Obra pausada por trámites municipales. Pendiente resolución de permisos."
  },
  {
    id: "obra-004",
    nombreEmpresa: "Edificio Residencial del Sur",
    constructora: mockConstructoras[3],
    vendedorAsignado: "2", // user@empresa.com
    nombreVendedor: "Usuario Estándar",
    estado: "planificacion",
    etapaActual: "fundacion",
    etapasCompletadas: [],
    descripcion: "Edificio residencial de 8 pisos, 32 departamentos",
    direccionObra: "Calle Principal 567, Valdivia, Los Ríos",
    fechaInicio: new Date('2025-10-01'),
    fechaEstimadaFin: new Date('2026-06-30'),
    fechaUltimoContacto: new Date('2025-08-29'),
    valorEstimado: 320000000,
    materialVendido: 0,
    proximoSeguimiento: new Date('2025-09-10'),
    fechaCreacion: new Date('2025-07-15'),
    fechaActualizacion: new Date('2025-08-29'),
    notas: "Proyecto en fase de planificación. Cliente interesado en materiales premium."
  },
  {
    id: "obra-005",
    nombreEmpresa: "Centro Comercial Norte",
    constructora: mockConstructoras[0],
    vendedorAsignado: "1", // admin@empresa.com
    nombreVendedor: "Administrador",
    estado: "finalizada",
    etapaActual: "entrega",
    etapasCompletadas: ["fundacion", "estructura", "albanileria", "instalaciones", "terminaciones"],
    descripcion: "Centro comercial de 2 pisos con 80 locales comerciales",
    direccionObra: "Av. Norte 890, Quilicura, Santiago",
    fechaInicio: new Date('2023-06-01'),
    fechaEstimadaFin: new Date('2024-12-15'),
    fechaUltimoContacto: new Date('2024-12-20'),
    valorEstimado: 950000000,
    materialVendido: 234000000,
    fechaCreacion: new Date('2023-05-10'),
    fechaActualizacion: new Date('2024-12-20'),
    notas: "Proyecto finalizado exitosamente. Cliente muy satisfecho con la calidad."
  },
  {
    id: "obra-006",
    nombreEmpresa: "Complejo Industrial Maipú",
    constructora: mockConstructoras[1],
    vendedorAsignado: "1", // admin@empresa.com
    nombreVendedor: "Administrador",
    estado: "sin_contacto",
    etapaActual: "estructura",
    etapasCompletadas: ["fundacion"],
    descripcion: "Complejo industrial con 3 galpones para almacenaje",
    direccionObra: "Ruta 68 km 15, Maipú, Santiago",
    fechaInicio: new Date('2024-08-01'),
    fechaEstimadaFin: new Date('2025-04-30'),
    fechaUltimoContacto: new Date('2025-07-15'),
    valorEstimado: 680000000,
    materialVendido: 45000000,
    proximoSeguimiento: new Date('2025-09-20'),
    fechaCreacion: new Date('2024-07-10'),
    fechaActualizacion: new Date('2025-07-15'),
    notas: "Perdimos contacto con el encargado. Intentar contactar nuevamente."
  },
  {
    id: "obra-007",
    nombreEmpresa: "Edificio Corporativo Santa María",
    constructora: mockConstructoras[2],
    vendedorAsignado: "2", // user@empresa.com
    nombreVendedor: "Usuario Estándar",
    estado: "activa",
    etapaActual: "terminaciones",
    etapasCompletadas: ["fundacion", "estructura", "albanileria", "instalaciones"],
    descripcion: "Edificio corporativo de 12 pisos con fachada de vidrio",
    direccionObra: "Av. Santa María 2890, Providencia, Santiago",
    fechaInicio: new Date('2024-02-20'),
    fechaEstimadaFin: new Date('2025-11-15'),
    fechaUltimoContacto: new Date('2025-08-27'),
    valorEstimado: 780000000,
    materialVendido: 198000000,
    proximoSeguimiento: new Date('2025-09-03'),
    fechaCreacion: new Date('2024-02-10'),
    fechaActualizacion: new Date('2025-08-27'),
    notas: "Obra adelantada 2 semanas respecto al cronograma original."
  },
  {
    id: "obra-008",
    nombreEmpresa: "Conjunto Residencial Los Almendros",
    constructora: mockConstructoras[3],
    vendedorAsignado: "2", // user@empresa.com
    nombreVendedor: "Usuario Estándar",
    estado: "activa",
    etapaActual: "albanileria",
    etapasCompletadas: ["fundacion", "estructura"],
    descripcion: "Conjunto de 28 casas pareadas de 2 y 3 dormitorios",
    direccionObra: "Parcela Los Almendros, Padre Hurtado, Santiago",
    fechaInicio: new Date('2024-06-15'),
    fechaEstimadaFin: new Date('2026-01-30'),
    fechaUltimoContacto: new Date('2025-08-26'),
    valorEstimado: 620000000,
    materialVendido: 87000000,
    proximoSeguimiento: new Date('2025-09-08'),
    fechaCreacion: new Date('2024-05-20'),
    fechaActualizacion: new Date('2025-08-26'),
    notas: "Cliente solicita materiales de alta durabilidad para exteriores."
  },
  {
    id: "obra-009",
    nombreEmpresa: "Mall Plaza Oeste",
    constructora: mockConstructoras[0],
    vendedorAsignado: "1", // admin@empresa.com
    nombreVendedor: "Administrador",
    estado: "planificacion",
    etapaActual: "fundacion",
    etapasCompletadas: [],
    descripcion: "Centro comercial de 3 niveles con 150 locales comerciales",
    direccionObra: "Ruta 68 km 25, Melipilla, Santiago",
    fechaInicio: new Date('2025-11-01'),
    fechaEstimadaFin: new Date('2027-03-15'),
    fechaUltimoContacto: new Date('2025-08-28'),
    valorEstimado: 1800000000,
    materialVendido: 0,
    proximoSeguimiento: new Date('2025-09-12'),
    fechaCreacion: new Date('2025-08-01'),
    fechaActualizacion: new Date('2025-08-28'),
    notas: "Proyecto de gran envergadura. Requerirá coordinación especial de logística."
  },
  {
    id: "obra-010",
    nombreEmpresa: "Hospital Clínico Regional",
    constructora: mockConstructoras[1],
    vendedorAsignado: "1", // admin@empresa.com  
    nombreVendedor: "Administrador",
    estado: "activa",
    etapaActual: "instalaciones",
    etapasCompletadas: ["fundacion", "estructura", "albanileria"],
    descripcion: "Hospital de 6 pisos con 200 camas y centro de emergencias",
    direccionObra: "Av. Salud 1500, Rancagua, O'Higgins",
    fechaInicio: new Date('2023-09-01'),
    fechaEstimadaFin: new Date('2025-12-31'),
    fechaUltimoContacto: new Date('2025-08-29'),
    valorEstimado: 2500000000,
    materialVendido: 456000000,
    proximoSeguimiento: new Date('2025-09-01'),
    fechaCreacion: new Date('2023-08-10'),
    fechaActualizacion: new Date('2025-08-29'),
    notas: "Obra prioritaria. Cumplir estrictamente con normativas hospitalarias."
  }
];

// Función para obtener obras filtradas por vendedor
export function getObrasByVendedor(vendedorId: string): Obra[] {
  return mockObras.filter(obra => obra.vendedorAsignado === vendedorId);
}

// Función para obtener todas las obras (solo admin)
export function getAllObras(): Obra[] {
  return mockObras;
}

// Función para obtener una obra específica
export function getObraById(id: string): Obra | undefined {
  return mockObras.find(obra => obra.id === id);
}
