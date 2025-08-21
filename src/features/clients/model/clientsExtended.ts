import type { Client } from "./clients";

export type ClientStatus = "vigente" | "moroso" | "inactivo";

export interface ClientExtended extends Client {
  status: ClientStatus;
  fantasyName?: string;
  business?: string;
  paymentResponsible?: string;
  paymentPhone?: string;
  credit: number;
  additionalDays: number;
  creditLine: number;
  retention: "SI" | "NO";
  discount: number;
  email?: string; // email general
  phone?: string;
  mobile?: string;
  contactName?: string;
  contactPhone?: string;
  paymentEmail?: string;
  transferInfo?: string;
  paid: number;
  pending: number;
  partial: number;
  overdue: number;
}

export const clientsExtended: ClientExtended[] = [
  {
    id: "C-1001",
    rut: "76549023-5",
    razonSocial: "2 ALERCES INGENIERÍA Y CONSTRUCCIÓN SPA",
    giro: "Construcción de edificios completos u obras de ingeniería civil",
    direccion: "HOLANDESA 890",
    region: "Araucanía",
    ciudad: "Temuco",
    comuna: "Temuco",
    tipoEmpresa: "SpA",
    contactoNombre: "",
    contactoEmail: "",
    contactoTelefono: "",
    status: "vigente",
    fantasyName: "2 ALERCES INGENIERÍA Y CONSTRUCCIÓN SPA",
    business: "CONSTRUCCIÓN DE EDIFICIOS COMPLETOS O DE PARTES DE EDIFICIOS; OBRAS DE INGENIERÍA CIVIL",
    paymentResponsible: "",
    paymentPhone: "",
    credit: 0,
    additionalDays: 0,
    creditLine: 0,
    retention: "NO",
    discount: 0,
    email: "",
    phone: "",
    mobile: "",
    contactName: "",
    contactPhone: "",
    paymentEmail: "",
    transferInfo: "",
    paid: 849987,
    pending: 0,
    partial: 0,
    overdue: 0,
  },
  {
    id: "C-1002",
    rut: "76406166-7",
    razonSocial: "ACSA SPA",
    giro: "",
    direccion: "",
    region: "",
    ciudad: "",
    comuna: "",
    tipoEmpresa: "SpA",
    contactoNombre: "DIEGO",
    contactoEmail: "seguelvalenzuela@gmail.com",
    contactoTelefono: "987691161",
    status: "vigente",
    credit: 0,
    additionalDays: 0,
    creditLine: 0,
    retention: "NO",
    discount: 0,
    email: "seguelvalenzuela@gmail.com",
    paymentEmail: "seguelvalenzuela@gmail.com",
    paid: 0,
    pending: 0,
    partial: 0,
    overdue: 0,
  },
  {
    id: "C-1003",
    rut: "76693699-7",
    razonSocial: "AGENCIA DE PUBLICIDAD ZARKO CABEZAS E.I.R.L.",
    giro: "Publicidad",
    direccion: "",
    region: "",
    ciudad: "",
    comuna: "",
    tipoEmpresa: "E.I.R.L.",
    contactoNombre: "ZARKO CABEZAS",
    contactoEmail: "innovalasartemuco@gmail.com",
    contactoTelefono: "982029215",
    status: "vigente",
    transferInfo: "Transferencia electrónica",
    credit: 0,
    additionalDays: 0,
    creditLine: 0,
    retention: "NO",
    discount: 0,
    email: "innovalasartemuco@gmail.com",
    paid: 0,
    pending: 0,
    partial: 0,
    overdue: 0,
  },
  {
    id: "C-1004",
    rut: "76215637-7",
    razonSocial: "AGUAS ARAUCANIA S.A.",
    giro: "Servicios Sanitarios",
    direccion: "",
    region: "",
    ciudad: "",
    comuna: "",
    tipoEmpresa: "S.A.",
    contactoNombre: "",
    contactoEmail: "",
    contactoTelefono: "",
    status: "vigente",
    credit: 0,
    additionalDays: 0,
    creditLine: 0,
    retention: "NO",
    discount: 0,
    email: "",
    paid: 0,
    pending: 0,
    partial: 0,
    overdue: 0,
  },
];
