/**
 * Generador principal de PDF para cotizaciones
 * Implementa la estrategia de fondo rasterizado con coordenadas absolutas
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import type { Quote } from '@/core/domain/quote/Quote';
import { QUOTE_COORDINATES, A4_WIDTH_PX, A4_HEIGHT_PX, createAbsoluteStyle, FONTS } from './coordinates';
import { formatCLP, formatDate, formatRUT, formatMultilineText } from './formatters';

export interface PDFGenerationOptions {
  format?: 'A4';
  margin?: { top: string; right: string; bottom: string; left: string };
  printBackground?: boolean;
  displayHeaderFooter?: boolean;
  preferCSSPageSize?: boolean;
  /** Usa la plantilla condensada de una sola página (recomendado) */
  condensed?: boolean;
}

const DEFAULT_PDF_OPTIONS: PDFGenerationOptions = {
  format: 'A4',
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
  printBackground: true,
  displayHeaderFooter: false,
  preferCSSPageSize: true,
};

// Cache del logo real para evitar lecturas repetidas
let CACHED_LOGO_SVG: string | null = null;
function getCompanyLogoSVG(): string {
  if (CACHED_LOGO_SVG) return CACHED_LOGO_SVG;
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.svg');
    const raw = fs.readFileSync(logoPath, 'utf8');
    // Asegurar que tenga viewBox y no se inyecten scripts (sanitizado simple)
    const sanitized = raw
      .replace(/<\?xml[^>]*>/g, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '');
    CACHED_LOGO_SVG = sanitized;
    return CACHED_LOGO_SVG;
  } catch (e) {
    console.warn('No se pudo cargar logo.svg, usando placeholder', e);
    CACHED_LOGO_SVG = '<div style="font:700 14px Arial; color:#ff5600">PORTAL VENTAS</div>';
    return CACHED_LOGO_SVG;
  }
}

const COMPANY_STATIC_INFO = {
  line1: 'INSUMOS DE CONSTRUCCION Y SERVICIOS DE VENTA',
  line2: 'OLGA ESTER LEAL LEAL E.I.R.L.',
  rut: '76.309.629-7',
  giro: 'VTA.INSUM.CONST/ COM.EN VTA/ PREST.SERV.PROF/ ASESORIA VENTAS',
  direccion: 'BELGRADO 699, Temuco',
  email: 'cobranza@miportalventas.cl',
  telefonos: '+56 9 77497459'
};

/**
 * Genera el HTML para la cotización. Si condensed=true usa la plantilla de una sola página.
 */
export function generateQuoteHTML(quote: Quote, backgroundImagePath?: string, condensed: boolean = true): string {
  const quoteNumber = quote.numero || `COT-${Date.now()}`;
  const quoteDate = quote.fechaCreacion ? new Date(quote.fechaCreacion) : new Date();
  return condensed
    ? generateCondensedHTML(quote, quoteNumber, quoteDate)
    : generateLegacyAbsoluteHTML(quote, quoteNumber, quoteDate, backgroundImagePath || '');
}

/**
 * Nueva plantilla condensada: todo cabe en una página A4.
 */
function generateCondensedHTML(quote: Quote, quoteNumber: string, quoteDate: Date): string {
  const { cliente, items, condicionesComerciales, notas, despacho } = quote;

  // Área disponible aprox para tabla (restando header + cliente + totales + condiciones)
  const PAGE_HEIGHT = A4_HEIGHT_PX; // total px a 300dpi (≈ 2480px) – pero trabajaremos en escala CSS 96dpi equivalente para HTML (CONVERSIÓN)
  // En condensed simplificamos usando 96dpi: transform scale para asegurar 1:1 en PDF.

  // Ajuste dinámico de tamaño de fuente y altura de fila según número de items
  const baseFont = 11; // px
  const baseRowHeight = 20; // px
  const maxVisualRows = 26; // objetivo para que quepa sin overflow
  let fontSize = baseFont;
  let rowHeight = baseRowHeight;
  let shownItems = items;
  let omitted = 0;

  if (items.length > maxVisualRows) {
    // Reducir tipografía y altura progresivamente
    if (items.length <= 32) {
      fontSize = 10; rowHeight = 18;
    } else if (items.length <= 38) {
      fontSize = 9; rowHeight = 16;
    } else if (items.length <= 44) {
      fontSize = 8; rowHeight = 14;
    } else {
      fontSize = 8; rowHeight = 14; // truncar
      const capacity = 44;
      shownItems = items.slice(0, capacity);
      omitted = items.length - capacity;
    }
  }

  const termsLines: string[] = [];
  if (condicionesComerciales?.validezOferta) termsLines.push(`Validez: ${condicionesComerciales.validezOferta} días`);
  if (condicionesComerciales?.formaPago) termsLines.push(`Pago: ${condicionesComerciales.formaPago}`);
  if (condicionesComerciales?.tiempoEntrega) termsLines.push(`Entrega: ${condicionesComerciales.tiempoEntrega}`);
  if (condicionesComerciales?.garantia) termsLines.push(`Garantía: ${condicionesComerciales.garantia}`);

  const notesLines = notas ? formatMultilineText(notas, 110).slice(0, 6) : [];

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8" />
    <title>Cotización ${quoteNumber}</title>
    <style>
      @page { size: A4 portrait; margin:0; }
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:${FONTS.primary.family}; font-size:${fontSize}px; color:#111; -webkit-print-color-adjust:exact;}
      .page{max-width:210mm;margin:0 auto;padding:10mm 12mm 10mm 12mm;display:flex;flex-direction:column;}
      table{width:100%;border-collapse:collapse;}
      thead th{background:#e4e8ea;font-weight:600;font-size:${fontSize-1}px;padding:3px 4px;text-align:left;border:0.5px solid #9fa3a6;}
      tbody td{border:0.5px solid #bfc3c6;padding:2px 4px;line-height:1.15;vertical-align:top;}
  .header{display:flex;align-items:flex-start;gap:5mm;}
  .emision-date{text-align:right;font-size:${fontSize-1}px;margin-top:2mm;}
  .logo-box{display:flex;align-items:flex-start;justify-content:flex-start;max-width:55mm;padding-top:2mm;}
  .logo-box svg{height:12mm;width:auto;overflow:visible;}
  .logo-box img{height:12mm;width:auto;display:block;}
  .company-block{flex:1;transform:translateY(-1mm);} /* sube texto para alinear con parte superior del logo */
      .company-block{flex:1;}
      .company-block div{line-height:1.15;}
      .company-name{font-weight:700;}
      .company-line1{font-weight:600; color:#ff5600;}
      .doc-type{min-width:50mm;border:1px solid #000;padding:6px 8px;display:flex;flex-direction:column;gap:4px;align-items:center;justify-content:center;font-weight:700;font-size:${fontSize+2}px;}
      .doc-number{font-size:${fontSize+1}px;}
  .client-box{border:1px solid #000;margin-top:2mm;padding:6mm 5mm 3mm 5mm;position:relative;}
  .client-grid{width:100%;font-size:${fontSize}px;border-collapse:collapse;}
  .client-grid td{padding:2px 4px;border:none;}
      .items-wrapper{margin-top:4mm;}
      .totals-table{margin-top:4mm;margin-left:auto;width:60mm;font-size:${fontSize}px;}
      .totals-table td{padding:2px 4px;border:none;}
      .totals-table tr.total td{border-top:1px solid #000;font-weight:700;padding-top:3px;}
      .refs-box, .notes-box{border:1px solid #000;margin-top:5mm;padding:3mm 3mm 2mm 3mm;}
      .refs-box .label, .notes-box .label{font-weight:700;}
      .foot{font-size:${fontSize-2}px;color:#555;margin-top:6mm;}
      .omitted{color:#aa0000;font-size:${fontSize-2}px;margin-top:2mm;}
    </style></head><body><div class="page">
      <div class="header">
  <div class="logo-box">${getCompanyLogoSVG()}</div>
        <div class="company-block">
          <div class="company-line1">${COMPANY_STATIC_INFO.line1}</div>
          <div class="company-name">${COMPANY_STATIC_INFO.line2}</div>
          <div>R.U.T: ${COMPANY_STATIC_INFO.rut}</div>
          <div>${COMPANY_STATIC_INFO.giro}</div>
          <div>Dirección: ${COMPANY_STATIC_INFO.direccion}</div>
          <div>Email: ${COMPANY_STATIC_INFO.email}</div>
          <div>Teléfono(s): ${COMPANY_STATIC_INFO.telefonos}</div>
        </div>
        <div class="doc-type">
          <div>NOTA DE VENTA</div>
          <div class="doc-number">N° ${quoteNumber}</div>
        </div>
      </div>
  <div class="emision-date"><strong>Fecha emisión:</strong> ${formatDate(quoteDate)}</div>
  <div class="client-box">
        <table class="client-grid">
          <tr>
            <td style="width:35%;"><strong>Señor(es):</strong></td><td style="width:40%;">${cliente.razonSocial||''}</td>
            <td style="width:12%;"><strong>RUT:</strong></td><td>${formatRUT(cliente.rut||'')}</td>
          </tr>
          <tr>
            <td><strong>Dirección:</strong></td><td>${[cliente.direccion, cliente.comuna, cliente.ciudad].filter(Boolean).join(', ')}</td>
            <td><strong>Comuna:</strong></td><td>${cliente.comuna||''}</td>
          </tr>
          <tr>
            <td><strong>Giro:</strong></td><td>${cliente.giro||''}</td>
            <td><strong>Ciudad:</strong></td><td>${cliente.ciudad||''}</td>
          </tr>
          <tr>
            <td><strong>Plazo entrega:</strong></td><td>${despacho?.fechaEstimada?formatDate(new Date(despacho.fechaEstimada)):'-'}</td>
            <td><strong>F. Emisión:</strong></td><td>${formatDate(quoteDate)}</td>
          </tr>
          <tr>
            <td><strong>Vendedor:</strong></td><td>${quote.vendedorNombre||'—'}</td>
            <td><strong>F. Entrega:</strong></td><td>${despacho?.fechaEstimada?formatDate(new Date(despacho.fechaEstimada)):'-'}</td>
          </tr>
          <tr>
            <td><strong>Documento:</strong></td><td>FACTURA ELECTRÓNICA</td>
            <td><strong>Forma pago:</strong></td><td>${condicionesComerciales?.formaPago||'-'}</td>
          </tr>
          <tr>
            <td><strong>Moneda:</strong></td><td>Pesos</td>
            <td><strong>&nbsp;</strong></td><td>&nbsp;</td>
          </tr>
        </table>
      </div>
      <div class="items-wrapper">
        <table>
          <thead>
            <tr>
              <th style="width:14%;">Código</th>
              <th style="width:42%;">Descripción</th>
              <th style="width:7%;text-align:center;">Cant.</th>
              <th style="width:11%;text-align:right;">Precio</th>
              <th style="width:8%;text-align:center;">Dscto(%)</th>
              <th style="width:8%;text-align:center;">A/F</th>
              <th style="width:10%;text-align:right;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${shownItems.map(it=>`<tr style="height:${rowHeight}px;">`+
                `<td>${it.codigo||''}</td>`+
                `<td>${it.descripcion}</td>`+
                `<td style=\"text-align:center;\">${it.cantidad}</td>`+
                `<td style=\"text-align:right;\">${formatCLP(it.precioUnitario)}</td>`+
                `<td style=\"text-align:center;\">${it.descuento?it.descuento:'-'}</td>`+
                `<td style=\"text-align:center;\">AFECTO</td>`+
                `<td style=\"text-align:right;\">${formatCLP(it.subtotal)}</td>`+
              `</tr>`).join('')}
          </tbody>
        </table>
        ${omitted>0?`<div class=\"omitted\">Se omitieron ${omitted} ítems por límite de una página.</div>`:''}
      </div>
      <table class="totals-table">
        <tr><td style="text-align:right;">Subtotal:</td><td style="text-align:right;">${formatCLP(quote.subtotal)}</td></tr>
        ${quote.descuentoTotal>0?`<tr><td style=\"text-align:right;\">Dcto. global:</td><td style=\"text-align:right;\">-${formatCLP(quote.descuentoTotal)}</td></tr>`:''}
        <tr><td style="text-align:right;">Monto neto:</td><td style="text-align:right;">${formatCLP(quote.subtotal - (quote.descuentoTotal||0))}</td></tr>
        <tr><td style="text-align:right;">Monto exento:</td><td style="text-align:right;">$ 0</td></tr>
        <tr><td style="text-align:right;">IVA (19%):</td><td style="text-align:right;">${formatCLP(quote.iva)}</td></tr>
        <tr class="total"><td style="text-align:right;">Total:</td><td style="text-align:right;">${formatCLP(quote.total)}</td></tr>
      </table>
  <div class="refs-box"><span class="label">Referencias:</span><br>${condicionesComerciales?.observaciones||'-'}</div>
      <div class="notes-box"><span class="label">Observaciones generales:</span><br>${notesLines.length?notesLines.join('<br>'):'—'}</div>
      <div class="foot">Documento generado electrónicamente. Valores en CLP. Validez ${condicionesComerciales?.validezOferta||'-'} días.</div>
    </div></body></html>`;
}

/** Plantilla anterior absoluta (legacy) por si se requiere fondo rasterizado. */
function generateLegacyAbsoluteHTML(quote: Quote, quoteNumber: string, quoteDate: Date, backgroundImagePath: string){
  const { cliente, items, despacho, condicionesComerciales, notas } = quote;
  return `<!DOCTYPE html><html><head><meta charset='utf-8'><style>body{margin:0;font-family:${FONTS.primary.family};font-size:${FONTS.primary.size.normal};background:url('${backgroundImagePath}') no-repeat 0 0/ ${A4_WIDTH_PX}px ${A4_HEIGHT_PX}px;width:${A4_WIDTH_PX}px;height:${A4_HEIGHT_PX}px;position:relative;} .absolute-element{position:absolute;font-size:10px;}</style></head><body>${generateQuoteContent(quote, quoteNumber, quoteDate)}</body></html>`;
}

/**
 * Genera el contenido principal de la cotización
 */
function generateQuoteContent(quote: Quote, quoteNumber: string, quoteDate: Date): string {
  const { cliente, items, despacho, condicionesComerciales, notas } = quote;
  
  return `
    <!-- Número de cotización -->
    <div class="absolute-element font-bold text-large" style="${createStyleString(QUOTE_COORDINATES.quoteNumber)}">
      Cotización N° ${quoteNumber}
    </div>
    
    <!-- Fecha -->
    <div class="absolute-element text-right" style="${createStyleString(QUOTE_COORDINATES.quoteDate)}">
      Fecha: ${formatDate(quoteDate)}
      ${quote.fechaExpiracion ? `<br>Válida hasta: ${formatDate(quote.fechaExpiracion)}` : ''}
    </div>
    
    <!-- Información del cliente -->
    <div class="absolute-element" style="${createStyleString(QUOTE_COORDINATES.clientInfo)}">
      <div class="font-bold text-large">${cliente.razonSocial}</div>
      ${cliente.nombreFantasia ? `<div>${cliente.nombreFantasia}</div>` : ''}
      <div>RUT: ${formatRUT(cliente.rut)}</div>
      ${cliente.giro ? `<div>Giro: ${cliente.giro}</div>` : ''}
      ${cliente.direccion ? `<div>Dirección: ${cliente.direccion}</div>` : ''}
      ${cliente.comuna || cliente.ciudad ? `<div>${[cliente.comuna, cliente.ciudad].filter(Boolean).join(', ')}</div>` : ''}
      ${cliente.telefono ? `<div>Teléfono: ${cliente.telefono}</div>` : ''}
      ${cliente.email ? `<div>Email: ${cliente.email}</div>` : ''}
    </div>
    
    <!-- Tabla de productos -->
    ${generateProductsTable(items)}
    
    <!-- Totales -->
    ${generateTotalsSection(quote)}
    
    <!-- Condiciones comerciales -->
    ${generateTermsSection(condicionesComerciales)}
    
    <!-- Notas -->
    ${notas ? generateNotesSection(notas) : ''}
  `;
}

/**
 * Genera la tabla de productos
 */
function generateProductsTable(items: Quote['items']): string {
  const { x, y, width, headerHeight, rowHeight, maxRows } = QUOTE_COORDINATES.productsTable;
  
  // Calcular si necesitamos paginación
  const itemsToShow = items.slice(0, maxRows);
  const hasMoreItems = items.length > maxRows;
  
  let tableHTML = `
    <div class="absolute-element" style="${createStyleString({ x, y, width, height: headerHeight + (itemsToShow.length * rowHeight) + (hasMoreItems ? rowHeight : 0) })}">
      <table>
  `;
  
  // Encabezados (opcional si ya están en el fondo)
  // tableHTML += `
  //   <thead>
  //     <tr style="height: ${headerHeight}px;">
  //       <th style="width: 40%;">Descripción</th>
  //       <th style="width: 15%;">Cantidad</th>
  //       <th style="width: 20%;">Precio Unit.</th>
  //       <th style="width: 10%;">Desc.</th>
  //       <th style="width: 15%;">Subtotal</th>
  //     </tr>
  //   </thead>
  // `;
  
  // Filas de productos
  tableHTML += '<tbody>';
  
  itemsToShow.forEach((item, index) => {
    const precio = item.descuento ? 
      item.precioUnitario * (1 - item.descuento / 100) : 
      item.precioUnitario;
    
    tableHTML += `
      <tr style="height: ${rowHeight}px;">
        <td style="width: 40%;">${item.descripcion}</td>
        <td style="width: 15%; text-align: center;">${item.cantidad} ${item.unidad}</td>
        <td style="width: 20%; text-align: right;">${formatCLP(item.precioUnitario)}</td>
        <td style="width: 10%; text-align: center;">${item.descuento ? `${item.descuento}%` : '-'}</td>
        <td style="width: 15%; text-align: right;">${formatCLP(item.subtotal)}</td>
      </tr>
    `;
  });
  
  // Si hay más items, mostrar indicador
  if (hasMoreItems) {
    tableHTML += `
      <tr style="height: ${rowHeight}px;">
        <td colspan="5" style="text-align: center; font-style: italic;">
          ... y ${items.length - maxRows} productos más (ver páginas siguientes)
        </td>
      </tr>
    `;
  }
  
  tableHTML += '</tbody></table></div>';
  
  return tableHTML;
}

/**
 * Genera la sección de totales
 */
function generateTotalsSection(quote: Quote): string {
  const style = createStyleString(QUOTE_COORDINATES.totals);
  
  return `
    <div class="absolute-element" style="${style}">
      <div class="text-right">
        <div>Subtotal: ${formatCLP(quote.subtotal)}</div>
        ${quote.descuentoTotal > 0 ? `<div>Descuento: -${formatCLP(quote.descuentoTotal)}</div>` : ''}
        ${quote.despacho?.costoDespacho ? `<div>Despacho: ${formatCLP(quote.despacho.costoDespacho)}</div>` : ''}
        <div>IVA (19%): ${formatCLP(quote.iva)}</div>
        <div class="font-bold text-large">TOTAL: ${formatCLP(quote.total)}</div>
      </div>
    </div>
  `;
}

/**
 * Genera la sección de condiciones comerciales
 */
function generateTermsSection(terms: Quote['condicionesComerciales']): string {
  if (!terms || Object.keys(terms).length === 0) return '';
  
  const style = createStyleString(QUOTE_COORDINATES.terms);
  
  let content = '<div class="font-bold">Condiciones Comerciales:</div>';
  
  if (terms.validezOferta) {
    content += `<div>• Válida por ${terms.validezOferta} días</div>`;
  }
  
  if (terms.formaPago) {
    content += `<div>• Forma de pago: ${terms.formaPago}</div>`;
  }
  
  if (terms.tiempoEntrega) {
    content += `<div>• Tiempo de entrega: ${terms.tiempoEntrega}</div>`;
  }
  
  if (terms.garantia) {
    content += `<div>• Garantía: ${terms.garantia}</div>`;
  }
  
  return `<div class="absolute-element text-small" style="${style}">${content}</div>`;
}

/**
 * Genera la sección de notas
 */
function generateNotesSection(notas: string): string {
  const style = createStyleString(QUOTE_COORDINATES.notes);
  const lines = formatMultilineText(notas, 100);
  const content = lines.slice(0, 5).join('<br>'); // Máximo 5 líneas
  
  return `
    <div class="absolute-element text-small" style="${style}">
      <div class="font-bold">Notas:</div>
      <div>${content}</div>
    </div>
  `;
}

/**
 * Convierte un objeto de estilo a string CSS
 */
function createStyleString(coords: { x: number; y: number; width?: number; height?: number }): string {
  const { x, y, width, height } = coords;
  const style = createAbsoluteStyle(x, y, width, height);
  
  return Object.entries(style)
    .map(([key, value]) => `${key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)}: ${value}`)
    .join('; ');
}

/**
 * Genera PDF usando Puppeteer
 */
export async function generatePDF(
  quote: Quote, 
  backgroundImagePath?: string,
  options: PDFGenerationOptions = DEFAULT_PDF_OPTIONS
): Promise<Buffer> {
  const html = generateQuoteHTML(quote, backgroundImagePath, options.condensed !== false);
  
  let browser;
  try {
    // Configuración para producción vs desarrollo
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      try {
        // Usar @sparticuz/chromium para serverless
        const chromium = await import('@sparticuz/chromium');
        const executablePath = await chromium.default.executablePath();
        
        browser = await puppeteer.launch({
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--hide-scrollbars'],
          defaultViewport: { width: 1920, height: 1080 },
          executablePath,
          headless: true,
        });
      } catch (chromiumError) {
        console.warn('Failed to use @sparticuz/chromium, falling back to local puppeteer');
        browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
        });
      }
    } else {
      // Usar Puppeteer local para desarrollo
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
      });
    }
    
    const page = await browser.newPage();
    
    // Configurar viewport: si condensed usamos dimensiones CSS aproximadas (96dpi) para A4
    if (options.condensed !== false) {
      const MM_TO_PX = 96/25.4;
      await page.setViewport({
        width: Math.round(210 * MM_TO_PX),
        height: Math.round(297 * MM_TO_PX),
        deviceScaleFactor: 1,
      });
    } else {
      await page.setViewport({
        width: A4_WIDTH_PX,
        height: A4_HEIGHT_PX,
        deviceScaleFactor: 1,
      });
    }
    
    // Cargar contenido HTML
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Generar PDF
    const pdfBuffer = await page.pdf({
      format: options.format,
      margin: options.margin,
      printBackground: options.printBackground,
      displayHeaderFooter: options.displayHeaderFooter,
      preferCSSPageSize: true,
      ...(options.condensed === false ? { width: `${A4_WIDTH_PX}px`, height: `${A4_HEIGHT_PX}px` } : {})
    });
    
    return Buffer.from(pdfBuffer);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
