import type { DTEDocument } from "../ChileanTaxUtils";

const numberCL = (n: number) => new Intl.NumberFormat("es-CL").format(n);
const longDate = (iso: string) => {
  const d = new Date(iso);
  const day = d.toLocaleString("es-CL", { day: "2-digit" });
  const month = d.toLocaleString("es-CL", { month: "long" });
  const year = d.toLocaleString("es-CL", { year: "numeric" });
  return `${day}-${month}-${year}`.replace(/-(\w)/, " $1 ");
};

function tipoLegible(t: DTEDocument["tipo"]) {
  if (t === "COTIZACIÓN") return t;
  return `${t} ELECTRÓNICA`;
}

export function mapToTemplateModel(doc: DTEDocument) {
  const items = doc.items.map(it => {
    const desc = it.descuentoPct ? (it.precio * it.descuentoPct) / 100 : 0;
    const precioFinal = Math.max(0, it.precio - desc);
    const valor = Math.round(precioFinal * it.cantidad + (it.recargo || 0));
    return {
      codigo: it.codigo,
      descripcion: it.descripcion,
      cantidad: it.cantidad,
      precio: numberCL(it.precio),
      dscto_porcentaje: it.descuentoPct ? `${it.descuentoPct}` : "0",
      recargo: it.recargo ? numberCL(it.recargo) : "",
      afecto_exento: it.afecto !== false,
      valor: numberCL(valor),
    };
  });

  const suma_cantidades = doc.items.reduce((a, b) => a + (b.cantidad || 0), 0);
  return {
    logo_url: doc.emisor.logoUrl || "",
    logo_subtitle: "",
    tipo_doc_legible: tipoLegible(doc.tipo),
    numero_interno: doc.folio || "",
    sii_oficina: (doc.sucursal || "TEMUCO").replace(/^S\.I\.I\s*-\s*/i, ""),
    fecha_emision: longDate(doc.fechaEmision),
    emisor: {
      razon_social: doc.emisor.encabezadoSuperior
        ? `${doc.emisor.encabezadoSuperior} ${doc.emisor.encabezadoInferior ? doc.emisor.encabezadoInferior : ""}`.trim()
        : doc.emisor.razonSocial,
      giro: doc.emisor.giro,
      web: "",
      direccion: `${doc.emisor.direccion}${doc.emisor.ciudad ? ", " + doc.emisor.ciudad : ""}`,
      email: doc.emisor.email || "",
      telefono: doc.emisor.telefono || "",
      rut: doc.emisor.rut,
    },
    receptor: {
      razon_social: doc.receptor.razonSocial,
      direccion: doc.receptor.direccion || "",
      giro: doc.receptor.giro || "",
      rut: doc.receptor.rut || "",
      comuna: doc.receptor.comuna || "",
      ciudad: doc.receptor.ciudad || "",
    },
    items,
    num_lineas: items.length,
    suma_cantidades,
    referencia_texto: (doc.referencias && doc.referencias.length) ? doc.referencias.join(" | ") : "",
    observaciones: doc.observaciones || "",
    subtotal: numberCL(doc.items.reduce((a, it) => a + it.precio * it.cantidad, 0)),
    descto_global_monto: numberCL(0),
    neto: numberCL(doc.items.filter(i => i.afecto !== false).reduce((a, it) => a + it.precio * it.cantidad, 0)),
    iva: numberCL(Math.round(doc.items.filter(i => i.afecto !== false).reduce((a, it) => a + it.precio * it.cantidad, 0) * (doc.tasaIVA ?? 0.19))),
    total: numberCL(doc.items.reduce((a, it) => a + Math.round((it.precio - (it.descuentoPct ? (it.precio * it.descuentoPct) / 100 : 0)) * it.cantidad + (it.recargo || 0)), 0)),
  };
}
