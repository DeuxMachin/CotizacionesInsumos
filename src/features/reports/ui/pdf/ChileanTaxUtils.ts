// Utilidades básicas para cálculos de boleta/factura chilena (CLP)

export type DTEType = "FACTURA" | "BOLETA" | "NOTA DE CRÉDITO" | "NOTA DE DÉBITO" | "COTIZACIÓN";

export type DTEItem = {
  codigo: string;
  descripcion: string;
  cantidad: number;
  precio: number; // precio unitario
  descuentoPct?: number; // 0..100
  afecto?: boolean; // true = afecta IVA
  recargo?: number; // monto de recargo por línea (opcional)
};

export type DTEIssuer = {
  razonSocial: string;
  rut: string; // 76.XXX.XXX-X
  giro: string;
  direccion: string;
  comuna?: string;
  ciudad?: string;
  email?: string;
  telefono?: string;
  logoUrl?: string; // PNG/JPG recomendado
  // Encabezado opcional en dos líneas para igualar formato exacto del comprobante
  encabezadoSuperior?: string; // p.ej. "INSUMOS DE CONSTRUCCION Y SERVICIOS DE VENTA"
  encabezadoInferior?: string; // p.ej. "OLGA ESTER LEAL LEAL E.I.R.L."
};

export type DTEReceiver = {
  razonSocial: string;
  rut?: string;
  giro?: string;
  direccion?: string;
  comuna?: string;
  ciudad?: string;
};

export type DTEDocument = {
  tipo: DTEType;
  folio?: string | number;
  fechaEmision: string; // ISO
  sucursal?: string;
  referencias?: string[];
  observaciones?: string;
  items: DTEItem[];
  emisor: DTEIssuer;
  receptor: DTEReceiver;
  exentoTotal?: number; // si hay líneas exentas
  tasaIVA?: number; // p.ej. 0.19
};

export const CLP = (n: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n);

export function calcularTotales(doc: DTEDocument) {
  const tasa = doc.tasaIVA ?? 0.19;
  let neto = 0;
  let exento = 0;
  for (const it of doc.items) {
    const desc = it.descuentoPct ? (it.precio * it.descuentoPct) / 100 : 0;
    const precioFinal = Math.max(0, it.precio - desc);
    const totalLinea = Math.round(precioFinal * it.cantidad);
    if (it.afecto === false) exento += totalLinea; else neto += totalLinea;
  }
  const iva = Math.round(neto * tasa);
  const total = neto + iva + exento;
  return { neto, exento, iva, total };
}

export function mapQuoteToDTE(params: {
  // Datos mínimos de una cotización para generar DTE demo
  quoteId: string;
  cliente: DTEReceiver;
  items: DTEItem[];
  emisor: DTEIssuer;
  tipo: DTEType;
  fechaEmision: string;
  folio?: string | number;
  tasaIVA?: number;
  observaciones?: string;
}): DTEDocument {
  return {
    tipo: params.tipo,
    folio: params.folio,
    fechaEmision: params.fechaEmision,
    sucursal: "S.I.I - TEMUCO",
    referencias: [],
    observaciones: params.observaciones,
    items: params.items,
    emisor: params.emisor,
    receptor: params.cliente,
    tasaIVA: params.tasaIVA ?? 0.19,
  };
}
