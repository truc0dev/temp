#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración para deploy en Vercel...\n');

// Verificar archivos críticos
const criticalFiles = [
  'vercel.json',
  'package.json',
  'angular.json',
  'src/environments/environment.prod.ts',
  'src/main.ts',
  'src/index.html'
];

console.log('📁 Verificando archivos críticos:');
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - FALTANTE`);
  }
});

// Verificar configuración de environment
console.log('\n🌍 Verificando configuración de environment:');
try {
  const envProd = fs.readFileSync('src/environments/environment.prod.ts', 'utf8');
  if (envProd.includes('your-backend-url.vercel.app')) {
    console.log('⚠️  IMPORTANTE: Cambiar la URL del backend en environment.prod.ts');
  } else {
    console.log('✅ URL del backend configurada');
  }
} catch (error) {
  console.log('❌ Error leyendo environment.prod.ts');
}

// Verificar scripts de build
console.log('\n🔧 Verificando scripts de build:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (packageJson.scripts['build:prod']) {
    console.log('✅ Script build:prod encontrado');
  } else {
    console.log('❌ Script build:prod faltante');
  }
} catch (error) {
  console.log('❌ Error leyendo package.json');
}

// Verificar configuración de Vercel
console.log('\n🚀 Verificando configuración de Vercel:');
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  if (vercelConfig.buildCommand && vercelConfig.outputDirectory) {
    console.log('✅ Configuración de Vercel correcta');
  } else {
    console.log('❌ Configuración de Vercel incompleta');
  }
} catch (error) {
  console.log('❌ Error leyendo vercel.json');
}

console.log('\n📋 Resumen de verificación completado.');
console.log('\n💡 Próximos pasos:');
console.log('1. Cambiar la URL del backend en environment.prod.ts');
console.log('2. Ejecutar: npm run build:prod (para probar localmente)');
console.log('3. Deploy en Vercel: vercel');
