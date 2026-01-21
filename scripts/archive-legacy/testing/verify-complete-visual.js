import fetch from 'node-fetch';

const BASE = 'https://chispartbuilding.pages.dev';

console.log('🎨 Verificando Diseño Visual Completo\n');

const pages = [
  { url: '/', name: 'Index/Landing Principal', keywords: ['hero', 'features', 'pricing', 'ChispartBuilding'] },
  { url: '/landing', name: 'Landing SAAS', keywords: ['planes', 'Comenzar', 'ChispartBuilding'] },
  { url: '/register', name: 'Registro', keywords: ['prueba gratuita', 'plan', 'Crear cuenta'] },
  { url: '/crear-paquete', name: 'Constructor de Paquetes', keywords: ['Personalizado', 'unidades', 'calcul'] },
  { url: '/verify-otp', name: 'Verificar OTP', keywords: ['código', 'verificación', '6 dígitos'] },
  { url: '/checkout', name: 'Checkout', keywords: ['pago', 'tarjeta', 'checkout'] },
  { url: '/setup', name: 'Setup Edificio', keywords: ['configuración', 'edificio', 'wizard'] },
  { url: '/activate', name: 'Activación', keywords: ['activado', 'credenciales', 'bienvenid'] },
  { url: '/admin', name: 'Dashboard Admin', keywords: ['dashboard', 'admin', 'módulos'] }
];

for (const page of pages) {
  const response = await fetch(BASE + page.url);
  const html = await response.text();
  
  const hasKeywords = page.keywords.filter(k => 
    html.toLowerCase().includes(k.toLowerCase())
  );
  
  const status = response.status === 200 ? '✅' : '❌';
  const visual = hasKeywords.length >= 2 ? '✅' : '⚠️';
  
  console.log(`${status} ${page.name}`);
  console.log(`   URL: ${page.url}`);
  console.log(`   Status: ${response.status}`);
  console.log(`   Size: ${(html.length / 1024).toFixed(1)} KB`);
  console.log(`   Keywords: ${hasKeywords.length}/${page.keywords.length} ${visual}`);
  console.log(`   Found: ${hasKeywords.join(', ')}`);
  console.log('');
}

console.log('═══════════════════════════════════════════════════');
console.log('✅ Verificación Visual Completa');
