-- Permite a los vendedores organizar sus cotizaciones por orden de prioridad

-- Agregar columna prioridad_vendedor a la tabla cotizaciones
ALTER TABLE cotizaciones 
ADD COLUMN IF NOT EXISTS prioridad_vendedor INTEGER DEFAULT NULL;

-- Crear índice para mejorar rendimiento de consultas ordenadas por prioridad
CREATE INDEX IF NOT EXISTS idx_cotizaciones_prioridad_vendedor 
ON cotizaciones(vendedor_id, prioridad_vendedor) 
WHERE prioridad_vendedor IS NOT NULL;

-- Comentario en la columna para documentación
COMMENT ON COLUMN cotizaciones.prioridad_vendedor IS 
'Orden de prioridad asignado por el vendedor. Valores más bajos = mayor prioridad. NULL = sin priorizar';
