-- Migración: Agregar tabla de contactos de clientes
-- Fecha: 2025-10-03
-- Descripción: Crea la tabla cliente_contactos para almacenar múltiples contactos por cliente
-- incluyendo contacto principal, responsable de pago y contactos secundarios.

-- Crear tipo ENUM para tipo de contacto
CREATE TYPE tipo_contacto AS ENUM ('principal', 'pago', 'secundario', 'otro');

-- Crear tabla de contactos de clientes
CREATE TABLE IF NOT EXISTS public.cliente_contactos (
  id bigserial PRIMARY KEY,
  cliente_id bigint NOT NULL,
  tipo tipo_contacto NOT NULL DEFAULT 'secundario',
  nombre text NOT NULL,
  cargo text,
  email text,
  telefono text,
  celular text,
  es_principal boolean NOT NULL DEFAULT false,
  notas text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Foreign key
  CONSTRAINT cliente_contactos_cliente_id_fkey 
    FOREIGN KEY (cliente_id) 
    REFERENCES public.clientes(id) 
    ON DELETE CASCADE,
  
  -- Constraint: Solo puede haber un contacto principal por cliente
  CONSTRAINT cliente_contactos_principal_unico 
    UNIQUE NULLS NOT DISTINCT (cliente_id, es_principal) 
    DEFERRABLE INITIALLY DEFERRED
);

-- Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_cliente_contactos_cliente_id 
  ON public.cliente_contactos(cliente_id);

CREATE INDEX IF NOT EXISTS idx_cliente_contactos_tipo 
  ON public.cliente_contactos(tipo);

CREATE INDEX IF NOT EXISTS idx_cliente_contactos_principal 
  ON public.cliente_contactos(cliente_id, es_principal) 
  WHERE es_principal = true;

-- Comentarios para documentación
COMMENT ON TABLE public.cliente_contactos IS 
  'Contactos asociados a clientes: principal, responsable de pago y secundarios';

COMMENT ON COLUMN public.cliente_contactos.tipo IS 
  'Tipo de contacto: principal, pago (responsable de pagos), secundario u otro';

COMMENT ON COLUMN public.cliente_contactos.es_principal IS 
  'Indica si es el contacto principal del cliente (solo puede haber uno por cliente)';

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_cliente_contactos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cliente_contactos_updated_at
  BEFORE UPDATE ON public.cliente_contactos
  FOR EACH ROW
  EXECUTE FUNCTION update_cliente_contactos_updated_at();
