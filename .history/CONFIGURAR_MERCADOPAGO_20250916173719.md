# 🚀 Configurar MercadoPago - Guía Paso a Paso

## ⚠️ Problema Detectado

Si estás teniendo errores al hacer pagos, es porque **necesitas configurar tus propias credenciales de MercadoPago**.

Las credenciales actuales son de ejemplo y no funcionan para pagos reales.

## 📋 Solución: Obtener Credenciales Reales

### Paso 1: Crear Cuenta en MercadoPago Developers

1. Ve a [MercadoPago Developers](https://www.mercadopago.com.ar/developers)
2. Haz clic en **"Crear cuenta"** o **"Iniciar sesión"**
3. Completa el registro con tus datos reales

### Paso 2: Obtener Credenciales de Prueba

1. Una vez dentro de MercadoPago Developers, ve a **"Tus integraciones"**
2. Haz clic en **"Credenciales"**
3. Copia las credenciales de **PRUEBA** (no las de producción)

### Paso 3: Actualizar el Archivo

Abre el archivo `server/mercadopago-credentials.js` y reemplaza las credenciales:

```javascript
module.exports = {
  // Reemplaza con TUS credenciales reales
  TEST_ACCESS_TOKEN: 'TEST-TU_ACCESS_TOKEN_REAL_AQUI',
  TEST_PUBLIC_KEY: 'TEST-TU_PUBLIC_KEY_REAL_AQUI',
  
  // Mantén en true para usar credenciales de prueba
  USE_TEST_CREDENTIALS: true
};
```

### Paso 4: Probar la Configuración

1. Reinicia el servidor: `npm run dev`
2. **Diagnosticar**: Ve a http://localhost:5000/api/mercadopago/test para verificar que las credenciales se carguen correctamente
3. Si el diagnóstico muestra "hasAccessToken: true", ve a la aplicación y prueba hacer un pago
4. Si funciona, ¡listo! Si no, revisa los pasos anteriores

## 🔍 Cómo Identificar Credenciales Válidas

### ✅ Credenciales Válidas:
- **Access Token**: Empieza con `TEST-` seguido de muchos números
- **Public Key**: Empieza con `TEST-` seguido de formato UUID
- Ejemplo: `TEST-1234567890123456789012345678901234567890`

### ❌ Credenciales Inválidas:
- Las que están actualmente en el archivo (son de ejemplo)
- Credenciales que no empiecen con `TEST-`
- Credenciales muy cortas

## 🧪 Probar Pagos

Una vez configuradas las credenciales correctas, puedes probar con estas tarjetas:

### Tarjetas de Prueba:
- **Visa**: 4509 9535 6623 3704
- **Mastercard**: 5031 4332 1540 6351
- **CVV**: 123
- **Fecha**: Cualquier fecha futura

## 🚨 Errores Comunes

### "invalid_token"
- **Problema**: Las credenciales no son válidas
- **Solución**: Obtén credenciales reales de MercadoPago Developers

### "bad_request"
- **Problema**: Formato de credenciales incorrecto
- **Solución**: Verifica que copiaste las credenciales completas

### "El pago no se procesa"
- **Problema**: Credenciales de ejemplo (no reales)
- **Solución**: Configura tus credenciales reales

## 📞 ¿Necesitas Ayuda?

Si sigues teniendo problemas:

1. **Verifica** que las credenciales sean correctas
2. **Reinicia** el servidor después de cambiar las credenciales
3. **Revisa** los logs del servidor para ver errores específicos
4. **Confirma** que estés usando credenciales de PRUEBA para desarrollo

---

**¡Una vez configuradas las credenciales correctas, los pagos funcionarán perfectamente!** 🎉
