/**
 * Generador principal de PDF para cotizaciones
 * Implementa la estrategia de fondo rasterizado con coordenadas absolutas
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import type { Quote } from '@/core/domain/quote/Quote';
import {  A4_WIDTH_PX, A4_HEIGHT_PX, FONTS } from './coordinates';
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
export function generateQuoteHTML(quote: Quote, _backgroundImagePath?: string  ): string {
  // Legacy absolute template removed; always use condensed template for now.
  const quoteNumber = quote.numero || `COT-${Date.now()}`;
  const quoteDate = quote.fechaCreacion ? new Date(quote.fechaCreacion) : new Date();
  return generateCondensedHTML(quote, quoteNumber, quoteDate);
}

/**
 * Nueva plantilla condensada: todo cabe en una página A4.
 */
function generateCondensedHTML(quote: Quote, quoteNumber: string, quoteDate: Date): string {
  const { cliente, items, condicionesComerciales, notas, despacho } = quote;


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
                // Nota: QuoteItem no expone afecto_iva aún; si en el futuro se agrega, usar it.afectoIva ? 'AFECTO' : 'EXENTO'
                `<td style=\"text-align:center;\">AFECTO</td>`+
                `<td style=\"text-align:right;\">${formatCLP(it.subtotal)}</td>`+
              `</tr>`).join('')}
          </tbody>
        </table>
        ${omitted>0?`<div class=\"omitted\">Se omitieron ${omitted} ítems por límite de una página.</div>`:''}
      </div>
      <table class="totals-table">
        <tr><td style="text-align:right;">Subtotal:</td><td style="text-align:right;">${formatCLP(quote.subtotal + (quote.descuentoLineasMonto||0) + (quote.descuentoGlobalMonto||0))}</td></tr>
        ${(quote.descuentoLineasMonto||0)>0?`<tr><td style=\"text-align:right;\">Dcto. líneas:</td><td style=\"text-align:right;\">-${formatCLP(quote.descuentoLineasMonto||0)}</td></tr>`:''}
        ${(quote.descuentoGlobalMonto||0)>0?`<tr><td style=\"text-align:right;\">Dcto. global:</td><td style=\"text-align:right;\">-${formatCLP(quote.descuentoGlobalMonto||0)}</td></tr>`:''}
        <tr><td style="text-align:right;">Neto afecto:</td><td style="text-align:right;">${formatCLP(quote.subtotal)}</td></tr>
        <tr><td style="text-align:right;">Monto exento:</td><td style="text-align:right;">$ 0</td></tr>
        <tr><td style="text-align:right;">IVA (19%):</td><td style="text-align:right;">${formatCLP(quote.iva)}</td></tr>
        <tr class="total"><td style="text-align:right;">Total:</td><td style="text-align:right;">${formatCLP(quote.total)}</td></tr>
      </table>
  <div class="refs-box"><span class="label">Referencias:</span><br>${condicionesComerciales?.observaciones||'-'}</div>
      <div class="notes-box"><span class="label">Observaciones generales:</span><br>${notesLines.length?notesLines.join('<br>'):'—'}</div>
      <div class="foot">Documento generado electrónicamente. Valores en CLP. Validez ${condicionesComerciales?.validezOferta||'-'} días.</div>
    </div></body></html>`;
}






/**
 * Genera PDF usando Puppeteer
 */
export async function generatePDF(
  quote: Quote, 
  backgroundImagePath?: string,
  options: PDFGenerationOptions = DEFAULT_PDF_OPTIONS
): Promise<Buffer> {
  const html = generateQuoteHTML(quote, backgroundImagePath);
  
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
  try {
    // Configuración para producción vs desarrollo
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Estrategia robusta multi-entorno:
    // 1) Intentar con Chrome instalado del sistema (canal 'chrome') si no estamos en serverless
    // 2) Intentar con Chromium descargado por puppeteer en postinstall
    // 3) En producción/serverless, intentar con @sparticuz/chromium

    // Preferimos headless por defecto
    const commonArgs = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--hide-scrollbars'];

    // 1) Chrome canal
    if (!browser) {
      try {
        browser = await puppeteer.launch({
          headless: true,
          channel: 'chrome',
          args: commonArgs,
        });
      } catch {}
    }

    // 2) Chromium descargado por puppeteer
    if (!browser) {
      try {
        browser = await puppeteer.launch({
          headless: true,
          args: commonArgs,
        });
      } catch {}
    }

    // 3) Serverless: @sparticuz/chromium
    if (!browser) {
      try {
        const chromium = await import('@sparticuz/chromium');
        const executablePath = await chromium.default.executablePath();
        browser = await puppeteer.launch({
          headless: true,
          args: commonArgs,
          executablePath,
          defaultViewport: { width: 1920, height: 1080 },
        });
      } catch (e) {
        console.warn('Falling back failed for @sparticuz/chromium as well:', e);
      }
    }

    if (!browser) {
      throw new Error('No se pudo iniciar un navegador para generar el PDF. Verifique instalación de Puppeteer/Chrome.');
    }
    
    const page = await browser.newPage();
    
    // Configurar viewport: si condensed usamos dimensiones CSS aproximadas (96dpi) para A4
  if (options.condensed !== false) { // still honor viewport sizing path; condensed always true currently
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
    
    // Listeners para depuración (ayuda a detectar cuelgues)
    page.on('pageerror', (err) => console.error('[PDF][pageerror]', err));
    page.on('console', (msg) => {
      const type = msg.type();
      if (['error', 'warning'].includes(type)) {
        console[type === 'error' ? 'error' : 'warn']('[PDF][console]', msg.text());
      }
    });

    // Cargar contenido HTML. Evitamos 'networkidle0' (puede no resolverse si hay listeners abiertos)
    // porque todo el HTML es inline. Esto reduce riesgos de timeout.
    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

    // Forzar media screen para que respeten estilos @media print/screen si existen
    try { await page.emulateMediaType('screen'); } catch {}

    // Pequeña espera opcional para asegurar layout estable (fuentes / render)
  // Espera micro (100ms) para asegurar cálculo de layout; usamos evaluate + setTimeout para evitar dependencias de métodos no tipados
  await page.evaluate(() => new Promise(res => setTimeout(res, 100)));
    
    // Generar PDF
  // Aumentamos timeout de operación de PDF si el entorno es lento
  page.setDefaultTimeout(45000);

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
      try { await browser.close(); } catch {}
    }
  }
}
