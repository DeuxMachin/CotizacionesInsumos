const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Configuración de Supabase
const supabaseUrl = 'https://mcgfkleptbuxpyitoyop.supabase.co';
const supabaseKey = 'sb_publishable_1_kVxZXmWyGB5LGvhvsvqw_otgt_-lG';
const supabase = createClient(supabaseUrl, supabaseKey);

async function crearUsuarios() {
  console.log('🚀 Iniciando creación de usuarios...');

  const usuarios = [
    {
      email: 'admin@empresa.com',
      password: 'admin123',
      nombre: 'Administrador',
      apellido: 'Sistema',
      rol: 'admin',
      activo: true
    },
    {
      email: 'vendedor@empresa.com',
      password: 'vendedor123',
      nombre: 'Juan',
      apellido: 'Vendedor',
      rol: 'vendedor',
      activo: true
    },
    {
      email: 'vendedor2@empresa.com',
      password: 'vendedor123',
      nombre: 'María',
      apellido: 'González',
      rol: 'vendedor',
      activo: true
    }
  ];

  for (const usuario of usuarios) {
    try {
      console.log(`📝 Creando usuario: ${usuario.email}`);
      
      // Verificar si ya existe
      const { data: existingUser } = await supabase
        .from('usuarios')
        .select('email')
        .eq('email', usuario.email)
        .single();

      if (existingUser) {
        console.log(`⚠️  Usuario ${usuario.email} ya existe, saltando...`);
        continue;
      }

      // Hash de la contraseña
      const passwordHash = await bcrypt.hash(usuario.password, 10);
      
      // Insertar en la base de datos
      const { data, error } = await supabase
        .from('usuarios')
        .insert({
          email: usuario.email,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          rol: usuario.rol,
          password_hash: passwordHash,
          activo: usuario.activo,
          created_at: new Date().toISOString(),
          password_updated_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error(`❌ Error creando ${usuario.email}:`, error.message);
      } else {
        console.log(`✅ Usuario creado exitosamente: ${usuario.email}`);
      }
      
    } catch (error) {
      console.error(`❌ Error procesando ${usuario.email}:`, error.message);
    }
  }

  console.log('\n🎉 Proceso completado!');
  console.log('\n📝 Credenciales para usar en /login:');
  usuarios.forEach(user => {
    console.log(`${user.rol.toUpperCase()}: ${user.email} / ${user.password}`);
  });

  process.exit(0);
}

// Ejecutar script
crearUsuarios().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
