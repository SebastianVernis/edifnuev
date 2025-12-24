/**
 * Script de Validación de Cloudflare Access
 * Verifica que el Service Token esté configurado correctamente
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const BASE_URL = 'https://edificio-admin-saas-adapted.sebastianvernis.workers.dev';

async function validateAccess() {
  console.log('🔍 Validating Cloudflare Access configuration...\n');
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // Verificar variables de entorno
  if (process.env.CF_ACCESS_CLIENT_ID && process.env.CF_ACCESS_CLIENT_SECRET) {
    headers['CF-Access-Client-Id'] = process.env.CF_ACCESS_CLIENT_ID;
    headers['CF-Access-Client-Secret'] = process.env.CF_ACCESS_CLIENT_SECRET;
    console.log('✅ Service Token configured');
    console.log(`   Client ID: ${process.env.CF_ACCESS_CLIENT_ID.substring(0, 8)}...`);
    console.log('');
  } else {
    console.log('❌ Service Token NOT configured\n');
    console.log('Missing environment variables:');
    if (!process.env.CF_ACCESS_CLIENT_ID) console.log('  - CF_ACCESS_CLIENT_ID');
    if (!process.env.CF_ACCESS_CLIENT_SECRET) console.log('  - CF_ACCESS_CLIENT_SECRET');
    console.log('\nCreate .env file with:');
    console.log('CF_ACCESS_CLIENT_ID=your-client-id');
    console.log('CF_ACCESS_CLIENT_SECRET=your-client-secret\n');
    process.exit(1);
  }
  
  try {
    console.log('🔄 Testing login endpoint...\n');
    
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: 'admin@edificio205.com',
        password: 'Gemelo1'
      })
    });
    
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();
    
    console.log('📊 Response Details:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${contentType || 'Not set'}`);
    console.log('');
    
    // Caso 1: Éxito - JSON con ok: true
    if (response.status === 200 && isJson && data.ok) {
      console.log('✅ SUCCESS: Cloudflare Access bypass working!');
      console.log('✅ Service Token configured correctly');
      console.log('✅ API responding with valid JSON');
      console.log('');
      console.log('🎯 Response data:');
      console.log(JSON.stringify(data, null, 2));
      console.log('');
      console.log('🚀 Ready to run E2E tests:');
      console.log('   npm run test:e2e');
      console.log('');
      process.exit(0);
    }
    
    // Caso 2: Bloqueado - HTML de Cloudflare Access
    if (typeof data === 'string' && data.includes('Cloudflare Access')) {
      console.log('❌ FAILED: Still blocked by Cloudflare Access\n');
      console.log('The Service Token is not working. Please verify:\n');
      console.log('1. Service Token created in Cloudflare Dashboard');
      console.log('   Zero Trust > Access > Service Auth\n');
      console.log('2. Policy added to Application');
      console.log('   Zero Trust > Access > Applications > edificio-admin-saas-adapted\n');
      console.log('3. Variables in .env are correct');
      console.log('   CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET\n');
      console.log('4. Policy includes Service Token "E2E Testing SmartBuilding"\n');
      console.log('');
      process.exit(1);
    }
    
    // Caso 3: Credenciales incorrectas (pero Service Token funcionó)
    if (response.status === 401 && isJson) {
      console.log('⚠️  WARNING: Service Token working, but login failed\n');
      console.log('✅ Cloudflare Access bypass successful!');
      console.log('❌ Login credentials incorrect\n');
      console.log('This is OK - it means the Service Token is working.');
      console.log('The test user might not exist in the database.\n');
      console.log('🚀 Ready to run E2E tests with proper credentials:');
      console.log('   npm run test:e2e');
      console.log('');
      process.exit(0);
    }
    
    // Caso 4: Respuesta inesperada
    console.log('⚠️  WARNING: Unexpected response\n');
    console.log('Response preview:');
    console.log(typeof data === 'string' ? data.substring(0, 300) : JSON.stringify(data, null, 2));
    console.log('\n');
    console.log('Check configuration and try again');
    console.log('');
    process.exit(1);
    
  } catch (error) {
    console.error('\n💥 ERROR:', error.message);
    console.error('\nStack:', error.stack);
    console.log('');
    process.exit(1);
  }
}

// Ejecutar validación
validateAccess();
