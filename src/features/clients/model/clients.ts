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
];
