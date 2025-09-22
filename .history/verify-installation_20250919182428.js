#!/usr/bin/env node

console.log('🔍 Verificando instalación del proyecto Ticketing App...\n');

const fs = require('fs');
const path = require('path');

let errors = [];
let warnings = [];
let success = [];

// Verificar archivos críticos
const criticalFiles = [
  'server/package.json',
  'client/package.json',
  'server/.env',
  'server/env.example',
  'server/index.js',
  'server/database/setup.js',
  'server/middleware/auth.js',
  'server/middleware/validation.js'
];

console.log('📁 Verificando archivos críticos...');
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    success.push(`✅ ${file} - OK`);
  } else {
    errors.push(`❌ ${file} - FALTA`);
  }
});

// Verificar dependencias del servidor
console.log('\n📦 Verificando dependencias del servidor...');
try {
  const serverPackage = JSON.parse(fs.readFileSync('server/package.json', 'utf8'));
  const requiredDeps = ['express', 'cors', 'sqlite3', 'mercadopago', 'jsonwebtoken', 'bcryptjs'];
  
  requiredDeps.forEach(dep => {
    if (serverPackage.dependencies && serverPackage.dependencies[dep]) {
      success.push(`✅ ${dep} - ${serverPackage.dependencies[dep]}`);
    } else {
      errors.push(`❌ ${dep} - FALTA`);
    }
  });
  
  // Verificar si node_modules existe
  if (fs.existsSync('server/node_modules')) {
    success.push(`✅ server/node_modules - OK`);
  } else {
    warnings.push(`⚠️  server/node_modules - FALTA. Ejecuta: cd server && npm install`);
  }
} catch (e) {
  errors.push(`❌ Error leyendo server/package.json`);
}

// Verificar dependencias del cliente
console.log('\n📱 Verificando dependencias del cliente...');
try {
  const clientPackage = JSON.parse(fs.readFileSync('client/package.json', 'utf8'));
  const requiredDeps = ['react', 'react-dom', 'axios', 'react-router-dom'];
  
  requiredDeps.forEach(dep => {
    if (clientPackage.dependencies && clientPackage.dependencies[dep]) {
      success.push(`✅ ${dep} - ${clientPackage.dependencies[dep]}`);
    } else {
      errors.push(`❌ ${dep} - FALTA`);
    }
  });
  
  // Verificar que no tenga dependencias de Stripe
  if (clientPackage.dependencies && clientPackage.dependencies['@stripe/stripe-js']) {
    warnings.push(`⚠️  Dependencia innecesaria @stripe/stripe-js encontrada`);
  } else {
    success.push(`✅ Sin dependencias de Stripe - OK`);
  }
  
  // Verificar si node_modules existe
  if (fs.existsSync('client/node_modules')) {
    success.push(`✅ client/node_modules - OK`);
  } else {
    warnings.push(`⚠️  client/node_modules - FALTA. Ejecuta: cd client && npm install`);
  }
} catch (e) {
  errors.push(`❌ Error leyendo client/package.json`);
}

// Verificar configuración
console.log('\n⚙️  Verificando configuración...');
try {
  const envExample = fs.readFileSync('server/env.example', 'utf8');
  if (envExample.includes('MERCADOPAGO_ACCESS_TOKEN')) {
    success.push(`✅ Configuración MercadoPago en env.example`);
  } else {
    warnings.push(`⚠️  Falta configuración MercadoPago en env.example`);
  }
  
  if (fs.existsSync('server/.env')) {
    success.push(`✅ Archivo .env existe`);
  } else {
    warnings.push(`⚠️  Archivo .env no existe. Copia server/env.example a server/.env`);
  }
} catch (e) {
  errors.push(`❌ Error verificando configuración`);
}

// Mostrar resumen
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN DE LA VERIFICACIÓN');
console.log('='.repeat(60));

if (success.length > 0) {
  console.log('\n🎉 ELEMENTOS OK:');
  success.forEach(item => console.log(item));
}

if (warnings.length > 0) {
  console.log('\n⚠️  ADVERTENCIAS:');
  warnings.forEach(item => console.log(item));
}

if (errors.length > 0) {
  console.log('\n❌ ERRORES CRÍTICOS:');
  errors.forEach(item => console.log(item));
}

console.log('\n' + '='.repeat(60));

if (errors.length === 0) {
  console.log('🚀 ESTADO: LISTO PARA EJECUTAR');
  console.log('\nPara iniciar la aplicación:');
  console.log('npm run dev');
} else {
  console.log('🔧 ESTADO: REQUIERE REPARACIONES');
  console.log('\nCorrige los errores críticos antes de continuar.');
}

if (warnings.length > 0) {
  console.log('\n💡 RECOMENDACIONES:');
  console.log('- Instala las dependencias faltantes');
  console.log('- Configura las variables de entorno');
  console.log('- Revisa las advertencias listadas arriba');
}

console.log('\n📖 Para más información, lee el archivo README.md');
console.log('='.repeat(60));