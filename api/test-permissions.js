require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Diagnóstico avanzado de permisos en Supabase\n');

// Probar con diferentes configuraciones
async function testPermissions() {
  console.log('1. Probando con Service Role Key...');
  const supabaseServiceRole = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    // Probar query simple
    const { data, error } = await supabaseServiceRole
      .from('clientes')
      .select('count')
      .single();
    
    if (error) {
      console.log('   ❌ Error con Service Role:', error);
    } else {
      console.log('   ✅ Service Role funciona');
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }

  console.log('\n2. Probando RPC functions...');
  try {
    // Intentar llamar a una función RPC básica
    const { data, error } = await supabaseServiceRole.rpc('get_tables_list', {});
    
    if (error) {
      console.log('   ℹ️  No hay funciones RPC o error:', error.message);
      
      // Intentar crear una función simple
      console.log('   🔧 Intentando query directa via REST API...');
      
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/get_tables_list`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({})
      });
      
      console.log('   📊 Status:', response.status);
      const text = await response.text();
      console.log('   📋 Response:', text.substring(0, 200));
    } else {
      console.log('   ✅ RPC funciona:', data);
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }

  console.log('\n3. Verificando headers y configuración...');
  
  // Hacer una petición manual para ver los headers
  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/clientes?limit=1`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   📊 Status:', response.status);
    console.log('   📋 Headers recibidos:');
    response.headers.forEach((value, key) => {
      if (key.toLowerCase().includes('error') || key.toLowerCase().includes('message')) {
        console.log(`      ${key}: ${value}`);
      }
    });
    
    const text = await response.text();
    console.log('   📄 Respuesta:', text.substring(0, 300));
    
    if (response.status === 401) {
      console.log('   ❌ Error de autenticación - verifica el Service Role Key');
    } else if (response.status === 403) {
      console.log('   ❌ Error de permisos - problema con permisos en la BD');
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }

  console.log('\n4. Probando diferentes endpoints...');
  const endpoints = [
    '/rest/v1/',
    '/rest/v1/clientes',
    '/rest/v1/productos',
    '/rest/v1/usuarios'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${process.env.SUPABASE_URL}${endpoint}?limit=1`, {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      });
      console.log(`   ${endpoint} -> Status: ${response.status}`);
      
      if (response.status !== 200) {
        const error = await response.text();
        console.log(`      Error: ${error.substring(0, 100)}`);
      }
    } catch (err) {
      console.log(`   ${endpoint} -> Error: ${err.message}`);
    }
  }

  console.log('\n5. Información del proyecto...');
  // Extraer project ref del URL
  const projectRef = process.env.SUPABASE_URL.match(/https:\/\/(.+)\.supabase\.co/)?.[1];
  console.log('   🏢 Project Ref:', projectRef);
  console.log('   🌐 URL Base:', process.env.SUPABASE_URL);
  
  // Verificar si el key es correcto para este proyecto
  const [, payload] = process.env.SUPABASE_SERVICE_ROLE_KEY.split('.');
  const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
  console.log('   🔑 Key Project Ref:', decoded.ref);
  console.log('   ✅ Key matches project:', decoded.ref === projectRef);

  console.log('\n6. Creando un script SQL para ejecutar en Supabase...');
  const sqlScript = `
-- Verificar permisos actuales
SELECT 
    schemaname,
    tablename,
    tableowner,
    has_table_privilege('postgres', schemaname||'.'||tablename, 'SELECT') as postgres_select,
    has_table_privilege('service_role', schemaname||'.'||tablename, 'SELECT') as service_role_select,
    has_table_privilege('anon', schemaname||'.'||tablename, 'SELECT') as anon_select
FROM pg_tables 
WHERE schemaname = 'public'
LIMIT 5;

-- Dar permisos completos (ejecutar si lo anterior muestra false)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, service_role, anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role, anon, authenticated;

-- Verificar que el schema existe y tiene permisos
GRANT USAGE ON SCHEMA public TO postgres, service_role, anon, authenticated;

-- Cambiar el owner de las tablas si es necesario
-- ALTER TABLE public.clientes OWNER TO postgres;
-- ALTER TABLE public.productos OWNER TO postgres;
`;

  console.log('   📝 Copia y ejecuta este SQL en el SQL Editor de Supabase:');
  console.log('   ' + '-'.repeat(50));
  console.log(sqlScript);
  console.log('   ' + '-'.repeat(50));
}

testPermissions().then(() => {
  console.log('\n✅ Diagnóstico completado');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Error en diagnóstico:', error);
  process.exit(1);
});
