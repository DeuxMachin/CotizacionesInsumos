/**
 * Utilidades para conversión de coordenadas mm a px para PDF generation
 * Basado en A4 (210 x 297 mm) a 300 DPI para máxima calidad
 */

// Constantes A4
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const PDF_DPI = 300;
export const BROWSER_DPI = 96;

// Conversión mm a píxeles para PDF (300 DPI)
export const mmToPx = (mm: number): number => {
  return Math.round((mm * PDF_DPI) / 25.4);
};

// Conversión píxeles a mm
export const pxToMm = (px: number): number => {
  return (px * 25.4) / PDF_DPI;
};

// Dimensiones A4 en píxeles a 300 DPI
export const A4_WIDTH_PX = mmToPx(A4_WIDTH_MM);
export const A4_HEIGHT_PX = mmToPx(A4_HEIGHT_MM);

// Coordenadas base para cotización (ajustar según el documento de referencia)
export const QUOTE_COORDINATES = {
  // Logo y encabezado
  logo: {
    x: mmToPx(15),
    y: mmToPx(15),
    width: mmToPx(40),
    height: mmToPx(20)
  },
  
  // Información de la empresa
  companyInfo: {
    x: mmToPx(120),
    y: mmToPx(15),
    width: mmToPx(75),
    height: mmToPx(30)
  },
  
  // Número de cotización y fecha
  quoteNumber: {
    x: mmToPx(15),
    y: mmToPx(45),
    width: mmToPx(60),
    height: mmToPx(8)
  },
  
  quoteDate: {
    x: mmToPx(120),
    y: mmToPx(45),
    width: mmToPx(75),
    height: mmToPx(8)
  },
  
  // Información del cliente
  clientInfo: {
    x: mmToPx(15),
    y: mmToPx(60),
    width: mmToPx(180),
    height: mmToPx(35)
  },
  
  // Tabla de productos
  productsTable: {
    x: mmToPx(15),
    y: mmToPx(100),
    width: mmToPx(180),
    headerHeight: mmToPx(8),
    rowHeight: mmToPx(6),
    maxRows: 25 // Máximo de filas por página
  },
  
  // Totales
  totals: {
    x: mmToPx(120),
    y: mmToPx(220),
    width: mmToPx(75),
    height: mmToPx(40)
  },
  
  // Condiciones comerciales
  terms: {
    x: mmToPx(15),
    y: mmToPx(220),
    width: mmToPx(100),
    height: mmToPx(40)
  },
  
  // Notas
  notes: {
    x: mmToPx(15),
    y: mmToPx(265),
    width: mmToPx(180),
    height: mmToPx(20)
  }
};

// Configuración de fuentes
export const FONTS = {
  primary: {
    family: 'Arial, sans-serif',
    size: {
      small: '9px',
      normal: '10px',
      medium: '11px',
      large: '12px',
      title: '14px'
    }
  }
};

// Estilos base para elementos posicionados absolutamente
export const createAbsoluteStyle = (
  x: number, 
  y: number, 
  width?: number, 
  height?: number,
  fontSize: string = FONTS.primary.size.normal
) => ({
  position: 'absolute' as const,
  left: `${x}px`,
  top: `${y}px`,
  width: width ? `${width}px` : 'auto',
  height: height ? `${height}px` : 'auto',
  fontSize,
  fontFamily: FONTS.primary.family,
  margin: 0,
  padding: 0,
  lineHeight: '1.2',
  color: '#000000'
});
