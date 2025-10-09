/**
 * Script de prueba para diagnosticar problemas con puppeteer
 * Ejecutar con: node scripts/test-puppeteer.js
 */

const puppeteer = require('puppeteer');

async function testPuppeteer() {
  console.log('🔍 Iniciando prueba de Puppeteer...\n');
  
  let browser = null;
  try {
    console.log('1. Lanzando navegador...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
      ]
    });
    console.log('✅ Navegador lanzado correctamente\n');
    
    console.log('2. Creando nueva página...');
    const page = await browser.newPage();
    console.log('✅ Página creada\n');
    
    console.log('3. Configurando viewport...');
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 1,
    });
    console.log('✅ Viewport configurado\n');
    
    console.log('4. Cargando HTML de prueba...');
    const testHTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Test PDF</title>
  <style>
    @page { size: A4 portrait; margin:0; }
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { color: #ff5600; }
  </style>
</head>
<body>
  <h1>Test PDF Generation</h1>
  <p>Este es un documento de prueba para verificar que Puppeteer funcione correctamente.</p>
  <p>Si ves este PDF, significa que todo está funcionando bien.</p>
</body>
</html>`;
    
    await page.setContent(testHTML, {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    console.log('✅ HTML cargado\n');
    
    console.log('5. Esperando estabilización...');
    await page.evaluate(() => new Promise(res => setTimeout(res, 200)));
    console.log('✅ Layout estabilizado\n');
    
    console.log('6. Generando PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      printBackground: true,
      timeout: 30000
    });
    console.log('✅ PDF generado, tamaño:', pdfBuffer.length, 'bytes\n');
    
    console.log('7. Cerrando página...');
    await page.close();
    console.log('✅ Página cerrada\n');
    
    console.log('8. Cerrando navegador...');
    await browser.close();
    browser = null;
    console.log('✅ Navegador cerrado\n');
    
    console.log('🎉 ¡Todas las pruebas pasaron exitosamente!');
    console.log('   Puppeteer está funcionando correctamente.');
    
  } catch (error) {
    console.error('\n❌ Error durante la prueba:');
    console.error('   Mensaje:', error.message);
    console.error('   Stack:', error.stack);
    
    if (browser) {
      console.log('\n🔧 Intentando cerrar el navegador...');
      try {
        await browser.close();
        console.log('✅ Navegador cerrado');
      } catch (closeError) {
        console.error('❌ Error al cerrar el navegador:', closeError.message);
      }
    }
    
    process.exit(1);
  }
}

testPuppeteer();
