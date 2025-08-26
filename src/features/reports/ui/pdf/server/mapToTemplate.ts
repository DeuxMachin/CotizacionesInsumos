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
  if (t === "COTIZACIÓN") return "NOTA DE VENTA";  // Siempre usar NOTA DE VENTA para las cotizaciones
  return `${t} ELECTRÓNICA`;
}

function formatCurrencyNoSymbol(n: number): string {
  return n.toLocaleString('es-CL');
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
  const netoCalc = doc.items.filter(i => i.afecto !== false).reduce((a, it) => a + it.precio * it.cantidad, 0);
  const exentoCalc = doc.items.filter(i => i.afecto === false).reduce((a, it) => a + it.precio * it.cantidad, 0);
  const ivaCalc = Math.round(netoCalc * (doc.tasaIVA ?? 0.19));
  const totalCalc = netoCalc + ivaCalc + exentoCalc;

  return {
    logo_url: doc.emisor.logoUrl || "",
    logo_subtitle: "",
    tipo_doc_legible: "NOTA DE VENTA",
    numero_interno: doc.folio || "",
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
      contacto: (doc as any).receptor?.contacto || "",
      plazo_entrega: (doc as any).receptor?.plazo_entrega || "",
      vendedor: (doc as any).receptor?.vendedor || "",
      documento: (doc as any).receptor?.documento || "",
      f_entrega: (doc as any).receptor?.f_entrega || "",
      forma_pago: (doc as any).receptor?.forma_pago || "",
      moneda: (doc as any).receptor?.moneda || "Pesos",
      canal_venta: (doc as any).receptor?.canal_venta || "",
    },
    items,
    num_lineas: items.length,
    suma_cantidades,
    referencia_texto: (doc.referencias && doc.referencias.length) ? doc.referencias.join(" | ") : "",
    observaciones: doc.observaciones || "",
    subtotal: numberCL(doc.items.reduce((a, it) => a + it.precio * it.cantidad, 0)),
    descto_global_monto: numberCL(0),
    neto: numberCL(netoCalc),
    exento: numberCL(exentoCalc),
    iva: numberCL(ivaCalc),
    total: numberCL(totalCalc),
  };
}
