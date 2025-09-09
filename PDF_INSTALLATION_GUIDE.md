# Sistema de Generación de PDF para Cotizaciones

## Instalación Completada

Se ha implementado un sistema completo de generación de PDF para cotizaciones usando la estrategia de **fondo rasterizado con coordenadas absolutas**.

### Dependencias Instaladas

```bash
npm install @sparticuz/chromium sharp puppeteer handlebars
```

### Archivos Creados

#### 1. Core del Sistema PDF
- `src/shared/lib/pdf/coordinates.ts` - Sistema de coordenadas y conversiones mm→px
- `src/shared/lib/pdf/formatters.ts` - Utilidades de formateo (CLP, fechas, RUT)
- `src/shared/lib/pdf/generator.ts` - Generador principal de PDF con Puppeteer
- `src/shared/lib/pdf/background.ts` - Convertidor SVG→PNG para fondos

#### 2. API Routes
- `src/app/api/pdf/cotizacion/[id]/route.ts` - Generar PDF por ID de cotización
- `src/app/api/pdf/cotizacion/generate/route.ts` - Generar PDF desde datos POST

#### 3. Componentes UI
- `src/features/reports/ui/pdf/PDFDownloadButton.tsx` - Botón de descarga con preview
- `src/features/reports/ui/pdf/index.ts` - Exportaciones principales

#### 4. Templates
- `public/pdf-backgrounds/cotizacion-template.svg` - Template base (placeholder)

## Uso del Sistema

### 1. En Componentes React

```tsx
import { PDFDownloadButton } from '@/features/reports/ui/pdf/PDFDownloadButton';

// Con datos de cotización completa
<PDFDownloadButton 
  quote={quoteData} 
  showPreview={true}
  className="w-full"
/>

// Solo con ID de cotización (para cotizaciones guardadas)
<PDFDownloadButton 
  quoteId="12345" 
  showPreview={true}
/>
```

### 2. Con Hook personalizado

```tsx
import { usePDFDownload } from '@/features/reports/ui/pdf/PDFDownloadButton';

function MyComponent() {
  const { downloadPDF, isGenerating, error } = usePDFDownload();
  
  const handleDownload = async () => {
    const success = await downloadPDF(quoteData, false); // false = descarga, true = preview
    if (success) {
      console.log('PDF descargado correctamente');
    }
  };
}
```

### 3. API Directa

```javascript
// Generar desde datos POST
const response = await fetch('/api/pdf/cotizacion/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(quoteData)
});

// Generar desde ID guardado
const response = await fetch('/api/pdf/cotizacion/123');
```

## Configuración del Template

### Coordenadas Personalizables

Edita `src/shared/lib/pdf/coordinates.ts` para ajustar posiciones:

```typescript
export const QUOTE_COORDINATES = {
  logo: { x: mmToPx(15), y: mmToPx(15), width: mmToPx(40), height: mmToPx(20) },
  clientInfo: { x: mmToPx(15), y: mmToPx(60), width: mmToPx(180), height: mmToPx(35) },
  // ... más coordenadas
};
```

### Reemplazar Template de Fondo

1. **Opción Recomendada**: Convertir PDF existente a PNG
   ```bash
   # Usar herramienta externa como ImageMagick o Adobe
   # Convertir cada página a PNG 300 DPI
   convert documento.pdf -density 300 template.png
   ```

2. **Opción Actual**: Modificar SVG en `public/pdf-backgrounds/cotizacion-template.svg`

### Variables de Entorno

```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Para desarrollo
# NEXT_PUBLIC_BASE_URL=https://tu-dominio.com  # Para producción
```

## Características del Sistema

### ✅ Ventajas Implementadas

1. **Fidelidad Pixel-Perfect**: Fondo rasterizado garantiza diseño exacto
2. **Coordenadas Absolutas**: Eliminan problemas de layout fluido
3. **Múltiples Navegadores**: Puppeteer asegura consistencia
4. **Serverless Ready**: Compatible con @sparticuz/chromium
5. **Paginación**: Manejo automático de productos que excedan una página
6. **Previsualización**: Opción de ver PDF en navegador antes de descargar
7. **Formateo Chileno**: CLP, RUT, fechas en formato local

### 🎯 Sistema de Coordenadas

- **Base**: A4 (210×297 mm) a 300 DPI = 2480×3508 px
- **Conversión**: `mmToPx(mm)` para coordenadas precisas
- **Fuentes**: Arial embebido para compatibilidad
- **Colores**: Negro sólido (#000000) para contraste máximo

### 🔧 Customización

Para ajustar el template a tu documento específico:

1. **Medir coordenadas** en el PDF original usando herramientas como Adobe Reader
2. **Convertir mm a px** usando `mmToPx(medida_en_mm)`
3. **Actualizar QUOTE_COORDINATES** con las nuevas posiciones
4. **Reemplazar fondo PNG** con el documento convertido

### 🚀 Despliegue

- **Desarrollo**: Usa Puppeteer local automáticamente
- **Producción**: Cambia a @sparticuz/chromium para serverless
- **Detección automática**: Basada en `NODE_ENV`

### 📱 Integración Actual

El botón de descarga ya está integrado en:
- `QuoteSummary.tsx` - Resumen final de cotización
- Funciona tanto con datos en memoria como cotizaciones guardadas

## Próximos Pasos

1. **Reemplazar Template**: Convertir tu PDF real a PNG 300 DPI
2. **Ajustar Coordenadas**: Medir y actualizar posiciones exactas
3. **Integrar Base de Datos**: Conectar `getQuoteById()` con Supabase
4. **Testing**: Probar con datos reales de cotizaciones
5. **Optimizaciones**: Cache de templates, compresión de imágenes

¡El sistema está listo para usar y expandir!
