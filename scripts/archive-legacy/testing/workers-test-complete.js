import fetch from 'node-fetch';

const URL = 'https://edificio-admin.sebastianvernis.workers.dev';

console.log('🧪 Cloudflare Workers - Complete Test Suite\n');

// Test 1: Health
console.log('1️⃣  Health Check...');
const health = await fetch(`${URL}/api/validation/health`);
const healthData = await health.json();
console.log(`   Status: ${health.status}`);
console.log(`   Response:`, healthData);
console.log('');

// Test 2: Login
console.log('2️⃣  Login Test...');
const login = await fetch(`${URL}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@edificio.com', password: 'admin123' })
});
const loginData = await login.json();
console.log(`   Status: ${login.status}`);
console.log(`   Success: ${loginData.success}`);
console.log(`   Token: ${loginData.token ? loginData.token.substring(0, 30) + '...' : 'N/A'}`);
console.log('');

// Test 3: Usuarios con auth
if (loginData.token) {
  console.log('3️⃣  Get Usuarios (with auth)...');
  const usuarios = await fetch(`${URL}/api/usuarios`, {
    headers: { 'Authorization': `Bearer ${loginData.token}` }
  });
  const usuariosData = await usuarios.json();
  console.log(`   Status: ${usuarios.status}`);
  console.log(`   Success: ${usuariosData.success}`);
  console.log(`   Usuarios: ${usuariosData.usuarios?.length || 0}`);
  console.log('');
}

// Test 4: Frontend
console.log('4️⃣  Frontend Test...');
const frontend = await fetch(`${URL}/`);
console.log(`   Status: ${frontend.status}`);
const frontendText = await frontend.text();
console.log(`   Has content: ${frontendText.length > 0}`);
console.log(`   Is HTML: ${frontendText.includes('<html')}`);
console.log('');

console.log('✅ Tests completed!');
