import fetch from 'node-fetch';

const BASE_URL = 'https://chispartbuilding.pages.dev';

console.log('🧪 Verificando Páginas SAAS Desplegadas\n');

const pages = [
  { path: '/landing', name: 'Landing Page SAAS' },
  { path: '/register', name: 'Registro' },
  { path: '/verify-otp', name: 'Verificación OTP' },
  { path: '/checkout', name: 'Checkout' },
  { path: '/setup', name: 'Setup Edificio' },
  { path: '/activate', name: 'Activación' },
  { path: '/', name: 'Login (Index)' },
  { path: '/admin', name: 'Dashboard Admin' },
  { path: '/inquilino', name: 'Dashboard Inquilino' },
  { path: '/theme-customizer', name: 'Customizador de Temas' }
];

for (const page of pages) {
  try {
    const response = await fetch(BASE_URL + page.path);
    const text = await response.text();
    const hasHtml = text.includes('<html');
    const hasTitle = text.includes('<title>');
    const status = response.status === 200 ? '✅' : '❌';
    
    console.log(`${status} ${page.name}`);
    console.log(`   URL: ${page.path}`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Has HTML: ${hasHtml ? '✅' : '❌'}`);
    console.log(`   Size: ${(text.length / 1024).toFixed(1)} KB`);
    console.log('');
  } catch (error) {
    console.log(`❌ ${page.name}`);
    console.log(`   Error: ${error.message}`);
    console.log('');
  }
}

console.log('═══════════════════════════════════════════════════');
console.log('✅ Verificación Completa');
console.log(`\n🌐 Accede a la Landing SAAS:\n   ${BASE_URL}/landing\n`);
