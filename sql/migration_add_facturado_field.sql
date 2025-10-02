-- Agrega campo 'facturado' a nota_venta_items y actualiza estados de notas_venta

-- Step 1: Add 'cantidad_facturada' column to nota_venta_items
-- This replaces the boolean 'facturado' with a numeric quantity
ALTER TABLE public.nota_venta_items 
ADD COLUMN IF NOT EXISTS cantidad_facturada numeric NOT NULL DEFAULT 0 CHECK (cantidad_facturada >= 0);

-- Step 2: Create index for better performance on facturado queries
CREATE INDEX IF NOT EXISTS idx_nota_venta_items_cantidad_facturada 
ON public.nota_venta_items(nota_venta_id, cantidad_facturada);

-- Step 3: Update existing notas_venta estados
-- Cambiar 'confirmada' a 'facturada' en registros existentes
UPDATE public.notas_venta 
SET estado = 'facturada' 
WHERE estado = 'confirmada';

-- Step 4: Add CHECK constraint for valid estados
-- Primero eliminar el constraint anterior si existe
DO $$ 
BEGIN
    -- Buscar y eliminar constraint de estado si existe
    IF EXISTS (
        SELECT 1 
        FROM information_schema.constraint_column_usage 
        WHERE table_name = 'notas_venta' 
        AND column_name = 'estado'
        AND table_schema = 'public'
    ) THEN
        EXECUTE (
            SELECT 'ALTER TABLE public.notas_venta DROP CONSTRAINT ' || constraint_name
            FROM information_schema.constraint_column_usage
            WHERE table_name = 'notas_venta' 
            AND column_name = 'estado'
            AND table_schema = 'public'
            LIMIT 1
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Si hay error, continuar
        RAISE NOTICE 'No se pudo eliminar constraint anterior: %', SQLERRM;
END $$;

-- Agregar nuevo constraint con los estados válidos
ALTER TABLE public.notas_venta 
ADD CONSTRAINT notas_venta_estado_check 
CHECK (estado IN ('creada', 'factura_parcial', 'facturada', 'anulada'));

-- Step 5: Update default value for estado column
ALTER TABLE public.notas_venta 
ALTER COLUMN estado SET DEFAULT 'creada';

-- Step 6: Mark all existing items in 'facturada' notas as fully invoiced
-- Set cantidad_facturada = cantidad for items in already invoiced sales notes
UPDATE public.nota_venta_items nvi
SET cantidad_facturada = nvi.cantidad
FROM public.notas_venta nv
WHERE nvi.nota_venta_id = nv.id 
AND nv.estado = 'facturada';

-- Step 7: Add comments to columns for documentation
COMMENT ON COLUMN public.nota_venta_items.cantidad_facturada IS 
'Cantidad del item que ha sido facturada. Permite facturación parcial por cantidades.';

COMMENT ON COLUMN public.notas_venta.estado IS 
'Estados válidos: creada, factura_parcial, facturada, anulada';
