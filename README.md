# CotizacionesInsumos

Proyecto Next.js para gestionar cotizaciones, clientes y "targets".

## Desarrollo

```powershell
pnpm install
pnpm dev
```

Abrir <http://localhost:3000> en el navegador.

## Documentación de geocodificación

Consulta `README-GEOCODING.md` para:

- API interna `/api/geocoding` (search y reverse con Nominatim)
- Optimización de búsqueda (debounce, cancelación, cache)
- Configuración de `NOMINATIM_USER_AGENT` en local, Render y Vercel
