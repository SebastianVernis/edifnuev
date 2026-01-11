#!/usr/bin/env node

/**
 * Build Script - Copia archivos estáticos a dist/ para GitHub Pages
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

console.log('🏗️  Building for GitHub Pages...');

// Limpiar dist
try {
  await fs.rm(distDir, { recursive: true, force: true });
} catch {}

// Crear dist
await fs.mkdir(distDir, { recursive: true });

// Copiar archivos públicos
async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

console.log('📦 Copying public files...');
const publicDir = path.join(rootDir, 'public');
await copyDir(publicDir, distDir);

// Crear archivo de configuración para GitHub Pages
const config = {
  apiUrl: 'https://edificio-admin-production.up.railway.app/api',
  environment: 'production'
};

await fs.writeFile(
  path.join(distDir, 'config.json'),
  JSON.stringify(config, null, 2)
);

console.log('✅ Build complete! Output: dist/');
console.log('📁 Files ready for GitHub Pages deployment');
