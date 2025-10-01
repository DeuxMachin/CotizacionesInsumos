# Módulo de Cotizaciones (Quotes)

## Descripción General

El módulo de cotizaciones (`quotes`) es un componente fundamental de la aplicación de gestión empresarial, diseñado para manejar la creación, edición y administración de cotizaciones comerciales. Este módulo implementa una arquitectura modular basada en hooks personalizados, servicios de datos y componentes de interfaz de usuario reutilizables, siguiendo principios de separación de responsabilidades y escalabilidad.

## Arquitectura y Estructura

### Patrón Arquitectónico

El módulo sigue el patrón de arquitectura limpia (Clean Architecture) adaptado para aplicaciones React/Next.js, con una clara separación entre:

- **Modelo de Dominio** (`model/`): Lógica de negocio y estado de la aplicación
- **Servicios** (`services/`): Interacción con APIs externas y persistencia de datos
- **Interfaz de Usuario** (`ui/`): Componentes de presentación y lógica de interacción
- **Componentes Compartidos** (`components/`): Elementos reutilizables de UI

### Estructura de Directorios

```text
src/features/quotes/
├── model/
│   ├── adapters.ts          # Adaptadores para transformación de datos
│   ├── mock.ts             # Datos de prueba y simulaciones
│   ├── useProducts.ts      # Hook para gestión de productos
│   └── useQuotes.ts        # Hook principal para cotizaciones
├── ui/
│   ├── CreateQuoteModal.tsx    # Modal de creación de cotizaciones
│   ├── NewQuoteFromObraPage.tsx # Página para cotización desde obra
│   ├── NewQuotePage.tsx        # Página principal de nueva cotización
│   ├── QuoteFiltersPanel.tsx   # Panel de filtros para cotizaciones
│   └── QuotesPage.tsx          # Página principal de listado de cotizaciones
└── components/
    ├── ClientAutocomplete.tsx  # Autocompletado de clientes
    ├── ClientForm.tsx          # Formulario de cliente
    ├── ClientFormNew.tsx       # Versión nueva del formulario de cliente
    ├── CommercialTermsForm.tsx # Formulario de términos comerciales
    ├── DeliveryForm.tsx        # Formulario de entrega
    ├── index.ts               # Exportaciones de componentes
    ├── ProductsForm.tsx       # Formulario de productos
    └── QuoteSummary.tsx       # Resumen de cotización
```

## Componentes Principales

### Modelo de Dominio (`model/`)

#### `useQuotes.ts`

Hook personalizado que gestiona el estado global de las cotizaciones. Implementa:

- **Gestión de Estado**: Utiliza Zustand para estado global persistente
- **Operaciones CRUD**: Creación, lectura, actualización y eliminación de cotizaciones
- **Validación**: Lógica de validación de datos antes de persistencia
- **Sincronización**: Manejo de conflictos de concurrencia y actualizaciones en tiempo real

#### `useProducts.ts`

Hook especializado para la gestión del catálogo de productos:

- **Búsqueda y Filtrado**: Algoritmos de búsqueda optimizados
- **Paginación**: Implementación eficiente de carga diferida
- **Cache**: Estrategias de cacheo para mejorar rendimiento

#### `adapters.ts`

Capa de adaptación que transforma datos entre diferentes formatos:

- **Transformación DTO**: Conversión entre objetos de dominio y DTOs de API
- **Normalización**: Estandarización de datos provenientes de múltiples fuentes
- **Validación de Esquemas**: Verificación de integridad de datos

### Servicios de Datos

Aunque no hay un directorio `services/` explícito en esta estructura, los hooks interactúan con servicios globales definidos en `src/services/` para:

- **Persistencia**: Interacción con Supabase/PostgreSQL
- **Auditoría**: Registro de cambios y operaciones
- **Autenticación**: Control de acceso basado en roles

### Interfaz de Usuario (`ui/`)

#### Páginas Principales

- **`QuotesPage.tsx`**: Dashboard principal con listado paginado y filtros avanzados
- **`NewQuotePage.tsx`**: Flujo de creación de cotizaciones con wizard multi-paso
- **`NewQuoteFromObraPage.tsx`**: Creación especializada desde contexto de obra existente

#### Modales y Formularios

- **`CreateQuoteModal.tsx`**: Modal modal para creación rápida
- **`QuoteFiltersPanel.tsx`**: Panel colapsable con filtros complejos

### Componentes Reutilizables (`components/`)

#### Formularios Especializados

- **`ProductsForm.tsx`**: Gestión de líneas de productos con cálculo automático de totales
- **`CommercialTermsForm.tsx`**: Configuración de condiciones comerciales y plazos
- **`DeliveryForm.tsx`**: Especificación de términos de entrega y logística

#### Componentes de Interacción

- **`ClientAutocomplete.tsx`**: Búsqueda inteligente de clientes con debounce
- **`QuoteSummary.tsx`**: Componente de resumen con cálculos en tiempo real

## Flujo de Datos

### Creación de Cotización

1. **Inicialización**: El hook `useQuotes` inicializa el estado con valores predeterminados
2. **Recolección de Datos**: Los componentes de formulario recopilan información del usuario
3. **Validación**: Validación en tiempo real y al envío
4. **Transformación**: Adaptadores convierten datos a formato de API
5. **Persistencia**: Envío a servicios backend con manejo de errores
6. **Actualización de Estado**: Reflejo de cambios en UI y notificaciones

### Gestión de Estado

El módulo utiliza una combinación de:

- **Estado Local**: React hooks para estado temporal de formularios
- **Estado Global**: Zustand para estado persistente entre sesiones
- **Estado del Servidor**: Sincronización con base de datos en tiempo real

## Consideraciones Técnicas

### Rendimiento

- **Lazy Loading**: Componentes cargados bajo demanda
- **Memoización**: Uso de `useMemo` y `useCallback` para optimizar re-renders
- **Virtualización**: Para listados grandes de cotizaciones

### Seguridad

- **Validación de Entrada**: Sanitización de datos en cliente y servidor
- **Control de Acceso**: Verificación de permisos por rol de usuario
- **Auditoría**: Registro completo de todas las operaciones

### Escalabilidad

- **Separación de Responsabilidades**: Cada componente tiene una responsabilidad única
- **Reutilización**: Componentes diseñados para ser reutilizados en diferentes contextos
- **Extensibilidad**: Arquitectura que permite agregar nuevas funcionalidades sin refactorización masiva

### Testing

El módulo está diseñado para ser testeable con:

- **Unit Tests**: Para hooks y utilidades puras
- **Integration Tests**: Para flujos completos de creación/edición
- **E2E Tests**: Para validación de UX completa

## Dependencias Principales

- **React**: Framework de UI
- **Next.js**: Framework de aplicación
- **Zustand**: Gestión de estado global
- **Supabase**: Backend as a Service
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos utilitarios

## Uso y Desarrollo

Para desarrollar en este módulo:

1. **Entender el Flujo**: Revisar `useQuotes.ts` para comprender el estado global
2. **Componentes**: Crear componentes en `ui/` siguiendo el patrón establecido
3. **Hooks**: Extender funcionalidad en `model/` manteniendo la separación de responsabilidades
4. **Testing**: Escribir tests para nuevas funcionalidades antes de integrar

Este módulo representa una implementación robusta de gestión de cotizaciones comerciales, balanceando complejidad técnica con usabilidad y mantenibilidad.
