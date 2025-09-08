/**
 * Componente para descargar cotizaciones en PDF
 */

'use client';

import { useState } from 'react';
import { FiDownload, FiEye, FiLoader } from 'react-icons/fi';
import type { Quote } from '@/core/domain/quote/Quote';

interface PDFDownloadButtonProps {
  quote?: Quote | null;
  quoteId?: string;
  className?: string;
  showPreview?: boolean;
  children?: React.ReactNode;
}

export function PDFDownloadButton({ 
  quote, 
  quoteId, 
  className = '', 
  showPreview = true,
  children 
}: PDFDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (preview: boolean = false) => {
    setIsGenerating(true);
    setError(null);

    try {
      let url: string;
      let requestOptions: RequestInit = {
        method: 'GET',
      };

      if (quote) {
        // Si tenemos los datos de la cotización, usar POST
        url = `/api/pdf/cotizacion/generate${preview ? '?preview=true' : ''}`;
        requestOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(quote),
        };
      } else if (quoteId) {
        // Si solo tenemos el ID, usar GET
        url = `/api/pdf/cotizacion/${quoteId}${preview ? '?preview=true' : ''}`;
      } else {
        throw new Error('Se requiere quote o quoteId');
      }

      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar el PDF');
      }

      // Obtener el blob del PDF
      const blob = await response.blob();

      if (preview) {
        // Abrir en nueva pestaña para previsualización
        const pdfUrl = URL.createObjectURL(blob);
        window.open(pdfUrl, '_blank');
        
        // Limpiar URL después de un tiempo
        setTimeout(() => URL.revokeObjectURL(pdfUrl), 30000);
      } else {
        // Descargar archivo
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cotizacion-${quote?.numero || quoteId || 'nueva'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsGenerating(false);
    }
  };

  if (children) {
    // Si se proporcionan children, renderizar como wrapper
    return (
      <div className={className}>
        <div onClick={() => handleDownload(false)} style={{ cursor: isGenerating ? 'wait' : 'pointer' }}>
          {children}
        </div>
        {error && (
          <div className="text-red-500 text-sm mt-1">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Renderizado por defecto con botones
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={() => handleDownload(false)}
        disabled={isGenerating}
        className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        style={{ 
          opacity: isGenerating ? 0.7 : 1,
          cursor: isGenerating ? 'wait' : 'pointer'
        }}
      >
        {isGenerating ? (
          <FiLoader className="w-4 h-4 animate-spin" />
        ) : (
          <FiDownload className="w-4 h-4" />
        )}
        {isGenerating ? 'Generando...' : 'Descargar PDF'}
      </button>

      {showPreview && (
        <button
          onClick={() => handleDownload(true)}
          disabled={isGenerating}
          className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm"
          style={{ 
            opacity: isGenerating ? 0.7 : 1,
            cursor: isGenerating ? 'wait' : 'pointer'
          }}
        >
          <FiEye className="w-4 h-4" />
          Previsualizar
        </button>
      )}

      {error && (
        <div className="text-red-500 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * Hook para usar la funcionalidad de descarga de PDF
 */
export function usePDFDownload() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadPDF = async (quote: Quote, preview: boolean = false) => {
    setIsGenerating(true);
    setError(null);

    try {
      const url = `/api/pdf/cotizacion/generate${preview ? '?preview=true' : ''}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quote),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar el PDF');
      }

      const blob = await response.blob();

      if (preview) {
        const pdfUrl = URL.createObjectURL(blob);
        window.open(pdfUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(pdfUrl), 30000);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cotizacion-${quote.numero || 'nueva'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      return true;
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    downloadPDF,
    isGenerating,
    error,
    clearError: () => setError(null)
  };
}
