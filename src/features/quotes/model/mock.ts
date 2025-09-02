import { Quote } from "@/core/domain/quote/Quote";

// Mock data actualizado con la nueva estructura
export const quotesData: Quote[] = [
  {
    id: "COT-2024-001",
    numero: "2024-001",
    cliente: {
      razonSocial: "CONSTRUCTORA LARRAIN DOMINGUES SPA",
      rut: "76.459.290-5",
      nombreFantasia: "CONSTRUCTORA LDZ",
      giro: "CONSTRUCCION",
      direccion: "FLOR DE AZUSENAS 111 OF 61 LAS CONDES",
      ciudad: "Santiago",
      comuna: "Las Condes",
      telefono: "942683117",
      email: "contacto@constructoraldz.cl",
      nombreContacto: "GONZALO PARRA",
      telefonoContacto: "942683117"
    },
    fechaCreacion: "2024-08-29",
    fechaModificacion: "2024-08-29",
    estado: "borrador",
    vendedorId: "MARCO001",
    vendedorNombre: "MARCO PRADO",
    items: [
      {
        id: "item-001",
        codigo: "CEM-001",
        descripcion: "Cemento Portland 25kg",
        unidad: "Saco",
        cantidad: 100,
        precioUnitario: 8500,
        descuento: 5,
        subtotal: 807500
      }
    ],
    condicionesComerciales: {
      validezOferta: 30,
      formaPago: "30 días fecha factura",
      tiempoEntrega: "15 días hábiles",
      garantia: "6 meses por defectos de fabricación",
      observaciones: "Precios no incluyen IVA"
    },
    subtotal: 807500,
    descuentoTotal: 42500,
    iva: 153505,
    total: 961005,
    notas: "Cotización para obra nueva en Temuco",
    fechaExpiracion: "2024-09-28"
  }
];
