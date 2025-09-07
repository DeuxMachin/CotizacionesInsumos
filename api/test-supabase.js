require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Prueba de conexión a Supabase\n');
console.log('📍 URL:', process.env.SUPABASE_URL);
console.log('🔑 Service Role Key presente:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('');

// Crear cliente con Service Role Key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testSupabase() {
  console.log('1. Probando acceso directo a REST API...');
  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    console.log('   ✅ REST API responde con status:', response.status);
    
    // Intentar obtener el contenido
    const text = await response.text();
    if (text) {
      try {
        const json = JSON.parse(text);
        console.log('   📋 Respuesta:', JSON.stringify(json).substring(0, 100) + '...');
      } catch {
        console.log('   📋 Respuesta (texto):', text.substring(0, 100) + '...');
      }
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  console.log('\n2. Listando tablas disponibles...');
  try {
    // Intentar obtener información del esquema
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Accept': 'application/vnd.pgrst.object+json'
      }
    });
    
    const schemaInfo = await response.text();
    console.log('   📊 Info del esquema:', schemaInfo.substring(0, 200));
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  console.log('\n3. Probando query simple a tabla clientes...');
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('   ❌ Error:', error);
      console.log('   📝 Código de error:', error.code);
      console.log('   💡 Mensaje:', error.message);
      
      if (error.code === '42P01') {
        console.log('   ⚠️  La tabla "clientes" no existe en la base de datos');
      } else if (error.code === '42501') {
        console.log('   ⚠️  No hay permisos para acceder al esquema público');
      }
    } else {
      console.log('   ✅ Query exitosa, registros encontrados:', data?.length || 0);
    }
  } catch (error) {
    console.log('   ❌ Error general:', error.message);
  }

  console.log('\n4. Probando con conexión directa PostgreSQL...');
  try {
    // Intentar usar la conexión directa si está disponible
    const { Client } = require('pg');
    const connectionString = process.env.DATABASE_URL;
    
    if (connectionString) {
      console.log('   🔗 String de conexión encontrado');
      const client = new Client({ connectionString });
      
      await client.connect();
      console.log('   ✅ Conectado a PostgreSQL directamente');
      
      // Listar tablas
      const result = await client.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
        LIMIT 10
      `);
      
      console.log('   📋 Tablas en el esquema público:');
      result.rows.forEach(row => {
        console.log('      - ' + row.tablename);
      });
      
      await client.end();
    } else {
      console.log('   ⚠️  No se encontró DATABASE_URL para conexión directa');
    }
  } catch (error) {
    console.log('   ❌ Error con PostgreSQL:', error.message);
  }

  console.log('\n5. Información del JWT decodificada...');
  try {
    // Decodificar el JWT para ver los claims
    const [header, payload] = process.env.SUPABASE_SERVICE_ROLE_KEY.split('.');
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
    console.log('   👤 Role:', decodedPayload.role);
    console.log('   🏢 Ref:', decodedPayload.ref);
    console.log('   ⏰ Issued at:', new Date(decodedPayload.iat * 1000).toISOString());
    console.log('   ⏰ Expires:', new Date(decodedPayload.exp * 1000).toISOString());
  } catch (error) {
    console.log('   ❌ Error decodificando JWT:', error.message);
  }
}

testSupabase().then(() => {
  console.log('\n✅ Prueba completada');
}).catch(error => {
  console.error('\n❌ Error en la prueba:', error);
});
