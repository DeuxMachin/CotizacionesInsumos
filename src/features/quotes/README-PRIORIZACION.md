# Funcionalidad de Priorización de Cotizaciones para Vendedores

## Descripción

Esta funcionalidad permite a los **VENDEDORES** (y solo a ellos) organizar sus cotizaciones por orden de prioridad en la vista de tabla. Esto les permite enfocarse en las cotizaciones más importantes y gestionar mejor su tiempo.

## Características Principales

### 1. **Exclusivo para Vendedores**
- Solo los usuarios con rol "vendedor" (no administradores) pueden ver y usar esta funcionalidad
- Cada vendedor solo puede priorizar sus propias cotizaciones
- La prioridad es personal de cada vendedor y no afecta a otros usuarios

### 2. **Vista de Tabla Mejorada**
Cuando un vendedor está en la vista de tabla de cotizaciones, verá:
- Una columna adicional de "Prioridad" al inicio de la tabla
- Controles para subir/bajar la prioridad de cada cotización
- Las cotizaciones se ordenan automáticamente por prioridad (menor número = mayor prioridad)

### 3. **Controles de Priorización**
Para cada cotización, el vendedor tiene:
- **Botón Subir (↑)**: Aumenta la prioridad (mueve hacia arriba)
- **Botón Bajar (↓)**: Disminuye la prioridad (mueve hacia abajo)
- **Botón Quitar (X)**: Elimina la prioridad asignada
- **Indicador numérico**: Muestra el número de prioridad actual

### 4. **Ordenamiento Automático**
- Las cotizaciones con prioridad asignada aparecen primero
- Se ordenan de menor a mayor número (1, 2, 3...)
- Las cotizaciones sin prioridad aparecen al final
- El ordenamiento es dinámico y se actualiza inmediatamente

## Implementación Técnica

### Base de Datos
- **Tabla**: `cotizaciones`
- **Campo nuevo**: `prioridad_vendedor` (INTEGER, NULL por defecto)
- **Índice**: `idx_cotizaciones_prioridad_vendedor` para optimizar consultas

### Archivos Modificados

1. **`src/core/domain/quote/Quote.ts`**
   - Agregado campo `prioridad?: number` al tipo `Quote`

2. **`src/features/quotes/model/adapters.ts`**
   - Actualizado `mapCotizacionToDomain` para incluir el campo de prioridad

3. **`src/features/quotes/model/useQuotes.ts`**
   - Nueva función `actualizarPrioridad(id, prioridad)` con validación de permisos
   - Solo permite actualizar si el usuario es el vendedor de la cotización

4. **`src/features/quotes/ui/QuotesPage.tsx`**
   - Detecta si el usuario es vendedor (no admin)
   - Pasa props necesarios al componente `QuotesTable`
   - Implementa `handleUpdatePriority` con feedback al usuario

5. **`QuotesTable` (componente interno)**
   - Nueva columna de "Prioridad" (visible solo para vendedores)
   - Controles de navegación (subir/bajar/quitar)
   - Ordenamiento automático por prioridad
   - UI responsive con tooltips informativos

### Migración SQL
Archivo: `sql/migration_add_prioridad_vendedor.sql`

```sql
ALTER TABLE cotizaciones 
ADD COLUMN IF NOT EXISTS prioridad_vendedor INTEGER DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_cotizaciones_prioridad_vendedor 
ON cotizaciones(vendedor_id, prioridad_vendedor) 
WHERE prioridad_vendedor IS NOT NULL;
```

## Instrucciones de Instalación

1. **Ejecutar la migración SQL**:
   ```bash
   # Conectarse a la base de datos y ejecutar:
   psql -U [usuario] -d [base_de_datos] -f sql/migration_add_prioridad_vendedor.sql
   ```

2. **Reiniciar la aplicación** (si está en desarrollo):
   ```bash
   npm run dev
   ```

3. **Verificar permisos**: Asegurarse de que existan usuarios con rol "vendedor"

## Uso

### Para Vendedores:

1. **Acceder a Cotizaciones**: Ir a Dashboard → Cotizaciones
2. **Cambiar a Vista de Tabla**: Hacer clic en el ícono de lista (≡)
3. **Priorizar**: 
   - Usar los botones ↑/↓ para mover cotizaciones
   - El número se ajusta automáticamente
   - Las cotizaciones se reordenan en tiempo real
4. **Quitar Prioridad**: Hacer clic en la X roja para desprioritizar

### Notas Importantes:

- ✅ Solo vendedores ven la columna de prioridad
- ✅ Cada vendedor gestiona sus propias prioridades
- ✅ La vista de grid (tarjetas) no se ve afectada
- ✅ Los administradores NO pueden priorizar (no ven la columna)
- ✅ Los cambios se guardan inmediatamente en la base de datos

## Validaciones de Seguridad

1. **Verificación de rol**: Solo usuarios con rol "vendedor" y no admin
2. **Verificación de propiedad**: Solo se pueden priorizar cotizaciones propias
3. **Validación en backend**: La función `actualizarPrioridad` verifica permisos

## Futuras Mejoras (Opcionales)

- [ ] Drag & drop para reordenar
- [ ] Asignación masiva de prioridades
- [ ] Filtro para ver solo cotizaciones priorizadas
- [ ] Notificaciones de recordatorio para cotizaciones de alta prioridad
- [ ] Dashboard con KPIs de cotizaciones priorizadas

## Pruebas Recomendadas

1. ✅ Verificar que admin NO vea columna de prioridad
2. ✅ Verificar que vendedor SÍ vea columna de prioridad
3. ✅ Intentar priorizar cotización de otro vendedor (debe fallar)
4. ✅ Mover cotización hacia arriba/abajo
5. ✅ Quitar prioridad de una cotización
6. ✅ Verificar ordenamiento automático
7. ✅ Cambiar entre vista grid y tabla
8. ✅ Verificar persistencia tras recargar página

---

**Fecha de Implementación**: Octubre 2025  
**Versión**: 1.0.0  
**Desarrollado para**: Sistema de Cotizaciones e Insumos
