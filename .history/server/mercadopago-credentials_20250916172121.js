// Credenciales de Mercado Pago
// Reemplaza estas credenciales con las tuyas reales

module.exports = {
  // Para desarrollo/pruebas (obtén estas de Mercado Pago Developers)
  TEST_ACCESS_TOKEN: 'TEST-1234567890123456789012345678901234567890',
  TEST_PUBLIC_KEY: 'TEST-12345678-1234-1234-1234-123456789012',
  /*
  // Para producción (obtén estas de Mercado Pago Developers)
  PROD_ACCESS_TOKEN: 'APP_USR-1234567890123456789012345678901234567890-1234567890',
  PROD_PUBLIC_KEY: 'APP_USR-12345678-1234-1234-1234-123456789012',
  */
  // Usar credenciales de prueba por defecto
  USE_TEST_CREDENTIALS: true
};

/*
INSTRUCCIONES PARA OBTENER CREDENCIALES REALES:

1. Ve a https://www.mercadopago.com.ar/developers
2. Inicia sesión o crea una cuenta
3. Ve a "Tus integraciones" > "Credenciales"
4. Copia las credenciales de prueba (TEST) para desarrollo
5. Para producción, usa las credenciales de producción

CREDENCIALES DE PRUEBA (para desarrollo):
- Access Token: TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxx
- Public Key: TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

CREDENCIALES DE PRODUCCIÓN (para uso real):
- Access Token: APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxx
- Public Key: APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

NOTA: Las credenciales de prueba te permiten hacer pagos simulados sin cobrar dinero real.
*/
