// Script para probar la conexión IMAP y listar carpetas disponibles
const Imap = require('imap');

const imapConfig = {
  user: process.env.IMAP_USER,
  password: process.env.IMAP_PASSWORD,
  host: process.env.IMAP_HOST || 'us2.imap.mailhostbox.com',
  port: Number(process.env.IMAP_PORT || 993),
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

if (!imapConfig.user || !imapConfig.password) {
  console.error('❌ Faltan credenciales IMAP. Define IMAP_USER e IMAP_PASSWORD en variables de entorno.');
  process.exit(1);
}

console.log('🔍 Probando conexión IMAP...');
console.log('Host:', imapConfig.host);
console.log('Puerto:', imapConfig.port);
console.log('Usuario:', imapConfig.user);
console.log('---');

const imap = new Imap(imapConfig);

imap.once('ready', () => {
  console.log('✅ Conexión IMAP exitosa!');
  console.log('---');
  
  // Listar todas las carpetas
  imap.getBoxes((err, boxes) => {
    if (err) {
      console.error('❌ Error al obtener carpetas:', err);
      imap.end();
      return;
    }
    
    console.log('📁 Carpetas disponibles:');
    console.log(JSON.stringify(boxes, null, 2));
    console.log('---');
    
    // Intentar abrir INBOX para verificar acceso
    imap.openBox('INBOX', true, (err, box) => {
      if (err) {
        console.error('❌ Error al abrir INBOX:', err);
      } else {
        console.log('✅ INBOX abierto exitosamente');
        console.log('Mensajes totales:', box.messages.total);
        console.log('Mensajes nuevos:', box.messages.new);
      }
      
      imap.end();
    });
  });
});

imap.once('error', (err) => {
  console.error('❌ Error de conexión IMAP:', err.message);
  console.error('Detalles:', err);
  process.exit(1);
});

imap.once('end', () => {
  console.log('---');
  console.log('🔌 Conexión IMAP cerrada');
  process.exit(0);
});

console.log('Conectando...');

// Timeout de seguridad
setTimeout(() => {
  console.error('⏱️ Timeout: No se pudo conectar en 15 segundos');
  process.exit(1);
}, 15000);

imap.connect();
