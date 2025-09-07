-- =====================================================
-- CONFIGURACIÓN SEGURA PARA PRODUCCIÓN
-- =====================================================

-- PASO 1: REVOCAR TODOS LOS PERMISOS (limpieza)
-- =====================================================
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- PASO 2: CONFIGURAR PERMISOS MÍNIMOS NECESARIOS
-- =====================================================

-- 2.1 Service Role: Mantiene acceso completo (porque es usado por tu backend)
-- Ya tiene permisos, no necesita cambios

-- 2.2 Anon: NO debería tener acceso directo a las tablas
-- Solo se usará si implementas endpoints públicos específicos

-- 2.3 Authenticated: Permisos limitados para usuarios autenticados
-- Por ahora, sin permisos. Se agregarán según necesites

-- PASO 3: HABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_saldos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_tipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizacion_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producto_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producto_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bodegas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obra_tipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obra_tamanos ENABLE ROW LEVEL SECURITY;

-- PASO 4: CREAR POLÍTICAS RLS BÁSICAS
-- =====================================================

-- Política ejemplo para usuarios autenticados (cuando lo necesites)
-- CREATE POLICY "Usuarios pueden ver sus propios datos" ON public.usuarios
--   FOR SELECT USING (auth.uid() = id);

-- Política ejemplo para clientes (cuando implementes autenticación)
-- CREATE POLICY "Vendedores ven sus clientes asignados" ON public.clientes
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM public.cliente_usuarios cu
--       WHERE cu.cliente_id = clientes.id 
--       AND cu.usuario_id = auth.uid()
--       AND cu.activo = true
--     )
--   );

-- PASO 5: VERIFICAR CONFIGURACIÓN
-- =====================================================
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    has_table_privilege('anon', schemaname||'.'||tablename, 'SELECT') as anon_can_read,
    has_table_privilege('service_role', schemaname||'.'||tablename, 'SELECT') as service_role_can_read
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- RESULTADO ESPERADO:
-- - rls_enabled = true para todas las tablas
-- - anon_can_read = false para todas las tablas
-- - service_role_can_read = true para todas las tablas
-- =====================================================
