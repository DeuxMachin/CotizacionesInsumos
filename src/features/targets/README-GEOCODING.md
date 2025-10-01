# Geocodificación y Configuración de NOMINATIM_USER_AGENT

Este documento describe los cambios realizados para corregir la captura de ubicación en Targets, optimizar la búsqueda de direcciones y preparar la configuración para despliegue en producción (Render/Vercel). Está escrito para desarrolladores y operadores del proyecto.

## Objetivos logrados

- Reemplazo de geocodificación simulada por geocodificación real usando Nominatim (OpenStreetMap) a través de una API interna (`/api/geocoding`).
- Soporte de búsqueda (search) y reversa (reverse geocoding) con resultados en español y priorización para Chile.
- Optimización UX:
  - Debounce en el buscador (≈350ms) y cancelación de requests en vuelo (AbortController).
  - Cerrar sugerencias al hacer click fuera.
  - Botón "X" para limpiar rápidamente el input.
  - Inclusión de número de casa en sugerencias cuando esté disponible.
- Cache en servidor (in-memory, TTL 5 min) y `Cache-Control` en respuestas para mejorar latencia y reducir carga.
- Eliminación de valores hardcodeados (como "Santiago") al guardar la ubicación.

## Componentes y archivos modificados/creados

- API interna: `src/app/api/geocoding/route.ts`
  - Endpoints por querystring:
    - `action=search&q=<texto>` → devuelve sugerencias normalizadas.
    - `action=reverse&lat=<lat>&lng=<lng>` → devuelve dirección normalizada y componentes (`ciudad`, `region`, `comuna`).
  - Configuración por defecto:
    - `format=json`
    - `addressdetails=1`
    - `accept-language=es`
    - `countrycodes=cl`
  - Encabezados: `Cache-Control: public, max-age=60, s-maxage=300`
  - Cache en memoria (TTL 5 minutos) para respuestas de search y reverse.
  - Normalización de `main_text` para incluir `house_number + road` cuando corresponda.

- UI (modal principal): `src/features/targets/ui/CreateTargetModal.tsx`
  - Sustituye mocks por llamadas reales a `/api/geocoding`.
  - Debounce + cancelación + cierre por click afuera + botón de limpiar.
  - Mapeo de `ciudad`, `region`, `comuna`, `lat`, `lng` desde resultados reales.

- UI (modal simple heredado): `src/features/targets/ui/CreatePosibleTargetModal.tsx`
  - Reparado para compilar (componente mínimo). El flujo activo de creación usa el modal principal.

## Importante en Producción: NOMINATIM_USER_AGENT

Nominatim exige un **User-Agent identificable** (con nombre de app y forma de contacto) para permitir el uso justo del servicio y mitigar abuso. Si no se provee un User-Agent válido, tus peticiones pueden ser bloqueadas.

- Variable de entorno: `NOMINATIM_USER_AGENT`
- Formato recomendado: `empresa-cotizaciones/1.0 (contacto: soporte@tu-dominio.com)`
- El backend (`/api/geocoding`) usa esta variable para setear el header `User-Agent` en requests a Nominatim.

### Cómo configurar la variable

1. Desarrollo local (archivo `.env.local`):

```env
NOMINATIM_USER_AGENT=empresa-cotizaciones/1.0 (contacto: soporte@tu-dominio.com)
```

1. Render.com (gratuito)

- Ir a: Service → Environment → Add Environment Variable
- Key: `NOMINATIM_USER_AGENT`
- Value: `empresa-cotizaciones/1.0 (contacto: soporte@tu-dominio.com)`
- Redeploy el servicio.

1. Vercel (gratuito)

- Ir a: Project → Settings → Environment Variables → Add
- Name: `NOMINATIM_USER_AGENT`
- Value: `empresa-cotizaciones/1.0 (contacto: soporte@tu-dominio.com)`
- Environment: `Preview` y `Production` (según corresponda)
- Redeploy del proyecto.

Nota: En free tiers, respeta los Términos de Uso de Nominatim (rate limits). Nuestra implementación ya reduce carga con debounce, cancelación y cache. Si el uso crece, considera un proxy con cache persistente o un proveedor de geocoding dedicado.

## Flujo técnico

- Búsqueda: el input llama a `/api/geocoding?action=search&q=...` tras 350ms sin teclear y cancela la búsqueda anterior si el usuario sigue escribiendo.
- Selección: al elegir una sugerencia se normalizan campos y se guardan en el formulario (`direccion`, `lat`, `lng`, `ciudad`, `region`, `comuna`).
- Ubicación actual: usa `navigator.geolocation` y luego `/api/geocoding?action=reverse&lat=...&lng=...` para obtener dirección y componentes.

## Edge cases considerados

- Sin resultados de búsqueda: se limpia la lista y no se muestran sugerencias.
- Abort/cancel: si el usuario tipeó nuevamente, se cancela la solicitud en vuelo.
- Rate limiting/errores de Nominatim: se captura error, se loguea y se degrada con feedback básico.
- Direcciones sin `house_number`: el `main_text` usa `road` o descripción genérica.

## Cómo probar

1. Ejecutar en local con `.env.local` configurado.

```powershell
pnpm install
pnpm dev
```

1. Búsqueda de dirección (ej: `Ancona 1011`). Debe mostrar número de casa si está disponible.
1. Click fuera del dropdown para cerrarlo, y botón "×" para limpiar el input.
1. "Usar mi ubicación actual" debe asignar `lat/lng` y rellenar `ciudad/region/comuna` reales.

## Mantenimiento futuro

- Si se detectan límites de uso, considerar cache distribuido (Redis) o proveedor con SLA.
- Mantener actualizado el `NOMINATIM_USER_AGENT` con un contacto válido.
- Validar el mapeo de `comuna` (municipality/city_district/county/suburb) según calidad de datos en distintas zonas.
- Cuando se pase a poroduccion la idea es tener algo como NOMBRE DE LA EMPRESA/VERSION(+URL/Correo soporte)
- Ejemplo: empresa-cotizaciones/1.0 (+https://cotizacionesinsumos.onrender.com; contacto: soporte@tu-dominio.com)