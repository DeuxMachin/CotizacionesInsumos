/**
 * Funcionalidad de generación/descarga de PDF para cotizaciones
 * Implementa estrategia de fondo rasterizado con coordenadas absolutas
 */

export { PDFDownloadButton, usePDFDownload } from './PDFDownloadButton';
export { generatePDF, generateQuoteHTML } from '@/shared/lib/pdf/generator';
export { formatCLP, formatDate, formatRUT } from '@/shared/lib/pdf/formatters';
export { QUOTE_COORDINATES, mmToPx, A4_WIDTH_MM, A4_HEIGHT_MM } from '@/shared/lib/pdf/coordinates';

// Función legacy mantenida para compatibilidad
export async function downloadServerDTE(): Promise<void> {
  if (typeof window !== "undefined") {
    console.warn("downloadServerDTE está deprecated. Use PDFDownloadButton o usePDFDownload en su lugar.");
    alert("Por favor use el nuevo sistema de descarga de PDF.");
  }
}

/**
 * Descarga el PDF de una cotización usando la API
 * @param id - ID de la cotización
 * @param inline - Si es verdadero, se abre una vista previa en lugar de descargar
 */
export async function downloadQuotePdf(id: string, inline: boolean = false) {
  try {
    if (typeof window === 'undefined') return;
    const url = `/api/pdf/cotizacion/${id}?${inline ? 'preview=true' : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error generando PDF');
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `cotizacion-${id}.pdf`;
    if (inline) {
      window.open(blobUrl, '_blank');
    } else {
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    setTimeout(()=>URL.revokeObjectURL(blobUrl), 5000);
  } catch (e) {
    alert('No se pudo descargar el PDF');
    console.error(e);
  }
}
