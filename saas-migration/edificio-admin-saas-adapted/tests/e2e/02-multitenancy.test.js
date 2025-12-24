/**
 * E2E Tests - Multitenancy Validation
 * Tests para validar aislamiento de datos entre buildings
 */

import { config, makeRequest, login, authHeaders, generateTestData } from './test-config.js';

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  dataLeaks: []
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

async function testDataIsolation() {
  await runTest('Multitenancy - Admin1 no puede ver usuarios de Building2', async () => {
    const token1 = await login(
      config.testUsers.admin1.email,
      config.testUsers.admin1.password
    );
    
    // Obtener usuarios del building 1
    const response = await makeRequest('GET', '/api/usuarios', {
      headers: authHeaders(token1)
    });
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    // Verificar que solo vea usuarios de su building
    const usuarios = response.data.usuarios || response.data;
    
    // Verificar que no haya usuarios del building 2
    const hasBuilding2Users = usuarios.some(u => 
      u.email && u.email.includes('edificio206')
    );
    
    if (hasBuilding2Users) {
      testResults.dataLeaks.push({
        type: 'usuarios',
        from: 'building2',
        to: 'building1'
      });
      throw new Error('Data leak detected: Admin1 can see Building2 users');
    }
  });
  
  await runTest('Multitenancy - Admin2 no puede ver usuarios de Building1', async () => {
    const token2 = await login(
      config.testUsers.admin2.email,
      config.testUsers.admin2.password
    );
    
    const response = await makeRequest('GET', '/api/usuarios', {
      headers: authHeaders(token2)
    });
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    const usuarios = response.data.usuarios || response.data;
    
    const hasBuilding1Users = usuarios.some(u => 
      u.email && u.email.includes('edificio205')
    );
    
    if (hasBuilding1Users) {
      testResults.dataLeaks.push({
        type: 'usuarios',
        from: 'building1',
        to: 'building2'
      });
      throw new Error('Data leak detected: Admin2 can see Building1 users');
    }
  });
}

async function testCuotasIsolation() {
  await runTest('Multitenancy - Cuotas están aisladas por building', async () => {
    const token1 = await login(
      config.testUsers.admin1.email,
      config.testUsers.admin1.password
    );
    
    const token2 = await login(
      config.testUsers.admin2.email,
      config.testUsers.admin2.password
    );
    
    // Obtener cuotas de ambos buildings
    const response1 = await makeRequest('GET', '/api/cuotas', {
      headers: authHeaders(token1)
    });
    
    const response2 = await makeRequest('GET', '/api/cuotas', {
      headers: authHeaders(token2)
    });
    
    if (response1.status !== 200 || response2.status !== 200) {
      throw new Error('Failed to fetch cuotas');
    }
    
    const cuotas1 = response1.data.cuotas || response1.data || [];
    const cuotas2 = response2.data.cuotas || response2.data || [];
    
    // Verificar que no haya overlap de IDs
    const ids1 = new Set(cuotas1.map(c => c.id));
    const ids2 = new Set(cuotas2.map(c => c.id));
    
    const overlap = [...ids1].filter(id => ids2.has(id));
    
    if (overlap.length > 0) {
      testResults.dataLeaks.push({
        type: 'cuotas',
        overlap: overlap.length
      });
      throw new Error(`Data leak: ${overlap.length} cuotas shared between buildings`);
    }
  });
}

async function testGastosIsolation() {
  await runTest('Multitenancy - Gastos están aislados por building', async () => {
    const token1 = await login(
      config.testUsers.admin1.email,
      config.testUsers.admin1.password
    );
    
    const token2 = await login(
      config.testUsers.admin2.email,
      config.testUsers.admin2.password
    );
    
    const response1 = await makeRequest('GET', '/api/gastos', {
      headers: authHeaders(token1)
    });
    
    const response2 = await makeRequest('GET', '/api/gastos', {
      headers: authHeaders(token2)
    });
    
    if (response1.status !== 200 || response2.status !== 200) {
      throw new Error('Failed to fetch gastos');
    }
    
    const gastos1 = response1.data.gastos || response1.data || [];
    const gastos2 = response2.data.gastos || response2.data || [];
    
    const ids1 = new Set(gastos1.map(g => g.id));
    const ids2 = new Set(gastos2.map(g => g.id));
    
    const overlap = [...ids1].filter(id => ids2.has(id));
    
    if (overlap.length > 0) {
      testResults.dataLeaks.push({
        type: 'gastos',
        overlap: overlap.length
      });
      throw new Error(`Data leak: ${overlap.length} gastos shared between buildings`);
    }
  });
}

async function testFondosIsolation() {
  await runTest('Multitenancy - Fondos están aislados por building', async () => {
    const token1 = await login(
      config.testUsers.admin1.email,
      config.testUsers.admin1.password
    );
    
    const token2 = await login(
      config.testUsers.admin2.email,
      config.testUsers.admin2.password
    );
    
    const response1 = await makeRequest('GET', '/api/fondos', {
      headers: authHeaders(token1)
    });
    
    const response2 = await makeRequest('GET', '/api/fondos', {
      headers: authHeaders(token2)
    });
    
    if (response1.status !== 200 || response2.status !== 200) {
      throw new Error('Failed to fetch fondos');
    }
    
    const fondos1 = response1.data.fondos || response1.data || [];
    const fondos2 = response2.data.fondos || response2.data || [];
    
    const ids1 = new Set(fondos1.map(f => f.id));
    const ids2 = new Set(fondos2.map(f => f.id));
    
    const overlap = [...ids1].filter(id => ids2.has(id));
    
    if (overlap.length > 0) {
      testResults.dataLeaks.push({
        type: 'fondos',
        overlap: overlap.length
      });
      throw new Error(`Data leak: ${overlap.length} fondos shared between buildings`);
    }
  });
}

async function testAnunciosIsolation() {
  await runTest('Multitenancy - Anuncios están aislados por building', async () => {
    const token1 = await login(
      config.testUsers.admin1.email,
      config.testUsers.admin1.password
    );
    
    const token2 = await login(
      config.testUsers.admin2.email,
      config.testUsers.admin2.password
    );
    
    const response1 = await makeRequest('GET', '/api/anuncios', {
      headers: authHeaders(token1)
    });
    
    const response2 = await makeRequest('GET', '/api/anuncios', {
      headers: authHeaders(token2)
    });
    
    if (response1.status !== 200 || response2.status !== 200) {
      throw new Error('Failed to fetch anuncios');
    }
    
    const anuncios1 = response1.data.anuncios || response1.data || [];
    const anuncios2 = response2.data.anuncios || response2.data || [];
    
    const ids1 = new Set(anuncios1.map(a => a.id));
    const ids2 = new Set(anuncios2.map(a => a.id));
    
    const overlap = [...ids1].filter(id => ids2.has(id));
    
    if (overlap.length > 0) {
      testResults.dataLeaks.push({
        type: 'anuncios',
        overlap: overlap.length
      });
      throw new Error(`Data leak: ${overlap.length} anuncios shared between buildings`);
    }
  });
}

async function testCrossBuildingAccess() {
  await runTest('Multitenancy - No se puede acceder a recursos de otro building por ID', async () => {
    const token1 = await login(
      config.testUsers.admin1.email,
      config.testUsers.admin1.password
    );
    
    const token2 = await login(
      config.testUsers.admin2.email,
      config.testUsers.admin2.password
    );
    
    // Crear un usuario en building 2
    const testData = generateTestData();
    const createResponse = await makeRequest('POST', '/api/usuarios', {
      headers: authHeaders(token2),
      body: {
        nombre: testData.nombre,
        email: testData.email,
        password: 'Test123!',
        departamento: testData.departamento,
        rol: 'INQUILINO',
        telefono: testData.telefono
      }
    });
    
    if (createResponse.status !== 201 && createResponse.status !== 200) {
      throw new Error('Failed to create test user');
    }
    
    const userId = createResponse.data.usuario?.id || createResponse.data.id;
    
    if (!userId) {
      throw new Error('No user ID returned');
    }
    
    // Intentar acceder desde building 1
    const accessResponse = await makeRequest('GET', `/api/usuarios/${userId}`, {
      headers: authHeaders(token1)
    });
    
    // Debe fallar con 403 o 404
    if (accessResponse.status === 200) {
      testResults.dataLeaks.push({
        type: 'cross-building-access',
        resource: 'usuario',
        id: userId
      });
      throw new Error('Cross-building access allowed - security breach!');
    }
  });
}

async function testInquilinoIsolation() {
  await runTest('Multitenancy - Inquilinos solo ven datos de su building', async () => {
    const token = await login(
      config.testUsers.inquilino1.email,
      config.testUsers.inquilino1.password
    );
    
    // Intentar ver usuarios
    const usuariosResponse = await makeRequest('GET', '/api/usuarios', {
      headers: authHeaders(token)
    });
    
    // Inquilinos pueden no tener acceso o solo ver su propio perfil
    if (usuariosResponse.status === 200) {
      const usuarios = usuariosResponse.data.usuarios || usuariosResponse.data || [];
      
      // Si tiene acceso, verificar que no vea usuarios de otro building
      const hasOtherBuilding = usuarios.some(u => 
        u.email && u.email.includes('edificio206')
      );
      
      if (hasOtherBuilding) {
        testResults.dataLeaks.push({
          type: 'inquilino-cross-building',
          from: 'building2',
          to: 'inquilino-building1'
        });
        throw new Error('Inquilino can see users from other building');
      }
    }
  });
}

// Ejecutar todos los tests
async function runAllTests() {
  console.log('\n🏢 Testing Multitenancy & Data Isolation\n');
  console.log('='.repeat(50));
  
  await testDataIsolation();
  await testCuotasIsolation();
  await testGastosIsolation();
  await testFondosIsolation();
  await testAnunciosIsolation();
  await testCrossBuildingAccess();
  await testInquilinoIsolation();
  
  console.log('='.repeat(50));
  console.log(`\n📊 Results: ${testResults.passed}/${testResults.total} passed`);
  
  if (testResults.dataLeaks.length > 0) {
    console.log(`\n🚨 DATA LEAKS DETECTED (${testResults.dataLeaks.length}):`);
    testResults.dataLeaks.forEach((leak, i) => {
      console.log(`  ${i + 1}. ${JSON.stringify(leak)}`);
    });
  } else {
    console.log('\n✅ No data leaks detected - Multitenancy is secure!');
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
      process.exit(results.failed > 0 || results.dataLeaks.length > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runAllTests, testResults };
