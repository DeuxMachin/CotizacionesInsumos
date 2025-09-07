# API de Cotizaciones - Documentación de Rutas

## Configuración Inicial

1. **Configura tus variables de entorno** en el archivo `.env`:
   ```env
   # Supabase configuración
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_ANON_KEY=tu_anon_key
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

   # Database direct connection (PostgreSQL)
   DATABASE_URL=postgresql://postgres:tu-password@db.tu-proyecto.supabase.co:5432/postgres
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Ejecutar el servidor**:
   ```bash
   npm run dev
   ```

## Rutas Disponibles

### 🏠 Rutas Básicas

- `GET /` - Información de la API
- `GET /health` - Health check del servidor
- `GET /api/test` - Ruta de prueba básica
- `GET /api/test-db` - Prueba de conexión a la base de datos

### 📊 Dashboard

- `GET /api/dashboard/stats` - Estadísticas generales del dashboard
- `GET /api/dashboard/actividad-reciente` - Últimas 10 actividades

### 💰 Cotizaciones (`/api/quotes`)

- `GET /api/quotes` - Obtener todas las cotizaciones (últimas 50)
- `GET /api/quotes/:id` - Obtener una cotización específica
- `GET /api/quotes/stats/general` - Estadísticas de cotizaciones (últimos 30 días)

### 👥 Clientes (`/api/clientes`)

- `GET /api/clientes` - Obtener todos los clientes
  - Query params: `search`, `estado`, `limit`
- `GET /api/clientes/:id` - Obtener un cliente específico
- `GET /api/clientes/:id/cotizaciones` - Cotizaciones de un cliente

### 📦 Productos (`/api/productos`)

- `GET /api/productos` - Obtener todos los productos
  - Query params: `search`, `estado`, `activo`, `limit`
- `GET /api/productos/:id` - Obtener un producto específico
- `GET /api/productos/:id/stock` - Stock del producto por bodega

### 🏗️ Obras (`/api/obras`)

- `GET /api/obras` - Obtener todas las obras
  - Query params: `search`, `cliente_id`, `limit`
- `GET /api/obras/:id` - Obtener una obra específica
- `GET /api/obras/:id/cotizaciones` - Cotizaciones de una obra

## Ejemplos de Uso

### Probar la conexión a la base de datos
```bash
curl http://localhost:3001/api/test-db
```

### Obtener estadísticas del dashboard
```bash
curl http://localhost:3001/api/dashboard/stats
```

### Buscar clientes
```bash
curl "http://localhost:3001/api/clientes?search=empresa&limit=10"
```

### Obtener cotizaciones de un cliente
```bash
curl http://localhost:3001/api/clientes/1/cotizaciones
```

### Buscar productos
```bash
curl "http://localhost:3001/api/productos?search=cemento&estado=vigente"
```

## Estructura de Respuestas

Todas las respuestas siguen el formato:

```json
{
  "success": true|false,
  "data": {},
  "count": number, // en listados
  "error": "mensaje de error", // solo en errores
  "message": "detalle del error" // solo en errores
}
```

## Estados de HTTP

- `200` - Éxito
- `404` - Recurso no encontrado
- `500` - Error interno del servidor

## Notas Importantes

- Todas las rutas retornan JSON
- Los errores de base de datos se logean en consola
- Las consultas incluyen joins para obtener información relacionada
- Se incluyen límites por defecto para prevenir consultas muy grandes
