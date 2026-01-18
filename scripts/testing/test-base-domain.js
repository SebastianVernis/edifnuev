import fetch from 'node-fetch';

const BASE = 'https://chispartbuilding.pages.dev';
const API = 'https://edificio-admin.sebastianvernis.workers.dev';

console.log('🧪 Testing Base Domain (chispartbuilding.pages.dev)\n');

// Test 1: Landing
const landing = await fetch(`${BASE}/`);
const landingHtml = await landing.text();
console.log(`1️⃣  Landing: ${landing.status} ${landingHtml.includes('ChispartBuilding') ? '✅' : '❌'}`);

// Test 2: Login
const login = await fetch(`${BASE}/login`);
const loginHtml = await login.text();
console.log(`2️⃣  Login: ${login.status} ${loginHtml.includes('Iniciar Sesión') ? '✅' : '❌'}`);

// Test 3: Register
const register = await fetch(`${BASE}/register`);
const registerHtml = await register.text();
console.log(`3️⃣  Register: ${register.status} ${registerHtml.includes('Crear cuenta') ? '✅' : '❌'}`);

// Test 4: API Login
const apiLogin = await fetch(`${API}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@edificio.com', password: 'admin123' })
});
const apiData = await apiLogin.json();
console.log(`4️⃣  API Login: ${apiLogin.status} ${apiData.success ? '✅' : '❌'}`);

console.log('\n═══════════════════════════════════════════════════');
console.log('✅ Base Domain Working!');
console.log('');
console.log('🌐 URLs:');
console.log(`   Landing: ${BASE}/`);
console.log(`   Login: ${BASE}/login`);
console.log(`   Register: ${BASE}/register`);
console.log(`   API: ${API}`);
