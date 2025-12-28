import fetch from 'node-fetch';

const API = 'https://edificio-admin.sebastianvernis.workers.dev';
const PAGES = 'https://chispartbuilding.pages.dev';

console.log('🧪 Testing Login Flow\n');

// Test 1: Login page loads
console.log('1️⃣  GET /login');
const loginPage = await fetch(`${PAGES}/login`);
const loginHtml = await loginPage.text();
console.log(`   Status: ${loginPage.status}`);
console.log(`   Has login form: ${loginHtml.includes('login-form') ? '✅' : '❌'}`);
console.log(`   Has auth.js: ${loginHtml.includes('auth.js') ? '✅' : '❌'}`);
console.log('');

// Test 2: Login API
console.log('2️⃣  POST /api/auth/login');
const login = await fetch(`${API}/api/auth/login`, {
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
console.log(`   Token: ${loginData.token ? '✅' : '❌'}`);
console.log(`   User: ${loginData.user?.nombre}`);
console.log('');

// Test 3: Index is landing
console.log('3️⃣  GET / (should be landing)');
const index = await fetch(`${PAGES}/`);
const indexHtml = await index.text();
console.log(`   Status: ${index.status}`);
console.log(`   Is landing: ${indexHtml.includes('Gestión Inteligente') ? '✅' : '❌'}`);
console.log(`   Has pricing: ${indexHtml.includes('Planes para cada') ? '✅' : '❌'}`);
console.log('');

console.log('═══════════════════════════════════════════════════');
console.log('✅ Login Flow Test Complete!');
console.log('');
console.log('URLs:');
console.log(`   Landing: ${PAGES}/`);
console.log(`   Login: ${PAGES}/login`);
console.log(`   Register: ${PAGES}/register`);
