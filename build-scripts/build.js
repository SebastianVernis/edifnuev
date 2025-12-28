#!/usr/bin/env node

/**
 * Build Script - Verificación de archivos estáticos
 * El proyecto usa archivos estáticos directos, no build
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('✅ Build: Usando archivos estáticos directos');
console.log('📁 Verificando estructura...');

const requiredPaths = [
  'public/js/auth/auth.js',
  'public/js/components',
  'public/js/modules',
  'public/js/utils',
  'public/css',
  'public/index.html'
];

let allOk = true;

for (const p of requiredPaths) {
  const fullPath = path.join(rootDir, p);
  try {
    await fs.access(fullPath);
    console.log(`✅ ${p}`);
  } catch {
    console.error(`❌ Missing: ${p}`);
    allOk = false;
  }
}

if (allOk) {
  console.log('\n✅ Build verificado: Todos los archivos estáticos presentes');
  process.exit(0);
} else {
  console.error('\n❌ Build fallido: Archivos faltantes');
  process.exit(1);
}
