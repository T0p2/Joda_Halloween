// Script para probar las credenciales de MercadoPago
const { MercadoPagoConfig, Preference } = require('mercadopago');
const credentials = require('./mercadopago-credentials');

console.log('🧪 Probando credenciales de MercadoPago...');
console.log('Credenciales configuradas:');
console.log('- USE_TEST_CREDENTIALS:', credentials.USE_TEST_CREDENTIALS);
console.log('- ACCESS_TOKEN:', credentials.TEST_ACCESS_TOKEN ? 'Configurado ✅' : 'No configurado ❌');
console.log('- PUBLIC_KEY:', credentials.TEST_PUBLIC_KEY ? 'Configurado ✅' : 'No configurado ❌');

// Configurar cliente
const accessToken = credentials.USE_TEST_CREDENTIALS 
  ? credentials.TEST_ACCESS_TOKEN 
  : credentials.PROD_ACCESS_TOKEN;

const client = new MercadoPagoConfig({ 
  accessToken: accessToken
});

console.log('\n🔧 Configurando cliente MercadoPago...');

// Crear una preferencia de prueba
async function testPreference() {
  try {
    console.log('📝 Creando preferencia de prueba...');
    
    const preference = {
      items: [
        {
          title: "Test - Entrada de Prueba",
          unit_price: 100.00,
          quantity: 1,
          currency_id: 'ARS'
        }
      ],
      payer: {
        name: "Test User",
        email: "test@example.com"
      },
      back_urls: {
        success: 'http://localhost:3000/success',
        failure: 'http://localhost:3000/failure',
        pending: 'http://localhost:3000/pending'
      },
      auto_return: 'approved',
      external_reference: `TEST-${Date.now()}`,
      expires: true,
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    };

    const preferenceClient = new Preference(client);
    const response = await preferenceClient.create({ body: preference });
    
    console.log('✅ ¡Preferencia creada exitosamente!');
    console.log('- ID:', response.id);
    console.log('- Init Point:', response.init_point ? 'Generado ✅' : 'No generado ❌');
    console.log('- Sandbox Init Point:', response.sandbox_init_point ? 'Generado ✅' : 'No generado ❌');
    
    return true;
  } catch (error) {
    console.error('❌ Error al crear preferencia:');
    console.error('- Mensaje:', error.message);
    console.error('- Código:', error.status);
    console.error('- Detalles:', error.cause);
    
    if (error.message.includes('invalid_token')) {
      console.log('\n💡 Solución: Verifica que las credenciales sean correctas');
    } else if (error.message.includes('bad_request')) {
      console.log('\n💡 Solución: Verifica el formato de las credenciales');
    }
    
    return false;
  }
}

// Ejecutar prueba
testPreference().then(success => {
  if (success) {
    console.log('\n🎉 ¡Las credenciales de MercadoPago funcionan correctamente!');
  } else {
    console.log('\n⚠️ Hay problemas con las credenciales de MercadoPago');
    console.log('\n📋 Pasos para solucionarlo:');
    console.log('1. Ve a https://www.mercadopago.com.ar/developers');
    console.log('2. Inicia sesión o crea una cuenta');
    console.log('3. Ve a "Tus integraciones" > "Credenciales"');
    console.log('4. Copia las credenciales de prueba (TEST)');
    console.log('5. Actualiza el archivo mercadopago-credentials.js');
  }
  process.exit(success ? 0 : 1);
});
