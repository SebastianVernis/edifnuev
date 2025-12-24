/**
 * E2E Tests - Security Audit
 * Tests de seguridad: JWT, RBAC, SQL Injection, XSS
 */

import { config, makeRequest, login, authHeaders, generateTestData } from './test-config.js';

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  vulnerabilities: []
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

async function testJWTSecurity() {
  await runTest('Security - JWT - Rechaza tokens malformados', async () => {
    const response = await makeRequest('GET', '/api/usuarios', {
      headers: authHeaders('malformed.token.here')
    });
    
    if (response.status !== 401) {
      testResults.vulnerabilities.push({
        type: 'JWT',
        severity: 'HIGH',
        issue: 'Accepts malformed tokens'
      });
      throw new Error(`Expected 401, got ${response.status}`);
    }
  });
  
  await runTest('Security - JWT - Rechaza tokens expirados', async () => {
    // Token expirado (generado hace mucho tiempo)
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDB9.test';
    
    const response = await makeRequest('GET', '/api/usuarios', {
      headers: authHeaders(expiredToken)
    });
    
    if (response.status !== 401) {
      testResults.vulnerabilities.push({
        type: 'JWT',
        severity: 'CRITICAL',
        issue: 'Accepts expired tokens'
      });
      throw new Error(`Expected 401, got ${response.status}`);
    }
  });
  
  await runTest('Security - JWT - Rechaza tokens sin firma', async () => {
    const unsignedToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIn0.';
    
    const response = await makeRequest('GET', '/api/usuarios', {
      headers: authHeaders(unsignedToken)
    });
    
    if (response.status !== 401) {
      testResults.vulnerabilities.push({
        type: 'JWT',
        severity: 'CRITICAL',
        issue: 'Accepts unsigned tokens'
      });
      throw new Error(`Expected 401, got ${response.status}`);
    }
  });
  
  await runTest('Security - JWT - Valida header x-auth-token', async () => {
    const token = await login(
      config.testUsers.admin1.email,
      config.testUsers.admin1.password
    );
    
    // Intentar con header incorrecto
    const response = await makeRequest('GET', '/api/usuarios', {
      headers: {
        'Authorization': `Bearer ${token}` // Header incorrecto
      }
    });
    
    if (response.status !== 401) {
      testResults.vulnerabilities.push({
        type: 'JWT',
        severity: 'MEDIUM',
        issue: 'Accepts tokens from wrong header'
      });
      throw new Error('Should only accept x-auth-token header');
    }
  });
}

async function testRBACPermissions() {
  await runTest('Security - RBAC - Inquilino no puede crear usuarios', async () => {
    const token = await login(
      config.testUsers.inquilino1.email,
      config.testUsers.inquilino1.password
    );
    
    const testData = generateTestData();
    const response = await makeRequest('POST', '/api/usuarios', {
      headers: authHeaders(token),
      body: {
        nombre: testData.nombre,
        email: testData.email,
        password: 'Test123!',
        departamento: testData.departamento,
        rol: 'INQUILINO'
      }
    });
    
    if (response.status === 200 || response.status === 201) {
      testResults.vulnerabilities.push({
        type: 'RBAC',
        severity: 'HIGH',
        issue: 'Inquilino can create users'
      });
      throw new Error('Inquilino should not be able to create users');
    }
  });
  
  await runTest('Security - RBAC - Inquilino no puede eliminar usuarios', async () => {
    const token = await login(
      config.testUsers.inquilino1.email,
      config.testUsers.inquilino1.password
    );
    
    const response = await makeRequest('DELETE', '/api/usuarios/1', {
      headers: authHeaders(token)
    });
    
    if (response.status === 200) {
      testResults.vulnerabilities.push({
        type: 'RBAC',
        severity: 'CRITICAL',
        issue: 'Inquilino can delete users'
      });
      throw new Error('Inquilino should not be able to delete users');
    }
  });
  
  await runTest('Security - RBAC - Inquilino no puede crear gastos', async () => {
    const token = await login(
      config.testUsers.inquilino1.email,
      config.testUsers.inquilino1.password
    );
    
    const response = await makeRequest('POST', '/api/gastos', {
      headers: authHeaders(token),
      body: {
        descripcion: 'Test gasto',
        monto: 1000,
        categoria: 'MANTENIMIENTO',
        fecha: '2025-12-16'
      }
    });
    
    if (response.status === 200 || response.status === 201) {
      testResults.vulnerabilities.push({
        type: 'RBAC',
        severity: 'HIGH',
        issue: 'Inquilino can create gastos'
      });
      throw new Error('Inquilino should not be able to create gastos');
    }
  });
  
  await runTest('Security - RBAC - Admin puede crear usuarios', async () => {
    const token = await login(
      config.testUsers.admin1.email,
      config.testUsers.admin1.password
    );
    
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
    
    if (response.status !== 200 && response.status !== 201) {
      throw new Error('Admin should be able to create users');
    }
  });
}

async function testSQLInjection() {
  await runTest('Security - SQL Injection - Login con payload SQL', async () => {
    const sqlPayloads = [
      "admin' OR '1'='1",
      "admin'--",
      "admin' OR 1=1--",
      "' OR '1'='1' /*",
      "admin'; DROP TABLE usuarios--"
    ];
    
    for (const payload of sqlPayloads) {
      const response = await makeRequest('POST', '/api/auth/login', {
        body: {
          email: payload,
          password: payload
        }
      });
      
      if (response.status === 200) {
        testResults.vulnerabilities.push({
          type: 'SQL_INJECTION',
          severity: 'CRITICAL',
          issue: `SQL injection successful with payload: ${payload}`
        });
        throw new Error(`SQL injection vulnerability detected with: ${payload}`);
      }
    }
  });
  
  await runTest('Security - SQL Injection - Búsqueda de usuarios con payload', async () => {
    const token = await login(
      config.testUsers.admin1.email,
      config.testUsers.admin1.password
    );
    
    const sqlPayloads = [
      "1' OR '1'='1",
      "1; DROP TABLE usuarios--",
      "1' UNION SELECT * FROM usuarios--"
    ];
    
    for (const payload of sqlPayloads) {
      const response = await makeRequest('GET', `/api/usuarios/${payload}`, {
        headers: authHeaders(token)
      });
      
      // Debe retornar error, no datos
      if (response.status === 200 && response.data && response.data.ok) {
        testResults.vulnerabilities.push({
          type: 'SQL_INJECTION',
          severity: 'CRITICAL',
          issue: `SQL injection in user search: ${payload}`
        });
        throw new Error(`SQL injection vulnerability in user search`);
      }
    }
  });
}

async function testXSSProtection() {
  await runTest('Security - XSS - Sanitiza input en creación de usuarios', async () => {
    const token = await login(
      config.testUsers.admin1.email,
      config.testUsers.admin1.password
    );
    
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")',
      '<svg onload=alert("XSS")>'
    ];
    
    const testData = generateTestData();
    
    for (const payload of xssPayloads) {
      const response = await makeRequest('POST', '/api/usuarios', {
        headers: authHeaders(token),
        body: {
          nombre: payload,
          email: testData.email,
          password: 'Test123!',
          departamento: testData.departamento,
          rol: 'INQUILINO',
          telefono: testData.telefono
        }
      });
      
      if (response.status === 200 || response.status === 201) {
        // Verificar que el payload fue sanitizado
        const usuario = response.data.usuario || response.data;
        if (usuario.nombre && usuario.nombre.includes('<script>')) {
          testResults.vulnerabilities.push({
            type: 'XSS',
            severity: 'HIGH',
            issue: 'XSS payload not sanitized in nombre field'
          });
          throw new Error('XSS vulnerability: script tags not sanitized');
        }
      }
    }
  });
  
  await runTest('Security - XSS - Sanitiza input en anuncios', async () => {
    const token = await login(
      config.testUsers.admin1.email,
      config.testUsers.admin1.password
    );
    
    const response = await makeRequest('POST', '/api/anuncios', {
      headers: authHeaders(token),
      body: {
        titulo: '<script>alert("XSS")</script>',
        contenido: '<img src=x onerror=alert("XSS")>',
        tipo: 'AVISO',
        prioridad: 'NORMAL'
      }
    });
    
    if (response.status === 200 || response.status === 201) {
      const anuncio = response.data.anuncio || response.data;
      if (anuncio.titulo && anuncio.titulo.includes('<script>')) {
        testResults.vulnerabilities.push({
          type: 'XSS',
          severity: 'HIGH',
          issue: 'XSS payload not sanitized in anuncios'
        });
        throw new Error('XSS vulnerability in anuncios');
      }
    }
  });
}

async function testRateLimiting() {
  await runTest('Security - Rate Limiting - Protege contra brute force en login', async () => {
    const attempts = [];
    
    // Intentar 10 logins rápidos
    for (let i = 0; i < 10; i++) {
      const response = await makeRequest('POST', '/api/auth/login', {
        body: {
          email: 'test@test.com',
          password: 'wrongpassword'
        }
      });
      attempts.push(response.status);
    }
    
    // Verificar si hay rate limiting (429 Too Many Requests)
    const hasRateLimit = attempts.some(status => status === 429);
    
    if (!hasRateLimit) {
      testResults.vulnerabilities.push({
        type: 'RATE_LIMITING',
        severity: 'MEDIUM',
        issue: 'No rate limiting on login endpoint'
      });
      console.warn('  ⚠️  Warning: No rate limiting detected on login');
    }
  });
}

async function testCORSConfiguration() {
  await runTest('Security - CORS - Headers configurados correctamente', async () => {
    const response = await makeRequest('GET', '/api/auth/perfil', {
      headers: {
        'Origin': 'https://malicious-site.com'
      }
    });
    
    const corsHeader = response.headers['access-control-allow-origin'];
    
    if (corsHeader === '*') {
      testResults.vulnerabilities.push({
        type: 'CORS',
        severity: 'MEDIUM',
        issue: 'CORS allows all origins (*)'
      });
      console.warn('  ⚠️  Warning: CORS allows all origins');
    }
  });
}

async function testPasswordSecurity() {
  await runTest('Security - Password - Rechaza contraseñas débiles', async () => {
    const token = await login(
      config.testUsers.admin1.email,
      config.testUsers.admin1.password
    );
    
    const weakPasswords = ['123', '123456', 'password', 'abc'];
    const testData = generateTestData();
    
    for (const weakPass of weakPasswords) {
      const response = await makeRequest('POST', '/api/usuarios', {
        headers: authHeaders(token),
        body: {
          nombre: testData.nombre,
          email: testData.email,
          password: weakPass,
          departamento: testData.departamento,
          rol: 'INQUILINO'
        }
      });
      
      if (response.status === 200 || response.status === 201) {
        testResults.vulnerabilities.push({
          type: 'PASSWORD_POLICY',
          severity: 'MEDIUM',
          issue: `Weak password accepted: ${weakPass}`
        });
        throw new Error(`Weak password accepted: ${weakPass}`);
      }
    }
  });
}

async function testDataExposure() {
  await runTest('Security - Data Exposure - No expone passwords en responses', async () => {
    const token = await login(
      config.testUsers.admin1.email,
      config.testUsers.admin1.password
    );
    
    const response = await makeRequest('GET', '/api/usuarios', {
      headers: authHeaders(token)
    });
    
    if (response.status === 200) {
      const usuarios = response.data.usuarios || response.data || [];
      
      for (const usuario of usuarios) {
        if (usuario.password || usuario.contrasena) {
          testResults.vulnerabilities.push({
            type: 'DATA_EXPOSURE',
            severity: 'CRITICAL',
            issue: 'Password exposed in API response'
          });
          throw new Error('Password field exposed in API response');
        }
      }
    }
  });
  
  await runTest('Security - Data Exposure - No expone JWT secrets', async () => {
    const response = await makeRequest('GET', '/api/auth/perfil');
    
    const responseText = JSON.stringify(response.data);
    
    if (responseText.includes('JWT_SECRET') || responseText.includes('secret')) {
      testResults.vulnerabilities.push({
        type: 'DATA_EXPOSURE',
        severity: 'CRITICAL',
        issue: 'JWT secret exposed'
      });
      throw new Error('Sensitive data exposed in response');
    }
  });
}

// Ejecutar todos los tests
async function runAllTests() {
  console.log('\n🔒 Security Audit - Comprehensive Testing\n');
  console.log('='.repeat(50));
  
  await testJWTSecurity();
  await testRBACPermissions();
  await testSQLInjection();
  await testXSSProtection();
  await testRateLimiting();
  await testCORSConfiguration();
  await testPasswordSecurity();
  await testDataExposure();
  
  console.log('='.repeat(50));
  console.log(`\n📊 Results: ${testResults.passed}/${testResults.total} passed`);
  
  if (testResults.vulnerabilities.length > 0) {
    console.log(`\n🚨 VULNERABILITIES DETECTED (${testResults.vulnerabilities.length}):`);
    
    const critical = testResults.vulnerabilities.filter(v => v.severity === 'CRITICAL');
    const high = testResults.vulnerabilities.filter(v => v.severity === 'HIGH');
    const medium = testResults.vulnerabilities.filter(v => v.severity === 'MEDIUM');
    
    if (critical.length > 0) {
      console.log(`\n  🔴 CRITICAL (${critical.length}):`);
      critical.forEach(v => console.log(`    - ${v.type}: ${v.issue}`));
    }
    
    if (high.length > 0) {
      console.log(`\n  🟠 HIGH (${high.length}):`);
      high.forEach(v => console.log(`    - ${v.type}: ${v.issue}`));
    }
    
    if (medium.length > 0) {
      console.log(`\n  🟡 MEDIUM (${medium.length}):`);
      medium.forEach(v => console.log(`    - ${v.type}: ${v.issue}`));
    }
  } else {
    console.log('\n✅ No critical vulnerabilities detected!');
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
      const criticalVulns = results.vulnerabilities.filter(v => v.severity === 'CRITICAL');
      process.exit(results.failed > 0 || criticalVulns.length > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runAllTests, testResults };
