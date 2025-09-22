// Script para verificar si el servidor está funcionando
const http = require('http');

console.log('🔍 Verificando estado del servidor...');

// Función para hacer una petición HTTP
function checkServer(port, path = '/api/health') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          port: port,
          path: path,
          status: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (err) => {
      reject({
        port: port,
        path: path,
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        port: port,
        path: path,
        error: 'Timeout'
      });
    });

    req.end();
  });
}

// Verificar puerto 5000 (servidor backend)
checkServer(5000, '/api/health')
  .then(result => {
    console.log('✅ Servidor backend (puerto 5000):');
    console.log(`   Status: ${result.status}`);
    console.log(`   Response: ${result.data}`);
    
    // Verificar endpoint de MercadoPago
    return checkServer(5000, '/api/mercadopago/test');
  })
  .then(result => {
    console.log('\n✅ Endpoint MercadoPago:');
    console.log(`   Status: ${result.status}`);
    console.log(`   Response: ${result.data}`);
  })
  .catch(error => {
    console.log('❌ Error con servidor backend (puerto 5000):');
    console.log(`   Error: ${error.error}`);
    console.log('\n💡 Soluciones:');
    console.log('   1. Asegúrate de que el servidor esté corriendo');
    console.log('   2. Ejecuta: npm run dev');
    console.log('   3. Verifica que no haya errores en la consola del servidor');
  });

// Verificar puerto 3000 (servidor frontend)
checkServer(3000, '/')
  .then(result => {
    console.log('\n✅ Servidor frontend (puerto 3000):');
    console.log(`   Status: ${result.status}`);
  })
  .catch(error => {
    console.log('\n❌ Error con servidor frontend (puerto 3000):');
    console.log(`   Error: ${error.error}`);
    console.log('\n💡 Soluciones:');
    console.log('   1. Asegúrate de que React esté corriendo');
    console.log('   2. Ejecuta: npm run dev');
    console.log('   3. Verifica que no haya errores en la consola');
  });
