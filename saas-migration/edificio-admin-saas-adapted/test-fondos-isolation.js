import fetch from 'node-fetch';

const BASE_URL = 'https://edificio-admin-saas-adapted.sebastianvernis.workers.dev';

async function testFondosIsolation() {
  console.log('🧪 Testing Fondos Isolation\n');
  
  // Login admin building 13
  const login1 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sebas@sebas.com', password: 'TestPass123!' })
  });
  const data1Res = await login1.json();
  const token1 = data1Res.token;
  
  console.log('Login Building 13:', login1.status === 200 ? '✅' : '❌');
  
  await new Promise(r => setTimeout(r, 300));
  
  // Login admin building 99
  const login2 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@building99.com', password: 'TestPass123!' })
  });
  const data2Res = await login2.json();
  const token2 = data2Res.token;
  
  console.log('Login Building 99:', login2.status === 200 ? '✅' : '❌');
  console.log('');
  
  await new Promise(r => setTimeout(r, 300));
  
  // Get fondos building 13
  const fondos1 = await fetch(`${BASE_URL}/api/fondos`, {
    headers: { 'x-auth-token': token1 }
  });
  const dataFondos1 = await fondos1.json();
  
  await new Promise(r => setTimeout(r, 300));
  
  // Get fondos building 99
  const fondos2 = await fetch(`${BASE_URL}/api/fondos`, {
    headers: { 'x-auth-token': token2 }
  });
  const dataFondos2 = await fondos2.json();
  
  console.log('📊 Building 13 (sebas@sebas.com):');
  console.log(`   Fondos count: ${dataFondos1.fondos?.length || 0}`);
  console.log(`   IDs: ${dataFondos1.fondos?.map(f => f.id).join(', ') || 'none'}`);
  console.log('');
  
  console.log('📊 Building 99 (admin@building99.com):');
  console.log(`   Fondos count: ${dataFondos2.fondos?.length || 0}`);
  console.log(`   IDs: ${dataFondos2.fondos?.map(f => f.id).join(', ') || 'none'}`);
  console.log('');
  
  // Verificar overlap
  const ids1 = new Set(dataFondos1.fondos?.map(f => f.id) || []);
  const ids2 = new Set(dataFondos2.fondos?.map(f => f.id) || []);
  const overlap = [...ids1].filter(id => ids2.has(id));
  
  console.log('🔍 Verificación de Aislamiento:');
  if (overlap.length > 0) {
    console.log('🚨 DATA LEAK DETECTED!');
    console.log(`   Shared fondos: ${overlap.length}`);
    console.log(`   IDs: ${overlap.join(', ')}`);
    console.log('');
    console.log('❌ MULTITENANCY FALLA - Fondos NO están aislados');
    return false;
  } else {
    console.log('✅ ISOLATION CORRECT');
    console.log('   0 fondos compartidos');
    console.log('   Cada building ve solo sus fondos');
    console.log('');
    console.log('✅ MULTITENANCY SEGURO');
    return true;
  }
}

testFondosIsolation();
