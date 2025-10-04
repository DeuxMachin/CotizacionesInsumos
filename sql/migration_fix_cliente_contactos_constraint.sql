-- Migración: Corregir constraint de contactos principales
-- Fecha: 2025-10-03
-- Descripción: Modifica la constraint para permitir múltiples contactos no principales
-- pero mantener la restricción de un solo contacto principal por cliente

-- Eliminar la constraint incorrecta
ALTER TABLE public.cliente_contactos 
  DROP CONSTRAINT IF EXISTS cliente_contactos_principal_unico;

-- Crear una constraint parcial que solo aplica cuando es_principal = true
-- Esto permite múltiples contactos con es_principal = false pero solo uno con true
CREATE UNIQUE INDEX cliente_contactos_principal_unico 
  ON public.cliente_contactos(cliente_id) 
  WHERE es_principal = true;

-- Comentario explicativo
COMMENT ON INDEX cliente_contactos_principal_unico IS 
  'Asegura que solo puede haber un contacto principal (es_principal=true) por cliente. Permite múltiples contactos no principales.';
