const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase - USAR LAS CREDENCIALES REALES
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mcgfkleptbuxpyitoyop.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_1_kVxZXmWyGB5LGvhvsvqw_otgt_-lG';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAuditLogTable() {
  console.log('🚀 Creando tabla audit_log...');

  try {
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'create-audit-log-table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Ejecutar el SQL usando el cliente de Supabase
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      console.error('❌ Error ejecutando SQL:', error);
      
      // Si falla con rpc, intentar crear la tabla básica directamente
      console.log('🔄 Intentando crear tabla básica...');
      
      const basicSql = `
        CREATE TABLE IF NOT EXISTS audit_log (
          id SERIAL PRIMARY KEY,
          event_type VARCHAR(50) NOT NULL,
          table_name VARCHAR(50),
          record_id VARCHAR(50),
          user_id UUID NOT NULL,
          user_email VARCHAR(255),
          user_name VARCHAR(255),
          action VARCHAR(20) NOT NULL,
          description TEXT NOT NULL,
          old_values JSONB,
          new_values JSONB,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      // Intentar crear usando una inserción directa (hack)
      const { error: insertError } = await supabase
        .from('audit_log')
        .select('id')
        .limit(1);

      if (insertError && insertError.code === '42P01') {
        console.log('⚠️ La tabla no existe. Necesitas crearla manualmente en Supabase.');
        console.log('📋 SQL para ejecutar en el SQL Editor de Supabase:');
        console.log(basicSql);
        return;
      }

      if (insertError) {
        console.error('❌ Error verificando tabla:', insertError);
        return;
      }
    }

    console.log('✅ Tabla audit_log creada exitosamente');

    // Insertar algunos eventos de prueba
    console.log('📝 Insertando eventos de prueba...');
    
    const testEvents = [
      {
        event_type: 'user_login',
        user_id: '00000000-0000-0000-0000-000000000000',
        user_email: 'admin@empresa.com',
        user_name: 'Administrador Sistema',
        action: 'login',
        description: 'Usuario admin@empresa.com inició sesión',
        metadata: { test: true }
      },
      {
        event_type: 'cotizacion_created',
        table_name: 'cotizaciones',
        record_id: '1',
        user_id: '00000000-0000-0000-0000-000000000000',
        user_email: 'vendedor@empresa.com',
        user_name: 'Juan Vendedor',
        action: 'create',
        description: 'Creó cotización COT-0001 para Empresa XYZ',
        metadata: { folio: 'COT-0001', test: true }
      },
      {
        event_type: 'cliente_created',
        table_name: 'clientes',
        record_id: '1',
        user_id: '00000000-0000-0000-0000-000000000000',
        user_email: 'vendedor@empresa.com',
        user_name: 'Juan Vendedor',
        action: 'create',
        description: 'Creó cliente Empresa ABC Ltda. (12.345.678-9)',
        metadata: { rut: '12.345.678-9', test: true }
      }
    ];

    const { error: insertTestError } = await supabase
      .from('audit_log')
      .insert(testEvents);

    if (insertTestError) {
      console.error('⚠️ Error insertando eventos de prueba:', insertTestError);
    } else {
      console.log('✅ Eventos de prueba insertados');
    }

    console.log('\n🎉 Setup completo!');
    console.log('La tabla audit_log está lista y el dashboard debería mostrar actividad reciente.');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar script
createAuditLogTable().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
