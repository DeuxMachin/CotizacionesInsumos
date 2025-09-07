const { createClient } = require('@supabase/supabase-js');

// Cliente de Supabase - usando Service Role Key para bypasear RLS
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-my-custom-header': 'cotizaciones-api'
      }
    }
  }
);

console.log('🔐 Using Service Role Key (bypasses RLS)');
console.log('📦 Schema: public');

// Función de debug para verificar el problema
async function debugSupabaseConnection() {
  console.log('\n🔍 Debug: Verificando conexión con Supabase...');
  
  // Test 1: Verificar la respuesta básica de la API
  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    console.log('   API Status:', response.status);
    
    if (response.status !== 200) {
      const text = await response.text();
      console.log('   API Error:', text);
    }
  } catch (error) {
    console.log('   API Error:', error.message);
  }
  
  // Test 2: Probar con ANON key
  if (process.env.SUPABASE_ANON_KEY) {
    console.log('\n   Probando con ANON key...');
    const supabaseAnon = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    try {
      const { data, error } = await supabaseAnon
        .from('clientes')
        .select('id')
        .limit(1);
      
      if (error) {
        console.log('   ANON Error:', error.message);
      } else {
        console.log('   ANON Success: Puede acceder a las tablas');
      }
    } catch (err) {
      console.log('   ANON Exception:', err.message);
    }
  }
  
  console.log('\n💡 Si ANON funciona pero SERVICE_ROLE no, ejecuta este SQL en Supabase:');
  console.log('   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;');
  console.log('   GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;');
  console.log('');
}

// Ejecutar debug al inicio
debugSupabaseConnection();

// Función para probar la conexión sin depender de tablas específicas
const testConnection = async () => {
  try {
    console.log('🔄 Probando conexión a Supabase...');
    console.log('📍 URL:', process.env.SUPABASE_URL);
    
    // Verificar que las variables de entorno estén definidas
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
      return false;
    }
    
    // Test usando REST API directamente
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    
    if (!response.ok) {
      console.error('❌ Error de conexión con Supabase. Status:', response.status);
      const errorText = await response.text();
      console.error('Respuesta:', errorText);
      return false;
    }
    
    // Intentar una query simple para verificar que realmente funciona
    // Usamos limit=1 para minimizar la carga
    const { error } = await supabase
      .from('clientes')
      .select('id')
      .limit(1);
    
    if (error) {
      // Si el error es de tabla no encontrada o RLS, la conexión está bien
      if (error.code === '42P01' || error.message.includes('relation') || 
          error.code === '42501' || error.message.includes('RLS')) {
        console.log('⚠️  Conexión establecida, pero verificar permisos de tablas');
        console.log('✅ Conexión a Supabase establecida correctamente');
        return true;
      }
      console.error('❌ Error al consultar la base de datos:', error.message);
      return false;
    }
    
    console.log('✅ Conexión a Supabase establecida correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return false;
  }
};

// Funciones helper para queries usando Supabase con manejo de errores mejorado
const queryHelpers = {
  // Verificar conexión y obtener info básica
  async healthCheck() {
    try {
      // Intentar acceder a metadatos públicos de Supabase
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      });
      
      if (response.ok) {
        return { success: true, message: 'Conexión a Supabase establecida' };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Obtener conteo con manejo de errores
  async getCount(table) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`Error al contar registros en ${table}:`, error.message);
        throw error;
      }
      return count || 0;
    } catch (error) {
      console.error(`Error en getCount para tabla ${table}:`, error.message);
      throw error;
    }
  },

  // Obtener registros con manejo robusto de errores
  async getRecords(table, options = {}) {
    try {
      const { 
        select = '*', 
        limit = 50, 
        offset = 0, 
        orderBy = 'id',
        ascending = true,
        filters = {}
      } = options;

      let query = supabase
        .from(table)
        .select(select)
        .order(orderBy, { ascending })
        .range(offset, offset + limit - 1);

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { data, error, count } = await query;
      
      if (error) {
        console.error(`Error al obtener registros de ${table}:`, error.message);
        throw error;
      }
      
      return { data: data || [], count: count || 0 };
    } catch (error) {
      console.error(`Error en getRecords para tabla ${table}:`, error.message);
      throw error;
    }
  },

  // Obtener un registro por ID
  async getById(table, id) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`Error al obtener registro ${id} de ${table}:`, error.message);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error(`Error en getById para tabla ${table}, id ${id}:`, error.message);
      throw error;
    }
  },

  // Crear un nuevo registro
  async create(table, data) {
    try {
      const { data: newRecord, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error(`Error al crear registro en ${table}:`, error.message);
        throw error;
      }
      
      return newRecord;
    } catch (error) {
      console.error(`Error en create para tabla ${table}:`, error.message);
      throw error;
    }
  },

  // Actualizar un registro
  async update(table, id, data) {
    try {
      const { data: updatedRecord, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`Error al actualizar registro ${id} en ${table}:`, error.message);
        throw error;
      }
      
      return updatedRecord;
    } catch (error) {
      console.error(`Error en update para tabla ${table}, id ${id}:`, error.message);
      throw error;
    }
  },

  // Eliminar un registro (soft delete si existe campo 'activo')
  async delete(table, id) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`Error al eliminar registro ${id} de ${table}:`, error.message);
        throw error;
      }
      
      return { success: true };
    } catch (error) {
      console.error(`Error en delete para tabla ${table}, id ${id}:`, error.message);
      throw error;
    }
  },

  // Ejecutar una query personalizada con joins
  async customQuery(table, options = {}) {
    try {
      const { 
        select = '*',
        joins = [],
        filters = {},
        orderBy = null,
        limit = null,
        single = false
      } = options;

      let query = supabase.from(table).select(select);

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object' && value.operator) {
            // Filtros con operadores especiales
            switch (value.operator) {
              case 'ilike':
                query = query.ilike(key, value.value);
                break;
              case 'in':
                query = query.in(key, value.value);
                break;
              case 'gt':
                query = query.gt(key, value.value);
                break;
              case 'gte':
                query = query.gte(key, value.value);
                break;
              case 'lt':
                query = query.lt(key, value.value);
                break;
              case 'lte':
                query = query.lte(key, value.value);
                break;
              default:
                query = query.eq(key, value.value);
            }
          } else {
            query = query.eq(key, value);
          }
        }
      });

      // Ordenamiento
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending !== false });
      }

      // Límite
      if (limit) {
        query = query.limit(limit);
      }

      // Single result
      if (single) {
        query = query.single();
      }

      const { data, error } = await query;

      if (error) {
        console.error(`Error en customQuery para tabla ${table}:`, error.message);
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`Error en customQuery:`, error.message);
      throw error;
    }
  }
};

module.exports = {
  supabase,
  testConnection,
  queryHelpers
};
