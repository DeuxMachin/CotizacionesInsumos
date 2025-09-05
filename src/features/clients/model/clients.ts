export type Client = {
  id: string;
  rut: string;
  razonSocial: string;
  giro: string;
  direccion: string;
  region: string;
  ciudad: string;
  comuna: string;
  tipoEmpresa: "Ltda." | "S.A." | "SpA" | "E.I.R.L." | "Otra";
  contactoNombre: string;
  contactoEmail: string;
  contactoTelefono: string;
};

export const clients: Client[] = [
  {
    id: "C-001",
    rut: "76.123.456-7",
    razonSocial: "Empresa ABC Ltda.",
    giro: "Comercializadora de insumos",
    direccion: "Av. Providencia 1234",
    region: "Metropolitana",
    ciudad: "Santiago",
    comuna: "Providencia",
    tipoEmpresa: "Ltda.",
    contactoNombre: "Juan Pérez",
    contactoEmail: "juan.perez@abc.cl",
    contactoTelefono: "+56 9 1234 5678",
  },
  {
    id: "C-002",
    rut: "96.987.654-3",
    razonSocial: "Comercial XYZ S.A.",
    giro: "Servicios de tecnología",
    direccion: "Av. Apoquindo 4321",
    region: "Metropolitana",
    ciudad: "Las Condes",
    comuna: "Las Condes",
    tipoEmpresa: "S.A.",
    contactoNombre: "María López",
    contactoEmail: "maria.lopez@xyz.cl",
    contactoTelefono: "+56 2 2777 8899",
  },
  {
    id: "C-003",
    rut: "77.654.321-9",
    razonSocial: "Constructora Los Andes SpA",
    giro: "Construcción e inmobiliaria",
    direccion: "Av. Las Condes 9876",
    region: "Metropolitana",
    ciudad: "Santiago",
    comuna: "Las Condes",
    tipoEmpresa: "SpA",
    contactoNombre: "Carlos Rodríguez",
    contactoEmail: "carlos.rodriguez@losandes.cl",
    contactoTelefono: "+56 9 8765 4321",
  },
  {
    id: "C-004",
    rut: "78.111.222-3",
    razonSocial: "Industrias del Norte Ltda.",
    giro: "Manufactura y distribución",
    direccion: "Av. Independencia 2468",
    region: "Metropolitana",
    ciudad: "Santiago",
    comuna: "Independencia",
    tipoEmpresa: "Ltda.",
    contactoNombre: "Ana Martínez",
    contactoEmail: "ana.martinez@norte.cl",
    contactoTelefono: "+56 2 2555 7788",
  },
  {
    id: "C-005",
    rut: "79.333.444-5",
    razonSocial: "Servicios Integrales del Sur S.A.",
    giro: "Servicios generales",
    direccion: "Av. Vicuña Mackenna 3579",
    region: "Metropolitana",
    ciudad: "Santiago",
    comuna: "Ñuñoa",
    tipoEmpresa: "S.A.",
    contactoNombre: "Pedro González",
    contactoEmail: "pedro.gonzalez@sur.cl",
    contactoTelefono: "+56 9 2468 1357",
  },
  {
    id: "C-006",
    rut: "80.555.666-7",
    razonSocial: "Materiales de Construcción Pacífico E.I.R.L.",
    giro: "Venta de materiales de construcción",
    direccion: "Av. Maipú 1357",
    region: "Metropolitana",
    ciudad: "Maipú",
    comuna: "Maipú",
    tipoEmpresa: "E.I.R.L.",
    contactoNombre: "Sofía Hernández",
    contactoEmail: "sofia.hernandez@pacifico.cl",
    contactoTelefono: "+56 2 2999 3344",
  }
];

// Función para buscar clientes por RUT o razón social
export const searchClients = (query: string): Client[] => {
  if (!query || query.length < 2) return [];
  
  const searchTerm = query.toLowerCase().trim();
  
  return clients.filter(client => {
    // Buscar por RUT (sin formato)
    const rutWithoutFormat = client.rut.replace(/[.-\s]/g, '').toLowerCase();
    const queryWithoutFormat = searchTerm.replace(/[.-\s]/g, '');
    
    // Buscar por razón social
    const razonSocial = client.razonSocial.toLowerCase();
    
    return rutWithoutFormat.includes(queryWithoutFormat) || 
           razonSocial.includes(searchTerm) ||
           client.rut.toLowerCase().includes(searchTerm);
  });
};

// Función para obtener cliente por ID
export const getClientById = (id: string): Client | null => {
  return clients.find(client => client.id === id) || null;
};

// Función para obtener todos los clientes
export const getAllClients = (): Client[] => {
  return clients;
};
