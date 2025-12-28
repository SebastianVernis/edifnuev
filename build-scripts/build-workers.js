#!/usr/bin/env node

/**
 * Build script para Cloudflare Workers
 * Genera un bundle completo para deployment
 */

import esbuild from 'esbuild';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🏗️  Building for Cloudflare Workers...\n');

try {
  // Build worker bundle
  await esbuild.build({
    entryPoints: [path.join(rootDir, 'workers-build/index.js')],
    bundle: true,
    format: 'esm',
    target: 'es2022',
    outfile: path.join(rootDir, 'dist/worker.js'),
    platform: 'browser',
    minify: true,
    sourcemap: false,
    external: [],
    logLevel: 'info',
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  });

  console.log('✅ Worker bundle created: dist/worker.js');
  console.log('✅ Ready for deployment with: wrangler deploy\n');

} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
