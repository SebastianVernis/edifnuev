/**
 * Safe test runner - ejecuta solo tests críticos con delays
 */

import { config, makeRequest, login, authHeaders, sleep } from './tests/e2e/test-config.js';

async function runSafeTests() {
  console.log('🧪 Running Safe E2E Tests (Core Functionality)\n');
  console.log('='.repeat(60));
  
  let passed = 0;
  let failed = 0;
  
  try {
    // Test 1: Auth Login
    console.log('\n1️⃣  Testing AUTH - Login');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      body: { email: 'sebas@sebas.com', password: 'TestPass123!' }
    });
    if (loginRes.status === 200 && loginRes.data.token) {
      console.log('✅ Login: OK');
      passed++;
    } else {
      console.log('❌ Login: FAILED');
      failed++;
    }
    
    await sleep(500);
    
    // Test 2: Get Token
    const token = loginRes.data.token;
    console.log('\n2️⃣  Testing AUTH - Profile');
    const perfilRes = await makeRequest('GET', '/api/auth/perfil', {
      headers: authHeaders(token)
    });
    if (perfilRes.status === 200) {
      console.log('✅ Profile: OK');
      passed++;
    } else {
      console.log('❌ Profile: FAILED');
      failed++;
    }
    
    await sleep(500);
    
    // Test 3: Usuarios
    console.log('\n3️⃣  Testing USUARIOS - List');
    const usuariosRes = await makeRequest('GET', '/api/usuarios', {
      headers: authHeaders(token)
    });
    if (usuariosRes.status === 200) {
      console.log('✅ Usuarios List: OK');
      console.log(`   Found: ${usuariosRes.data.usuarios?.length || 0} usuarios`);
      passed++;
    } else {
      console.log('❌ Usuarios List: FAILED');
      failed++;
    }
    
    await sleep(500);
    
    // Test 4: Cuotas
    console.log('\n4️⃣  Testing CUOTAS - List');
    const cuotasRes = await makeRequest('GET', '/api/cuotas', {
      headers: authHeaders(token)
    });
    if (cuotasRes.status === 200) {
      console.log('✅ Cuotas List: OK');
      console.log(`   Found: ${cuotasRes.data.cuotas?.length || 0} cuotas`);
      passed++;
    } else {
      console.log('❌ Cuotas List: FAILED');
      failed++;
    }
    
    await sleep(500);
    
    // Test 5: Gastos
    console.log('\n5️⃣  Testing GASTOS - List');
    const gastosRes = await makeRequest('GET', '/api/gastos', {
      headers: authHeaders(token)
    });
    if (gastosRes.status === 200) {
      console.log('✅ Gastos List: OK');
      console.log(`   Found: ${gastosRes.data.gastos?.length || 0} gastos`);
      passed++;
    } else {
      console.log('❌ Gastos List: FAILED');
      failed++;
    }
    
    await sleep(500);
    
    // Test 6: Fondos
    console.log('\n6️⃣  Testing FONDOS - List');
    const fondosRes = await makeRequest('GET', '/api/fondos', {
      headers: authHeaders(token)
    });
    if (fondosRes.status === 200) {
      console.log('✅ Fondos List: OK');
      console.log(`   Found: ${fondosRes.data.fondos?.length || 0} fondos`);
      passed++;
    } else {
      console.log('❌ Fondos List: FAILED');
      failed++;
    }
    
    await sleep(500);
    
    // Test 7: Anuncios
    console.log('\n7️⃣  Testing ANUNCIOS - List');
    const anunciosRes = await makeRequest('GET', '/api/anuncios', {
      headers: authHeaders(token)
    });
    if (anunciosRes.status === 200) {
      console.log('✅ Anuncios List: OK');
      console.log(`   Found: ${anunciosRes.data.anuncios?.length || 0} anuncios`);
      passed++;
    } else {
      console.log('❌ Anuncios List: FAILED');
      failed++;
    }
    
    await sleep(500);
    
    // Test 8: Cierres
    console.log('\n8️⃣  Testing CIERRES - List');
    const cierresRes = await makeRequest('GET', '/api/cierres', {
      headers: authHeaders(token)
    });
    if (cierresRes.status === 200) {
      console.log('✅ Cierres List: OK');
      console.log(`   Found: ${cierresRes.data.cierres?.length || 0} cierres`);
      passed++;
    } else {
      console.log('❌ Cierres List: FAILED');
      failed++;
    }
    
  } catch (error) {
    console.error('\n💥 Error:', error.message);
    failed++;
  }
  
  // Resumen
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 RESULTS: ${passed}/${passed + failed} passed (${((passed / (passed + failed)) * 100).toFixed(1)}%)`);
  
  if (failed === 0) {
    console.log('\n✅ ALL CORE TESTS PASSED');
    console.log('🚀 Sistema funcional - APIs principales operativas\n');
  } else {
    console.log(`\n⚠️  ${failed} tests failed - Review required\n`);
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

runSafeTests();
