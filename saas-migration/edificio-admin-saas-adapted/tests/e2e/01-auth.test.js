/**
 * E2E Tests - Authentication Module
 * Tests para endpoints de autenticación
 */

import { config, makeRequest, login, authHeaders } from './test-config.js';

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
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

async function testAuthLogin() {
  await runTest('POST /api/auth/login - Login exitoso con credenciales válidas', async () => {
    const response = await makeRequest('POST', '/api/auth/login', {
      body: {
        email: config.testUsers.admin1.email,
        password: config.testUsers.admin1.password
      }
    });
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    if (!response.data.ok) {
      throw new Error('Response should have ok: true');
    }
    
    if (!response.data.token) {
      throw new Error('Response should include token');
    }
    
    if (!response.data.usuario) {
      throw new Error('Response should include usuario');
    }
    
    if (response.data.usuario.email !== config.testUsers.admin1.email) {
      throw new Error('Email mismatch');
    }
  });
  
  await runTest('POST /api/auth/login - Falla con credenciales inválidas', async () => {
    const response = await makeRequest('POST', '/api/auth/login', {
      body: {
        email: config.testUsers.admin1.email,
        password: 'wrongpassword'
      }
    });
    
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`);
    }
    
    if (response.data.ok !== false) {
      throw new Error('Response should have ok: false');
    }
  });
  
  await runTest('POST /api/auth/login - Falla con email inexistente', async () => {
    const response = await makeRequest('POST', '/api/auth/login', {
      body: {
        email: 'noexiste@test.com',
        password: 'anypassword'
      }
    });
    
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`);
    }
  });
  
  await runTest('POST /api/auth/login - Valida campos requeridos', async () => {
    const response = await makeRequest('POST', '/api/auth/login', {
      body: {}
    });
    
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
  });
}

async function testAuthRenew() {
  await runTest('GET /api/auth/renew - Renueva token válido', async () => {
    const token = await login(
      config.testUsers.admin1.email,
      config.testUsers.admin1.password
    );
    
    const response = await makeRequest('GET', '/api/auth/renew', {
      headers: authHeaders(token)
    });
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    if (!response.data.token) {
      throw new Error('Should return new token');
    }
  });
  
  await runTest('GET /api/auth/renew - Falla sin token', async () => {
    const response = await makeRequest('GET', '/api/auth/renew');
    
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`);
    }
  });
  
  await runTest('GET /api/auth/renew - Falla con token inválido', async () => {
    const response = await makeRequest('GET', '/api/auth/renew', {
      headers: authHeaders('invalid.token.here')
    });
    
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`);
    }
  });
}

async function testAuthPerfil() {
  await runTest('GET /api/auth/perfil - Obtiene perfil de usuario autenticado', async () => {
    const token = await login(
      config.testUsers.admin1.email,
      config.testUsers.admin1.password
    );
    
    const response = await makeRequest('GET', '/api/auth/perfil', {
      headers: authHeaders(token)
    });
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    if (!response.data.usuario) {
      throw new Error('Should return usuario');
    }
    
    if (response.data.usuario.email !== config.testUsers.admin1.email) {
      throw new Error('Email mismatch');
    }
  });
  
  await runTest('GET /api/auth/perfil - Falla sin autenticación', async () => {
    const response = await makeRequest('GET', '/api/auth/perfil');
    
    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`);
    }
  });
}

async function testResponseTimes() {
  await runTest('Response time - Login debe responder en <200ms', async () => {
    const response = await makeRequest('POST', '/api/auth/login', {
      body: {
        email: config.testUsers.admin1.email,
        password: config.testUsers.admin1.password
      }
    });
    
    if (response.responseTime > config.metrics.responseTime) {
      throw new Error(`Response time ${response.responseTime}ms exceeds ${config.metrics.responseTime}ms`);
    }
  });
}

// Ejecutar todos los tests
async function runAllTests() {
  console.log('\n🧪 Testing Authentication Module\n');
  console.log('='.repeat(50));
  
  await testAuthLogin();
  await testAuthRenew();
  await testAuthPerfil();
  await testResponseTimes();
  
  console.log('='.repeat(50));
  console.log(`\n📊 Results: ${testResults.passed}/${testResults.total} passed`);
  
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
