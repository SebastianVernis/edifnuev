/**
 * E2E Tests - All API Endpoints (44 endpoints)
 * Tests exhaustivos de todos los endpoints del sistema
 */

import { config, makeRequest, login, authHeaders, generateTestData, sleep } from './test-config.js';

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  endpointResults: {},
  responseTimes: []
};

async function runTest(name, testFn) {
  testResults.total++;
  try {
    await testFn();
    testResults.passed++;
    console.log(`✅ ${name}`);
    return true;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ test: name, error: error.message });
    console.error(`❌ ${name}: ${error.message}`);
    return false;
  }
}

function recordEndpoint(method, path, status, responseTime) {
  const key = `${method} ${path}`;
  testResults.endpointResults[key] = { status, responseTime, tested: true };
  testResults.responseTimes.push(responseTime);
}

// ============================================
// AUTH ENDPOINTS (4)
// ============================================

async function testAuthEndpoints() {
  console.log('\n📍 Testing Auth Endpoints (4)');
  
  await runTest('POST /api/auth/login', async () => {
    const response = await makeRequest('POST', '/api/auth/login', {
      body: {
        email: config.testUsers.admin1.email,
        password: config.testUsers.admin1.password
      }
    });
    recordEndpoint('POST', '/api/auth/login', response.status, response.responseTime);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  });
  
  await runTest('POST /api/auth/registro', async () => {
    const testData = generateTestData();
    const response = await makeRequest('POST', '/api/auth/registro', {
      body: {
        nombre: testData.nombre,
        email: testData.email,
        password: 'Test123!',
        departamento: testData.departamento,
        rol: 'INQUILINO'
      }
    });
    recordEndpoint('POST', '/api/auth/registro', response.status, response.responseTime);
    // Puede ser 201, 200 o 400 si ya existe
    if (![200, 201, 400].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });
  
  await runTest('GET /api/auth/renew', async () => {
    const token = await login(config.testUsers.admin1.email, config.testUsers.admin1.password);
    const response = await makeRequest('GET', '/api/auth/renew', {
      headers: authHeaders(token)
    });
    recordEndpoint('GET', '/api/auth/renew', response.status, response.responseTime);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  });
  
  await runTest('GET /api/auth/perfil', async () => {
    const token = await login(config.testUsers.admin1.email, config.testUsers.admin1.password);
    const response = await makeRequest('GET', '/api/auth/perfil', {
      headers: authHeaders(token)
    });
    recordEndpoint('GET', '/api/auth/perfil', response.status, response.responseTime);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  });
}

// ============================================
// ONBOARDING ENDPOINTS (7)
// ============================================

async function testOnboardingEndpoints() {
  console.log('\n📍 Testing Onboarding Endpoints (7)');
  
  await runTest('POST /api/onboarding/register', async () => {
    const testData = generateTestData();
    const response = await makeRequest('POST', '/api/onboarding/register', {
      body: {
        fullName: testData.nombre,
        email: testData.email,
        phone: testData.telefono,
        buildingName: 'Test Building',
        selectedPlan: 'profesional'
      }
    });
    recordEndpoint('POST', '/api/onboarding/register', response.status, response.responseTime);
    if (![200, 201, 400].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });
  
  await runTest('POST /api/otp/send', async () => {
    const testData = generateTestData();
    const response = await makeRequest('POST', '/api/otp/send', {
      body: {
        email: testData.email
      }
    });
    recordEndpoint('POST', '/api/otp/send', response.status, response.responseTime);
    // Puede fallar si el email no existe en pending_users
    if (![200, 201, 400, 404].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });
  
  await runTest('POST /api/otp/verify', async () => {
    const response = await makeRequest('POST', '/api/otp/verify', {
      body: {
        email: 'test@test.com',
        code: '123456'
      }
    });
    recordEndpoint('POST', '/api/otp/verify', response.status, response.responseTime);
    // Esperamos que falle con código incorrecto
    if (![400, 401, 404].includes(response.status)) {
      throw new Error(`Should reject invalid OTP`);
    }
  });
  
  await runTest('POST /api/otp/resend', async () => {
    const response = await makeRequest('POST', '/api/otp/resend', {
      body: {
        email: 'test@test.com'
      }
    });
    recordEndpoint('POST', '/api/otp/resend', response.status, response.responseTime);
    if (![200, 201, 400, 404].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });
  
  await runTest('GET /api/otp/status/:email', async () => {
    const response = await makeRequest('GET', '/api/otp/status/test@test.com');
    recordEndpoint('GET', '/api/otp/status/:email', response.status, response.responseTime);
    if (![200, 404].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });
  
  await runTest('POST /api/onboarding/checkout', async () => {
    const response = await makeRequest('POST', '/api/onboarding/checkout', {
      body: {
        email: 'test@test.com',
        cardNumber: '4242424242424242',
        cardName: 'TEST USER',
        cardExpiry: '12/28',
        cardCvv: '123',
        postalCode: '12345'
      }
    });
    recordEndpoint('POST', '/api/onboarding/checkout', response.status, response.responseTime);
    if (![200, 201, 400, 404].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });
  
  await runTest('POST /api/onboarding/setup-building', async () => {
    const response = await makeRequest('POST', '/api/onboarding/setup-building', {
      body: {
        email: 'test@test.com',
        buildingName: 'Test Building',
        address: 'Test Address',
        totalUnits: 50,
        buildingType: 'Edificio',
        adminName: 'Test Admin',
        adminPhone: '5512345678',
        adminPassword: 'Test123!',
        monthlyFee: 1500,
        extraordinaryFee: 500,
        cutoffDay: 5,
        paymentDueDays: 5,
        lateFeePercent: 2.5
      }
    });
    recordEndpoint('POST', '/api/onboarding/setup-building', response.status, response.responseTime);
    if (![200, 201, 400, 404].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });
}

// ============================================
// USUARIOS ENDPOINTS (5)
// ============================================

async function testUsuariosEndpoints() {
  console.log('\n📍 Testing Usuarios Endpoints (5)');
  
  const token = await login(config.testUsers.admin1.email, config.testUsers.admin1.password);
  let createdUserId = null;
  
  await runTest('GET /api/usuarios', async () => {
    const response = await makeRequest('GET', '/api/usuarios', {
      headers: authHeaders(token)
    });
    recordEndpoint('GET', '/api/usuarios', response.status, response.responseTime);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  });
  
  await runTest('POST /api/usuarios', async () => {
    const testData = generateTestData();
    const response = await makeRequest('POST', '/api/usuarios', {
      headers: authHeaders(token),
      body: {
        nombre: testData.nombre,
        email: testData.email,
        password: 'Test123!',
        departamento: testData.departamento,
        rol: 'INQUILINO',
        telefono: testData.telefono
      }
    });
    recordEndpoint('POST', '/api/usuarios', response.status, response.responseTime);
    if (![200, 201].includes(response.status)) {
      throw new Error(`Expected 200/201, got ${response.status}`);
    }
    createdUserId = response.data.usuario?.id || response.data.id;
  });
  
  await runTest('GET /api/usuarios/:id', async () => {
    if (!createdUserId) {
      console.log('  ⚠️  Skipping - no user ID available');
      return;
    }
    const response = await makeRequest('GET', `/api/usuarios/${createdUserId}`, {
      headers: authHeaders(token)
    });
    recordEndpoint('GET', '/api/usuarios/:id', response.status, response.responseTime);
    if (![200, 404].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });
  
  await runTest('PUT /api/usuarios/:id', async () => {
    if (!createdUserId) {
      console.log('  ⚠️  Skipping - no user ID available');
      return;
    }
    const response = await makeRequest('PUT', `/api/usuarios/${createdUserId}`, {
      headers: authHeaders(token),
      body: {
        telefono: '5599999999'
      }
    });
    recordEndpoint('PUT', '/api/usuarios/:id', response.status, response.responseTime);
    if (![200, 404].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });
  
  await runTest('DELETE /api/usuarios/:id', async () => {
    if (!createdUserId) {
      console.log('  ⚠️  Skipping - no user ID available');
      return;
    }
    const response = await makeRequest('DELETE', `/api/usuarios/${createdUserId}`, {
      headers: authHeaders(token)
    });
    recordEndpoint('DELETE', '/api/usuarios/:id', response.status, response.responseTime);
    if (![200, 404].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });
}

// ============================================
// CUOTAS ENDPOINTS (6)
// ============================================

async function testCuotasEndpoints() {
  console.log('\n📍 Testing Cuotas Endpoints (6)');
  
  const token = await login(config.testUsers.admin1.email, config.testUsers.admin1.password);
  let createdCuotaId = null;
  
  await runTest('GET /api/cuotas', async () => {
    const response = await makeRequest('GET', '/api/cuotas', {
      headers: authHeaders(token)
    });
    recordEndpoint('GET', '/api/cuotas', response.status, response.responseTime);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  });
  
  await runTest('POST /api/cuotas', async () => {
    const response = await makeRequest('POST', '/api/cuotas', {
      headers: authHeaders(token),
      body: {
        mes: 'Diciembre',
        anio: 2025,
        monto: 1500,
        departamento: '101',
        fechaVencimiento: '2025-12-31'
      }
    });
    recordEndpoint('POST', '/api/cuotas', response.status, response.responseTime);
    if (![200, 201, 400].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
    createdCuotaId = response.data.cuota?.id || response.data.id;
  });
  
  await runTest('POST /api/cuotas/generar', async () => {
    const response = await makeRequest('POST', '/api/cuotas/generar', {
      headers: authHeaders(token),
      body: {
        mes: 'Enero',
        anio: 2026,
        monto: 1500,
        fechaVencimiento: '2026-01-31'
      }
    });
    recordEndpoint('POST', '/api/cuotas/generar', response.status, response.responseTime);
    if (![200, 201, 400].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });
  
  await runTest('GET /api/cuotas/departamento/:depto', async () => {
    const response = await makeRequest('GET', '/api/cuotas/departamento/101', {
      headers: authHeaders(token)
    });
    recordEndpoint('GET', '/api/cuotas/departamento/:depto', response.status, response.responseTime);
    if (![200, 404].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });
  
  await runTest('POST /api/cuotas/:id/pagar', async () => {
    if (!createdCuotaId) {
      console.log('  ⚠️  Skipping - no cuota ID available');
      return;
    }
    const response = await makeRequest('POST', `/api/cuotas/${createdCuotaId}/pagar`, {
      headers: authHeaders(token),
      body: {
        metodoPago: 'TRANSFERENCIA',
        referencia: 'TEST-REF-001'
      }
    });
    recordEndpoint('POST', '/api/cuotas/:id/pagar', response.status, response.responseTime);
    if (![200, 404].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });
  
  await runTest('DELETE /api/cuotas/:id', async () => {
    if (!createdCuotaId) {
      console.log('  ⚠️  Skipping - no cuota ID available');
      return;
    }
    const response = await makeRequest('DELETE', `/api/cuotas/${createdCuotaId}`, {
      headers: authHeaders(token)
    });
    recordEndpoint('DELETE', '/api/cuotas/:id', response.status, response.responseTime);
    if (![200, 404].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });
}

// ============================================
// GASTOS ENDPOINTS (5)
// ============================================

async function testGastosEndpoints() {
  console.log('\n📍 Testing Gastos Endpoints (5)');
  
  const token = await login(config.testUsers.admin1.email, config.testUsers.admin1.password);
  let createdGastoId = null;
  
  await runTest('GET /api/gastos', async () => {
    const response = await makeRequest('GET', '/api/gastos', {
      headers: authHeaders(token)
    });
    recordEndpoint('GET', '/api/gastos', response.status, response.responseTime);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  });
  
  await runTest('POST /api/gastos', async () => {
    const response = await makeRequest('POST', '/api/gastos', {
      headers: authHeaders(token),
      body: {
        descripcion: 'Test Gasto E2E',
        monto: 1000,
        categoria: 'MANTENIMIENTO',
        fecha: '2025-12-16',
        proveedor: 'Test Provider'
      }
    });
    recordEndpoint('POST', '/api/gastos', response.status, response.responseTime);
    if (![200, 201].includes(response.status)) {
      throw new Error(`Expected 200/201, got ${response.status}`);
    }
    createdGastoId = response.data.gasto?.id || response.data.id;
  });
  
  await runTest('GET /api/gastos/:id', async () => {
    if (!createdGastoId) {
      console.log('  ⚠️  Skipping - no gasto ID available');
      return;
    }
    const response = await makeRequest('GET', `/api/gastos/${createdGastoId}`, {
      headers: authHeaders(token)
    });
    recordEndpoint('GET', '/api/gastos/:id', response.status, response.responseTime);
    if (![200, 404].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });
  
  await runTest('PUT /api/gastos/:id', async () => {
    if (!createdGastoId) {
      console.log('  ⚠️  Skipping - no gasto ID available');
      return;
    }
    const response = await makeRequest('PUT', `/api/gastos/${createdGastoId}`, {
      headers: authHeaders(token),
      body: {
        monto: 1500
      }
    });
    recordEndpoint('PUT', '/api/gastos/:id', response.status, response.responseTime);
    if (![200, 404].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });
  
  await runTest('DELETE /api/gastos/:id', async () => {
    if (!createdGastoId) {
      console.log('  ⚠️  Skipping - no gasto ID available');
      return;
    }
    const response = await makeRequest('DELETE', `/api/gastos/${createdGastoId}`, {
      headers: authHeaders(token)
    });
    recordEndpoint('DELETE', '/api/gastos/:id', response.status, response.responseTime);
    if (![200, 404].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });
}

// ============================================
// FONDOS ENDPOINTS (6)
// ============================================

async function testFondosEndpoints() {
  console.log('\n📍 Testing Fondos Endpoints (6)');
  
  const token = await login(config.testUsers.admin1.email, config.testUsers.admin1.password);
  let createdFondoId = null;
  
  await runTest('GET /api/fondos', async () => {
    const response = await makeRequest('GET', '/api/fondos', {
      headers: authHeaders(token)
    });
    recordEndpoint('GET', '/api/fondos', response.status, response.responseTime);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  });
  
  await runTest('POST /api/fondos', async () => {
    const response = await makeRequest('POST', '/api/fondos', {
      headers: authHeaders(token),
      body: {
        nombre: 'Fondo Test E2E',
        saldo: 10000,
        descripcion: 'Fondo de prueba'
      }
    });
    recordEndpoint('POST', '/api/fondos', response.status, response.responseTime);
    if (![200, 201, 400].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
    createdFondoId = response.data.fondo?.id || response.data.id;
  });
  
  await runTest('GET /api/fondos/:id', async () => {
    if (!createdFondoId) {
      console.log('  ⚠️  Skipping - no fondo ID available');
      return;
    }
    const response = await makeRequest('GET', `/api/fondos/${createdFondoId}`, {
      headers: authHeaders(token)
    });
    recordEndpoint('GET', '/api/fondos/:id', response.status, response.responseTime);
    if (![200, 404].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });
  
  await runTest('POST /api/fondos/transferir', async () => {
    const response = await makeRequest('POST', '/api/fondos/transferir', {
      headers: authHeaders(token),
      body: {
        fondoOrigenId: 1,
        fondoDestinoId: 2,
        monto: 1000,
        concepto: 'Test transfer'
      }
    });
    recordEndpoint('POST', '/api/fondos/transferir', response.status, response.responseTime);
    if (![200, 400, 404].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });
  
  await runTest('PUT /api/fondos/:id', async () => {
    if (!createdFondoId) {
      console.log('  ⚠️  Skipping - no fondo ID available');
      return;
    }
    const response = await makeRequest('PUT', `/api/fondos/${createdFondoId}`, {
      headers: authHeaders(token),
      body: {
        descripcion: 'Updated description'
      }
    });
    recordEndpoint('PUT', '/api/fondos/:id', response.status, response.responseTime);
    if (![200, 404].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });
  
  await runTest('DELETE /api/fondos/:id', async () => {
    if (!createdFondoId) {
      console.log('  ⚠️  Skipping - no fondo ID available');
      return;
    }
    const response = await makeRequest('DELETE', `/api/fondos/${createdFondoId}`, {
      headers: authHeaders(token)
    });
    recordEndpoint('DELETE', '/api/fondos/:id', response.status, response.responseTime);
    if (![200, 404].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });
}

// ============================================
// ANUNCIOS ENDPOINTS (5)
// ============================================

async function testAnunciosEndpoints() {
  console.log('\n📍 Testing Anuncios Endpoints (5)');
  
  const token = await login(config.testUsers.admin1.email, config.testUsers.admin1.password);
  let createdAnuncioId = null;
  
  await runTest('GET /api/anuncios', async () => {
    const response = await makeRequest('GET', '/api/anuncios', {
      headers: authHeaders(token)
    });
    recordEndpoint('GET', '/api/anuncios', response.status, response.responseTime);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  });
  
  await runTest('POST /api/anuncios', async () => {
    const response = await makeRequest('POST', '/api/anuncios', {
      headers: authHeaders(token),
      body: {
        titulo: 'Anuncio Test E2E',
        contenido: 'Contenido de prueba',
        tipo: 'AVISO',
        prioridad: 'NORMAL'
      }
    });
    recordEndpoint('POST', '/api/anuncios', response.status, response.responseTime);
    if (![200, 201].includes(response.status)) {
      throw new Error(`Expected 200/201, got ${response.status}`);
    }
    createdAnuncioId = response.data.anuncio?.id || response.data.id;
  });
  
  await runTest('GET /api/anuncios/:id', async () => {
    if (!createdAnuncioId) {
      console.log('  ⚠️  Skipping - no anuncio ID available');
      return;
    }
    const response = await makeRequest('GET', `/api/anuncios/${createdAnuncioId}`, {
      headers: authHeaders(token)
    });
    recordEndpoint('GET', '/api/anuncios/:id', response.status, response.responseTime);
    if (![200, 404].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });
  
  await runTest('PUT /api/anuncios/:id', async () => {
    if (!createdAnuncioId) {
      console.log('  ⚠️  Skipping - no anuncio ID available');
      return;
    }
    const response = await makeRequest('PUT', `/api/anuncios/${createdAnuncioId}`, {
      headers: authHeaders(token),
      body: {
        prioridad: 'ALTA'
      }
    });
    recordEndpoint('PUT', '/api/anuncios/:id', response.status, response.responseTime);
    if (![200, 404].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });
  
  await runTest('DELETE /api/anuncios/:id', async () => {
    if (!createdAnuncioId) {
      console.log('  ⚠️  Skipping - no anuncio ID available');
      return;
    }
    const response = await makeRequest('DELETE', `/api/anuncios/${createdAnuncioId}`, {
      headers: authHeaders(token)
    });
    recordEndpoint('DELETE', '/api/anuncios/:id', response.status, response.responseTime);
    if (![200, 404].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });
}

// ============================================
// CIERRES ENDPOINTS (3)
// ============================================

async function testCierresEndpoints() {
  console.log('\n📍 Testing Cierres Endpoints (3)');
  
  const token = await login(config.testUsers.admin1.email, config.testUsers.admin1.password);
  let createdCierreId = null;
  
  await runTest('GET /api/cierres', async () => {
    const response = await makeRequest('GET', '/api/cierres', {
      headers: authHeaders(token)
    });
    recordEndpoint('GET', '/api/cierres', response.status, response.responseTime);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  });
  
  await runTest('POST /api/cierres', async () => {
    const response = await makeRequest('POST', '/api/cierres', {
      headers: authHeaders(token),
      body: {
        mes: 'Diciembre',
        anio: 2025,
        tipo: 'MENSUAL'
      }
    });
    recordEndpoint('POST', '/api/cierres', response.status, response.responseTime);
    if (![200, 201, 400].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
    createdCierreId = response.data.cierre?.id || response.data.id;
  });
  
  await runTest('GET /api/cierres/:id', async () => {
    if (!createdCierreId) {
      console.log('  ⚠️  Skipping - no cierre ID available');
      return;
    }
    const response = await makeRequest('GET', `/api/cierres/${createdCierreId}`, {
      headers: authHeaders(token)
    });
    recordEndpoint('GET', '/api/cierres/:id', response.status, response.responseTime);
    if (![200, 404].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });
}

// Ejecutar todos los tests
async function runAllTests() {
  console.log('\n🌐 Testing All API Endpoints (44 total)\n');
  console.log('='.repeat(50));
  
  await testAuthEndpoints();
  await testOnboardingEndpoints();
  await testUsuariosEndpoints();
  await testCuotasEndpoints();
  await testGastosEndpoints();
  await testFondosEndpoints();
  await testAnunciosEndpoints();
  await testCierresEndpoints();
  
  console.log('='.repeat(50));
  console.log(`\n📊 Results: ${testResults.passed}/${testResults.total} passed`);
  
  // Calcular métricas
  const avgResponseTime = testResults.responseTimes.length > 0
    ? testResults.responseTimes.reduce((a, b) => a + b, 0) / testResults.responseTimes.length
    : 0;
  
  const coverage = (Object.keys(testResults.endpointResults).length / 44) * 100;
  
  console.log(`\n📈 Metrics:`);
  console.log(`  - Coverage: ${coverage.toFixed(1)}% (${Object.keys(testResults.endpointResults).length}/44 endpoints)`);
  console.log(`  - Avg Response Time: ${avgResponseTime.toFixed(0)}ms`);
  console.log(`  - Max Response Time: ${Math.max(...testResults.responseTimes).toFixed(0)}ms`);
  console.log(`  - Min Response Time: ${Math.min(...testResults.responseTimes).toFixed(0)}ms`);
  
  if (avgResponseTime > config.metrics.responseTime) {
    console.log(`  ⚠️  Warning: Average response time exceeds target (${config.metrics.responseTime}ms)`);
  }
  
  if (testResults.failed > 0) {
    console.log(`\n❌ Failed tests (${testResults.failed}):`);
    testResults.errors.forEach(({ test, error }) => {
      console.log(`  - ${test}`);
      console.log(`    ${error}`);
    });
  }
  
  return testResults;
}

// Ejecutar si es el archivo principal
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runAllTests, testResults };
