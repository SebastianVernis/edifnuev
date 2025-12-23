// post-fixes-endpoints.test.js - Tests automatizados para los 9 endpoints corregidos
import { exec } from 'child_process';
import { promisify } from 'util';
import assert from 'assert';

const execAsync = promisify(exec);

// Configuración
const BASE_URL = 'http://localhost:3001';
let adminToken = null;
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

// Helper para ejecutar curl
async function curlRequest(method, endpoint, data = null, token = null) {
  let curlCmd = `curl -s -w "\\n%{http_code}" -X ${method.toUpperCase()} ${BASE_URL}${endpoint}`;
  
  if (token) {
    curlCmd += ` -H "x-auth-token: ${token}"`;
  }
  
  if (data) {
    curlCmd += ` -H "Content-Type: application/json" -d '${JSON.stringify(data).replace(/'/g, "'\\''")}'`;
  }
  
  try {
    const { stdout, stderr } = await execAsync(curlCmd);
    
    if (stderr) {
      console.error('Curl stderr:', stderr);
    }
    
    const lines = stdout.trim().split('\n');
    const statusCode = parseInt(lines[lines.length - 1]);
    const responseBody = lines.slice(0, -1).join('\n');
    
    let parsedBody = null;
    try {
      parsedBody = JSON.parse(responseBody);
    } catch (e) {
      console.error('Failed to parse response:', responseBody);
      parsedBody = responseBody;
    }
    
    return {
      status: statusCode,
      body: parsedBody,
      raw: responseBody
    };
  } catch (error) {
    throw new Error(`Curl request failed: ${error.message}`);
  }
}

// Helper para registrar resultados
function recordTest(name, passed, message = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}: ${message}`);
  }
  testResults.details.push({ name, passed, message });
}

// Setup - obtener token de admin
async function setupTests() {
  console.log('🔐 Obteniendo token de administrador...');
  
  try {
    const loginResponse = await curlRequest('POST', '/api/auth/login', {
      email: 'admin@edificio205.com',
      password: 'Gemelo1'
    });
    
    if (loginResponse.status !== 200) {
      throw new Error(`Login failed with status ${loginResponse.status}`);
    }
    
    if (!loginResponse.body.token) {
      throw new Error('Login response missing token');
    }
    
    adminToken = loginResponse.body.token;
    console.log('✅ Token obtenido exitosamente\n');
    return true;
  } catch (error) {
    console.error('❌ Error en setup:', error.message);
    return false;
  }
}

// Test Suite 1: Fondos API (3 endpoints)
async function testFondosEndpoints() {
  console.log('=== 💰 Test Suite 1: Fondos API (3 endpoints) ===\n');
  
  // Test 1.1: GET /api/fondos - Listar fondos
  try {
    const response = await curlRequest('GET', '/api/fondos', null, adminToken);
    const passed = response.status === 200 && response.body.ok === true;
    recordTest('GET /api/fondos - Listar fondos', passed, 
      passed ? '' : `Status: ${response.status}, ok: ${response.body?.ok}`);
  } catch (error) {
    recordTest('GET /api/fondos - Listar fondos', false, error.message);
  }
  
  // Test 1.2: GET /api/fondos/patrimonio - Patrimonio total (ANTES 404)
  try {
    const response = await curlRequest('GET', '/api/fondos/patrimonio', null, adminToken);
    const hasPatrimonio = response.body && typeof response.body.patrimonioTotal !== 'undefined';
    const passed = response.status === 200 && response.body.ok === true && hasPatrimonio;
    recordTest('GET /api/fondos/patrimonio - Patrimonio total', passed,
      passed ? '' : `Status: ${response.status}, ok: ${response.body?.ok}, hasPatrimonio: ${hasPatrimonio}`);
  } catch (error) {
    recordTest('GET /api/fondos/patrimonio - Patrimonio total', false, error.message);
  }
  
  // Test 1.3: POST /api/fondos/transferencia - Transferir (ANTES 404)
  try {
    // Primero obtener fondos para saber los nombres
    const fondosResponse = await curlRequest('GET', '/api/fondos', null, adminToken);
    
    const transferData = {
      origen: 'ahorroAcumulado',
      destino: 'gastosMayores',
      monto: 100,
      concepto: 'Test transfer automatizado'
    };
    
    const response = await curlRequest('POST', '/api/fondos/transferencia', transferData, adminToken);
    const passed = response.status === 200 && response.body.ok === true;
    recordTest('POST /api/fondos/transferencia - Transferir', passed,
      passed ? '' : `Status: ${response.status}, ok: ${response.body?.ok}`);
  } catch (error) {
    recordTest('POST /api/fondos/transferencia - Transferir', false, error.message);
  }
  
  console.log('');
}

// Test Suite 2: Cuotas API (3 endpoints)
async function testCuotasEndpoints() {
  console.log('=== 📅 Test Suite 2: Cuotas API (3 endpoints) ===\n');
  
  // Test 2.1: GET /api/cuotas/stats - Estadísticas (ANTES 404)
  try {
    const response = await curlRequest('GET', '/api/cuotas/stats', null, adminToken);
    const hasStats = response.body && response.body.stats && typeof response.body.stats.total !== 'undefined';
    const passed = response.status === 200 && response.body.ok === true && hasStats;
    recordTest('GET /api/cuotas/stats - Estadísticas', passed,
      passed ? '' : `Status: ${response.status}, ok: ${response.body?.ok}, hasStats: ${hasStats}`);
  } catch (error) {
    recordTest('GET /api/cuotas/stats - Estadísticas', false, error.message);
  }
  
  // Test 2.2: GET /api/cuotas/pendientes - Cuotas pendientes (ANTES 404)
  try {
    const response = await curlRequest('GET', '/api/cuotas/pendientes', null, adminToken);
    const passed = response.status === 200 && response.body.ok === true;
    recordTest('GET /api/cuotas/pendientes - Cuotas pendientes', passed,
      passed ? '' : `Status: ${response.status}, ok: ${response.body?.ok}`);
  } catch (error) {
    recordTest('GET /api/cuotas/pendientes - Cuotas pendientes', false, error.message);
  }
  
  // Test 2.3: POST /api/cuotas/verificar-vencimientos - Actualizar vencimientos (ANTES 404)
  try {
    const response = await curlRequest('POST', '/api/cuotas/verificar-vencimientos', null, adminToken);
    const passed = response.status === 200 && response.body.ok === true;
    recordTest('POST /api/cuotas/verificar-vencimientos - Actualizar vencimientos', passed,
      passed ? '' : `Status: ${response.status}, ok: ${response.body?.ok}`);
  } catch (error) {
    recordTest('POST /api/cuotas/verificar-vencimientos - Actualizar vencimientos', false, error.message);
  }
  
  console.log('');
}

// Test Suite 3: Gastos API (1 endpoint)
async function testGastosEndpoints() {
  console.log('=== 💸 Test Suite 3: Gastos API (1 endpoint) ===\n');
  
  // Test 3.1: GET /api/gastos/stats - Estadísticas (ANTES 404)
  try {
    const response = await curlRequest('GET', '/api/gastos/stats', null, adminToken);
    const hasStats = response.body && response.body.stats && typeof response.body.stats.totalMonto !== 'undefined';
    const passed = response.status === 200 && response.body.ok === true && hasStats;
    recordTest('GET /api/gastos/stats - Estadísticas', passed,
      passed ? '' : `Status: ${response.status}, ok: ${response.body?.ok}, hasStats: ${hasStats}`);
  } catch (error) {
    recordTest('GET /api/gastos/stats - Estadísticas', false, error.message);
  }
  
  console.log('');
}

// Test Suite 4: Parcialidades API (2 endpoints)
async function testParcialidadesEndpoints() {
  console.log('=== 💳 Test Suite 4: Parcialidades API (2 endpoints) ===\n');
  
  // Test 4.1: GET /api/parcialidades/pagos - Pagos (ANTES 404)
  try {
    const response = await curlRequest('GET', '/api/parcialidades/pagos', null, adminToken);
    const passed = response.status === 200 && response.body.ok === true;
    recordTest('GET /api/parcialidades/pagos - Pagos', passed,
      passed ? '' : `Status: ${response.status}, ok: ${response.body?.ok}`);
  } catch (error) {
    recordTest('GET /api/parcialidades/pagos - Pagos', false, error.message);
  }
  
  // Test 4.2: GET /api/parcialidades/estado - Estado (ANTES 404)
  try {
    const response = await curlRequest('GET', '/api/parcialidades/estado', null, adminToken);
    const passed = response.status === 200 && response.body.ok === true;
    recordTest('GET /api/parcialidades/estado - Estado', passed,
      passed ? '' : `Status: ${response.status}, ok: ${response.body?.ok}`);
  } catch (error) {
    recordTest('GET /api/parcialidades/estado - Estado', false, error.message);
  }
  
  console.log('');
}

// Generar reporte final
function generateReport() {
  console.log('=== 📊 REPORTE FINAL - Tests Post-Fixes ===\n');
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  
  console.log(`Total endpoints testeados: ${testResults.total}`);
  console.log(`Exitosos: ${testResults.passed}/${testResults.total} (${successRate}%)`);
  console.log(`Fallidos: ${testResults.failed}/${testResults.total}`);
  console.log('');
  
  // Resumen por módulo
  console.log('📋 Resumen por Módulo:');
  console.log('');
  console.log('Fondos (3):');
  testResults.details.slice(0, 3).forEach(test => {
    console.log(`  ${test.passed ? '✅' : '❌'} ${test.name}`);
  });
  console.log('');
  
  console.log('Cuotas (3):');
  testResults.details.slice(3, 6).forEach(test => {
    console.log(`  ${test.passed ? '✅' : '❌'} ${test.name}`);
  });
  console.log('');
  
  console.log('Gastos (1):');
  testResults.details.slice(6, 7).forEach(test => {
    console.log(`  ${test.passed ? '✅' : '❌'} ${test.name}`);
  });
  console.log('');
  
  console.log('Parcialidades (2):');
  testResults.details.slice(7, 9).forEach(test => {
    console.log(`  ${test.passed ? '✅' : '❌'} ${test.name}`);
  });
  console.log('');
  
  // Validaciones
  console.log('✅ Validaciones:');
  console.log(`  Status codes: ${testResults.passed === testResults.total ? 'Todos 200 ✅' : 'Algunos fallaron ❌'}`);
  console.log(`  Response structure: { ok: true } ${testResults.passed === testResults.total ? '✅' : '❌'}`);
  console.log(`  Sin errores 404: ${testResults.passed === testResults.total ? '✅' : '❌'}`);
  console.log('');
  
  if (testResults.failed > 0) {
    console.log('⚠️  Tests fallidos:');
    testResults.details.filter(t => !t.passed).forEach(test => {
      console.log(`  ❌ ${test.name}`);
      if (test.message) {
        console.log(`     ${test.message}`);
      }
    });
    console.log('');
  }
  
  // Conclusión
  if (testResults.failed === 0) {
    console.log('🎉 ÉXITO: Todos los 9 endpoints corregidos funcionan correctamente!');
    console.log('');
    console.log('Commit validado: b4976a3d');
    console.log('URL: https://edificio-admin-saas-adapted.sebastianvernis.workers.dev');
  } else {
    console.log('⚠️  ATENCIÓN: Algunos endpoints requieren revisión');
  }
  
  return testResults.failed === 0;
}

// Función principal
async function runPostFixesTests() {
  console.log('🧪 Testing Automatizado - APIs Post-Fixes');
  console.log('==========================================');
  console.log('Commit: b4976a3d (fixes de endpoints 404)');
  console.log('Endpoints a validar: 9');
  console.log('');
  
  // Setup
  const setupSuccess = await setupTests();
  if (!setupSuccess) {
    console.error('❌ Error en setup. Abortando tests.');
    process.exit(1);
  }
  
  try {
    // Ejecutar test suites
    await testFondosEndpoints();
    await testCuotasEndpoints();
    await testGastosEndpoints();
    await testParcialidadesEndpoints();
    
    // Generar reporte
    const success = generateReport();
    
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Error fatal en tests:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar tests si el archivo se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runPostFixesTests();
}

export default {
  runPostFixesTests,
  testFondosEndpoints,
  testCuotasEndpoints,
  testGastosEndpoints,
  testParcialidadesEndpoints
};
