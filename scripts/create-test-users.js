// Script para crear usuarios de prueba en Supabase
// Ejecutar: node scripts/create-test-users.js

const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

// Configuración de Supabase
const supabaseUrl = 'https://mcgfkleptbuxpyitoyop.supabase.co'
const supabaseServiceKey = 'TU_SERVICE_ROLE_KEY_AQUI' // Necesitarás obtener esto del dashboard de Supabase

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Función para hashear contraseñas
async function hashPassword(password) {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

// Usuarios de prueba
const testUsers = [
  {
    email: 'admin@empresa.com',
    password: 'admin123',
    nombre: 'Administrador',
    apellido: 'Sistema',
    rol: 'admin'
  },
  {
    email: 'vendedor@empresa.com',
    password: 'vendedor123',
    nombre: 'Juan',
    apellido: 'Pérez',
    rol: 'vendedor'
  },
  {
    email: 'cliente@empresa.com',
    password: 'cliente123',
    nombre: 'María',
    apellido: 'González',
    rol: 'cliente'
  }
]

async function createTestUsers() {
  console.log('🚀 Creando usuarios de prueba...')
  
  for (const user of testUsers) {
    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      })

      if (authError) {
        console.error(`❌ Error creando usuario de auth para ${user.email}:`, authError.message)
        continue
      }

      console.log(`✅ Usuario de auth creado: ${user.email}`)

      // 2. Crear registro en tabla usuarios
      const { data: dbUser, error: dbError } = await supabase
        .from('usuarios')
        .insert({
          id: authUser.user.id,
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          rol: user.rol,
          password_hash: await hashPassword(user.password),
          activo: true
        })
        .select()

      if (dbError) {
        console.error(`❌ Error creando usuario en BD para ${user.email}:`, dbError.message)
        // Limpiar usuario de auth si falla la BD
        await supabase.auth.admin.deleteUser(authUser.user.id)
        continue
      }

      console.log(`✅ Usuario completo creado: ${user.email} (${user.rol})`)
      
    } catch (error) {
      console.error(`❌ Error general para ${user.email}:`, error.message)
    }
  }

  console.log('\n🎉 Proceso completado!')
  console.log('\n📝 Credenciales de prueba:')
  testUsers.forEach(user => {
    console.log(`${user.rol}: ${user.email} / ${user.password}`)
  })
}

// Ejecutar script
createTestUsers().catch(console.error)
