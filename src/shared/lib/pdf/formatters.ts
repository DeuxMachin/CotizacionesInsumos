/**
 * Utilidades de formateo para documentos PDF
 */

// Formateo de moneda chilena
export const formatCLP = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Formateo de números sin moneda
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('es-CL').format(num);
};

// Formateo de fecha
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Formateo de RUT chileno
export const formatRUT = (rut: string): string => {
  // Remover puntos y guiones existentes
  const cleanRUT = rut.replace(/[.-]/g, '');
  
  if (cleanRUT.length < 2) return rut;
  
  // Separar número y dígito verificador
  const numero = cleanRUT.slice(0, -1);
  const dv = cleanRUT.slice(-1);
  
  // Agregar puntos cada 3 dígitos
  const numeroFormateado = numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `${numeroFormateado}-${dv}`;
};

// Formateo de texto para múltiples líneas
export const formatMultilineText = (text: string, maxCharsPerLine: number = 80): string[] => {
  if (!text) return [];
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    
    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Palabra muy larga, cortarla
        lines.push(word.substring(0, maxCharsPerLine));
        currentLine = word.substring(maxCharsPerLine);
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
};

// Calcular IVA (19%)
export const calculateIVA = (amount: number): number => {
  return Math.round(amount * 0.19);
};

// Validar si el texto excede el espacio disponible
export const textFitsInSpace = (text: string, maxLines: number, maxCharsPerLine: number): boolean => {
  const lines = formatMultilineText(text, maxCharsPerLine);
  return lines.length <= maxLines;
};

// Truncar texto si es necesario
export const truncateText = (text: string, maxLines: number, maxCharsPerLine: number): string => {
  const lines = formatMultilineText(text, maxCharsPerLine);
  
  if (lines.length <= maxLines) {
    return text;
  }
  
  const truncatedLines = lines.slice(0, maxLines - 1);
  const lastLine = lines[maxLines - 1];
  
  if (lastLine.length > maxCharsPerLine - 3) {
    truncatedLines.push(lastLine.substring(0, maxCharsPerLine - 3) + '...');
  } else {
    truncatedLines.push(lastLine + '...');
  }
  
  return truncatedLines.join(' ');
};
