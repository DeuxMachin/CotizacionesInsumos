-- =====================================================
-- SCRIPT PARA ARREGLAR PERMISOS EN SUPABASE
-- =====================================================

-- 1. Primero, dar permisos de uso del schema público a todos los roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Dar permisos en TODAS las tablas existentes
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. Dar permisos en TODAS las secuencias (para los IDs auto-incrementales)
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. Dar permisos en TODAS las funciones
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- 5. Configurar permisos por defecto para futuras tablas
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL ON TABLES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

-- 6. Verificar permisos actuales (esto te mostrará el resultado)
SELECT 
    schemaname,
    tablename,
    tableowner,
    has_table_privilege('anon', schemaname||'.'||tablename, 'SELECT') as anon_select,
    has_table_privilege('authenticated', schemaname||'.'||tablename, 'SELECT') as authenticated_select,
    has_table_privilege('service_role', schemaname||'.'||tablename, 'SELECT') as service_role_select
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 7. Si alguna tabla específica sigue sin funcionar, puedes ejecutar esto:
-- GRANT ALL ON public.clientes TO anon, authenticated, service_role;
-- GRANT ALL ON public.productos TO anon, authenticated, service_role;
-- GRANT ALL ON public.cotizaciones TO anon, authenticated, service_role;
-- GRANT ALL ON public.obras TO anon, authenticated, service_role;
-- GRANT ALL ON public.usuarios TO anon, authenticated, service_role;

-- =====================================================
-- IMPORTANTE: Después de ejecutar esto, todas las tablas
-- deberían ser accesibles por los roles de Supabase
-- =====================================================
