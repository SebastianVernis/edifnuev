import fetch from 'node-fetch';

const WORKER_API = 'https://edificio-admin.sebastianvernis.workers.dev';
const PAGES_FRONTEND = 'https://production.chispartbuilding.pages.dev';

console.log('🧪 Full Integration Test\n');
console.log('═══════════════════════════════════════════════════\n');

// Test 1: Frontend loads
console.log('1️⃣  Frontend (Pages)...');
const frontend = await fetch(PAGES_FRONTEND);
const html = await frontend.text();
console.log(`   Status: ${frontend.status}`);
console.log(`   Has config.js: ${html.includes('config.js') ? '✅' : '❌'}`);
console.log(`   Is HTML: ${html.includes('<html') ? '✅' : '❌'}`);
console.log(`   Has login form: ${html.includes('login-form') ? '✅' : '❌'}`);
console.log('');

// Test 2: API Health
console.log('2️⃣  API Health Check...');
const health = await fetch(`${WORKER_API}/api/validation/health`);
const healthData = await health.json();
console.log(`   Status: ${health.status}`);
console.log(`   Environment: ${healthData.environment}`);
console.log(`   Version: ${healthData.version}`);
console.log('');

// Test 3: Login
console.log('3️⃣  Login Flow...');
const login = await fetch(`${WORKER_API}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'admin@edificio.com', 
    password: 'admin123' 
  })
});
const loginData = await login.json();
console.log(`   Status: ${login.status}`);
console.log(`   Success: ${loginData.success ? '✅' : '❌'}`);
console.log(`   Token received: ${loginData.token ? '✅' : '❌'}`);
console.log(`   User: ${loginData.user?.nombre}`);
console.log('');

// Test 4: Protected endpoint
if (loginData.token) {
  console.log('4️⃣  Protected Endpoint (Usuarios)...');
  const usuarios = await fetch(`${WORKER_API}/api/usuarios`, {
    headers: { 'Authorization': `Bearer ${loginData.token}` }
  });
  const usuariosData = await usuarios.json();
  console.log(`   Status: ${usuarios.status}`);
  console.log(`   Success: ${usuariosData.success ? '✅' : '❌'}`);
  console.log(`   Users count: ${usuariosData.usuarios?.length || 0}`);
  console.log('');
}

// Test 5: CORS
console.log('5️⃣  CORS Headers...');
const corsTest = await fetch(`${WORKER_API}/api/validation/health`);
const corsHeader = corsTest.headers.get('access-control-allow-origin');
console.log(`   CORS header: ${corsHeader}`);
console.log(`   CORS configured: ${corsHeader === '*' ? '✅' : '❌'}`);
console.log('');

console.log('═══════════════════════════════════════════════════');
console.log('✅ Integration Test Complete!');
console.log('═══════════════════════════════════════════════════');
console.log('');
console.log('🌐 URLs:');
console.log(`   Frontend: ${PAGES_FRONTEND}`);
console.log(`   API:      ${WORKER_API}`);
console.log('');
