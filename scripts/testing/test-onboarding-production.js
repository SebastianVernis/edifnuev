/**
 * Test completo del flujo de Onboarding en Producción
 * 
 * Prueba el flujo completo:
 * 1. Registro de usuario
 * 2. Envío de OTP
 * 3. Verificación de OTP
 * 4. Checkout
 * 5. Setup del edificio
 * 
 * URLs:
 * - Frontend: https://chispartbuilding.pages.dev
 * - Backend: https://edificio-admin.sebastianvernis.workers.dev
 */

import fetch from 'node-fetch';

// Configuración
const FRONTEND_URL = 'https://chispartbuilding.pages.dev';
const BACKEND_URL = 'https://edificio-admin.sebastianvernis.workers.dev';

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helpers
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${'='.repeat(80)}`, 'cyan');
  log(`PASO ${step}: ${message}`, 'bright');
  log('='.repeat(80), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Generar datos de prueba únicos
const timestamp = Date.now();
const testData = {
  email: `test-${timestamp}@example.com`,
  fullName: 'Usuario Test Onboarding',
  phone: '+52 55 1234 5678',
  buildingName: `Edificio Test ${timestamp}`,
  selectedPlan: 'basico',
  password: 'TestPassword123!',
  buildingData: {
    name: `Edificio Test ${timestamp}`,
    address: 'Calle Test 123, CDMX',
    totalUnits: 15,
    type: 'edificio',
    monthlyFee: 1500,
    extraFee: 500,
    cutoffDay: 5,
    reglamento: 'Reglamento de prueba',
    funds: [
      { name: 'Fondo de Reserva', amount: 50000 },
      { name: 'Fondo de Mantenimiento', amount: 30000 }
    ]
  }
};

// Variables globales para el flujo
let otpCode = null;
let authToken = null;

/**
 * Test 1: Registro de usuario
 */
async function testRegister() {
  logStep(1, 'REGISTRO DE USUARIO');
  
  try {
    logInfo(`Registrando usuario: ${testData.email}`);
    logInfo(`Plan seleccionado: ${testData.selectedPlan}`);
    
    const response = await fetch(`${BACKEND_URL}/api/onboarding/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testData.email,
        fullName: testData.fullName,
        phone: testData.phone,
        buildingName: testData.buildingName,
        selectedPlan: testData.selectedPlan
      })
    });

    const data = await response.json();
    
    logInfo(`Status: ${response.status}`);
    logInfo(`Response: ${JSON.stringify(data, null, 2)}`);

    if (response.ok && data.ok) {
      logSuccess('Registro exitoso');
      logInfo(`Siguiente paso: ${data.data?.nextStep}`);
      return { success: true, data };
    } else {
      logError(`Registro falló: ${data.msg}`);
      return { success: false, error: data.msg };
    }
  } catch (error) {
    logError(`Error en registro: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test 2: Envío de OTP
 */
async function testSendOtp() {
  logStep(2, 'ENVÍO DE CÓDIGO OTP');
  
  try {
    logInfo(`Enviando OTP a: ${testData.email}`);
    
    // Usar la ruta correcta del Worker: /api/otp/send
    const response = await fetch(`${BACKEND_URL}/api/otp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testData.email
      })
    });

    const data = await response.json();
    
    logInfo(`Status: ${response.status}`);
    logInfo(`Response: ${JSON.stringify(data, null, 2)}`);

    if (response.ok && data.ok) {
      logSuccess('OTP enviado exitosamente');
      
      // En desarrollo, el OTP puede venir en la respuesta
      if (data.otp) {
        otpCode = data.otp;
        logWarning(`⚠️  OTP DETECTADO (modo desarrollo): ${otpCode}`);
      } else {
        logInfo('OTP enviado por email (modo producción)');
        logWarning('⚠️  Necesitarás ingresar el código manualmente desde el email');
      }
      
      return { success: true, data, otp: otpCode };
    } else {
      logError(`Envío de OTP falló: ${data.msg}`);
      return { success: false, error: data.msg };
    }
  } catch (error) {
    logError(`Error enviando OTP: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test 3: Verificación de OTP
 */
async function testVerifyOtp(code) {
  logStep(3, 'VERIFICACIÓN DE CÓDIGO OTP');
  
  try {
    if (!code) {
      logError('No se proporcionó código OTP');
      return { success: false, error: 'Código OTP no disponible' };
    }
    
    logInfo(`Verificando código: ${code}`);
    
    // El Worker espera 'otp' no 'code'
    const response = await fetch(`${BACKEND_URL}/api/onboarding/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testData.email,
        otp: code  // Cambiar 'code' a 'otp'
      })
    });

    const data = await response.json();
    
    logInfo(`Status: ${response.status}`);
    logInfo(`Response: ${JSON.stringify(data, null, 2)}`);

    if (response.ok && data.ok) {
      logSuccess('OTP verificado correctamente');
      logInfo(`Siguiente paso: ${data.nextStep}`);
      return { success: true, data };
    } else {
      logError(`Verificación de OTP falló: ${data.msg}`);
      return { success: false, error: data.msg };
    }
  } catch (error) {
    logError(`Error verificando OTP: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test 4: Checkout (Pago)
 */
async function testCheckout() {
  logStep(4, 'CHECKOUT - PROCESAMIENTO DE PAGO');
  
  try {
    logInfo('Procesando pago (mockup)...');
    
    const response = await fetch(`${BACKEND_URL}/api/onboarding/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testData.email,
        cardNumber: '4242424242424242',
        cardExpiry: '12/25',
        cardCvc: '123',
        cardName: 'Test User'
      })
    });

    const data = await response.json();
    
    logInfo(`Status: ${response.status}`);
    logInfo(`Response: ${JSON.stringify(data, null, 2)}`);

    if (response.ok && data.ok) {
      logSuccess('Pago procesado exitosamente');
      logInfo(`Transaction ID: ${data.data?.transactionId}`);
      logInfo(`Monto: $${data.data?.amount}`);
      logInfo(`Siguiente paso: ${data.data?.nextStep}`);
      return { success: true, data };
    } else {
      logError(`Checkout falló: ${data.msg}`);
      return { success: false, error: data.msg };
    }
  } catch (error) {
    logError(`Error en checkout: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test 5: Setup del edificio
 */
async function testSetupBuilding() {
  logStep(5, 'SETUP INICIAL DEL EDIFICIO');
  
  try {
    logInfo('Configurando edificio y creando usuario admin...');
    
    // Usar el endpoint correcto del Worker: /api/onboarding/complete-setup
    const response = await fetch(`${BACKEND_URL}/api/onboarding/complete-setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testData.email,
        password: testData.password,
        buildingData: testData.buildingData
      })
    });

    const data = await response.json();
    
    logInfo(`Status: ${response.status}`);
    logInfo(`Response: ${JSON.stringify(data, null, 2)}`);

    if (response.ok && data.ok) {
      logSuccess('Setup completado exitosamente');
      authToken = data.token;
      logInfo(`Token JWT generado: ${authToken?.substring(0, 20)}...`);
      logInfo(`Usuario creado: ${data.usuario?.nombre} (${data.usuario?.email})`);
      logInfo(`Rol: ${data.usuario?.rol}`);
      logInfo(`Edificio: ${data.usuario?.building?.name}`);
      return { success: true, data, token: authToken };
    } else {
      logError(`Setup falló: ${data.msg}`);
      return { success: false, error: data.msg };
    }
  } catch (error) {
    logError(`Error en setup: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test 6: Verificar datos persistidos
 */
async function testVerifyData() {
  logStep(6, 'VERIFICACIÓN DE DATOS PERSISTIDOS');
  
  try {
    if (!authToken) {
      logError('No hay token de autenticación disponible');
      return { success: false, error: 'Token no disponible' };
    }
    
    logInfo('Verificando datos del edificio...');
    
    const response = await fetch(`${BACKEND_URL}/api/onboarding/building-info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': authToken
      }
    });

    const data = await response.json();
    
    logInfo(`Status: ${response.status}`);
    logInfo(`Response: ${JSON.stringify(data, null, 2)}`);

    if (response.ok && data.ok) {
      logSuccess('Datos del edificio recuperados correctamente');
      logInfo(`Edificio: ${data.building?.name}`);
      logInfo(`Dirección: ${data.building?.address}`);
      logInfo(`Unidades: ${data.building?.totalUnits}`);
      return { success: true, data };
    } else {
      logError(`Verificación falló: ${data.msg}`);
      return { success: false, error: data.msg };
    }
  } catch (error) {
    logError(`Error verificando datos: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test 7: Verificar login con credenciales
 */
async function testLogin(setupResult) {
  logStep(7, 'VERIFICACIÓN DE LOGIN');
  
  try {
    // Usar la contraseña que devolvió el setup
    const loginPassword = setupResult?.data?.credentials?.password || testData.password;
    
    logInfo(`Intentando login con: ${testData.email}`);
    logInfo(`Contraseña: ${loginPassword}`);
    
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testData.email,
        password: loginPassword
      })
    });

    const data = await response.json();
    
    logInfo(`Status: ${response.status}`);
    logInfo(`Response: ${JSON.stringify(data, null, 2)}`);

    if (response.ok && (data.ok || data.success)) {
      logSuccess('Login exitoso');
      authToken = data.token;
      logInfo(`Token JWT: ${authToken?.substring(0, 20)}...`);
      logInfo(`Usuario: ${data.usuario?.nombre || data.user?.nombre}`);
      logInfo(`Rol: ${data.usuario?.rol || data.user?.rol}`);
      return { success: true, data, token: authToken };
    } else {
      logError(`Login falló: ${data.msg || data.message}`);
      return { success: false, error: data.msg || data.message };
    }
  } catch (error) {
    logError(`Error en login: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Ejecutar todos los tests
 */
async function runAllTests() {
  log('\n' + '█'.repeat(80), 'magenta');
  log('  TEST COMPLETO DE ONBOARDING EN PRODUCCIÓN', 'bright');
  log('█'.repeat(80) + '\n', 'magenta');
  
  logInfo(`Frontend: ${FRONTEND_URL}`);
  logInfo(`Backend: ${BACKEND_URL}`);
  logInfo(`Email de prueba: ${testData.email}`);
  
  const results = {
    register: null,
    sendOtp: null,
    verifyOtp: null,
    checkout: null,
    setupBuilding: null,
    verifyData: null,
    login: null
  };

  // Test 1: Registro
  results.register = await testRegister();
  if (!results.register.success) {
    logError('❌ FLUJO DETENIDO: Registro falló');
    return printSummary(results);
  }

  // Esperar 2 segundos
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Envío de OTP
  results.sendOtp = await testSendOtp();
  if (!results.sendOtp.success) {
    logError('❌ FLUJO DETENIDO: Envío de OTP falló');
    return printSummary(results);
  }

  // Si no tenemos OTP automático, solicitar al usuario
  if (!otpCode) {
    logWarning('\n⚠️  MODO PRODUCCIÓN DETECTADO');
    logInfo('El código OTP fue enviado por email.');
    logInfo('Para continuar el test, necesitas:');
    logInfo('1. Revisar el email de prueba');
    logInfo('2. Obtener el código de 6 dígitos');
    logInfo('3. Ejecutar manualmente la verificación');
    logInfo('\nEjemplo:');
    log(`  curl -X POST ${BACKEND_URL}/api/onboarding/verify-otp \\`, 'cyan');
    log(`    -H "Content-Type: application/json" \\`, 'cyan');
    log(`    -d '{"email":"${testData.email}","code":"123456"}'`, 'cyan');
    return printSummary(results);
  }

  // Esperar 2 segundos
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3: Verificación de OTP
  results.verifyOtp = await testVerifyOtp(otpCode);
  if (!results.verifyOtp.success) {
    logError('❌ FLUJO DETENIDO: Verificación de OTP falló');
    return printSummary(results);
  }

  // Esperar 2 segundos
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 4: Checkout
  results.checkout = await testCheckout();
  if (!results.checkout.success) {
    logError('❌ FLUJO DETENIDO: Checkout falló');
    return printSummary(results);
  }

  // Esperar 2 segundos
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 5: Setup del edificio
  results.setupBuilding = await testSetupBuilding();
  if (!results.setupBuilding.success) {
    logError('❌ FLUJO DETENIDO: Setup del edificio falló');
    return printSummary(results);
  }

  // Esperar 2 segundos
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 7: Verificar login (pasar resultado del setup) - ANTES de verificar datos
  results.login = await testLogin(results.setupBuilding);

  // Esperar 2 segundos
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 6: Verificar datos persistidos (después del login para tener token)
  results.verifyData = await testVerifyData();

  // Imprimir resumen
  printSummary(results);
}

/**
 * Imprimir resumen de resultados
 */
function printSummary(results) {
  log('\n' + '█'.repeat(80), 'magenta');
  log('  RESUMEN DE RESULTADOS', 'bright');
  log('█'.repeat(80) + '\n', 'magenta');

  const tests = [
    { name: 'Registro de usuario', key: 'register' },
    { name: 'Envío de OTP', key: 'sendOtp' },
    { name: 'Verificación de OTP', key: 'verifyOtp' },
    { name: 'Checkout (Pago)', key: 'checkout' },
    { name: 'Setup del edificio', key: 'setupBuilding' },
    { name: 'Verificación de datos', key: 'verifyData' },
    { name: 'Login con credenciales', key: 'login' }
  ];

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  tests.forEach(test => {
    const result = results[test.key];
    if (!result) {
      log(`⏭️  ${test.name}: OMITIDO`, 'yellow');
      skipped++;
    } else if (result.success) {
      log(`✅ ${test.name}: EXITOSO`, 'green');
      passed++;
    } else {
      log(`❌ ${test.name}: FALLÓ - ${result.error}`, 'red');
      failed++;
    }
  });

  log('\n' + '-'.repeat(80), 'cyan');
  log(`Total: ${tests.length} tests`, 'bright');
  log(`✅ Exitosos: ${passed}`, 'green');
  log(`❌ Fallidos: ${failed}`, 'red');
  log(`⏭️  Omitidos: ${skipped}`, 'yellow');
  log('-'.repeat(80) + '\n', 'cyan');

  // Diagnóstico de problemas
  if (failed > 0 || skipped > 0) {
    log('🔍 DIAGNÓSTICO DE PROBLEMAS:', 'yellow');
    
    if (!results.register?.success) {
      log('  • El endpoint de registro no está funcionando', 'red');
      log('    Verificar: /api/onboarding/register', 'yellow');
    }
    
    if (!results.sendOtp?.success) {
      log('  • El envío de OTP está fallando', 'red');
      log('    Verificar: /api/onboarding/send-otp', 'yellow');
      log('    Verificar: Configuración SMTP', 'yellow');
    }
    
    if (!results.verifyOtp?.success && results.sendOtp?.success) {
      log('  • La verificación de OTP está fallando', 'red');
      log('    Verificar: /api/onboarding/verify-otp', 'yellow');
      log('    Verificar: Lógica de validación de código', 'yellow');
    }
    
    if (!results.checkout?.success && results.verifyOtp?.success) {
      log('  • El checkout está fallando', 'red');
      log('    Verificar: /api/onboarding/checkout', 'yellow');
    }
    
    if (!results.setupBuilding?.success && results.checkout?.success) {
      log('  • El setup del edificio está fallando', 'red');
      log('    Verificar: /api/onboarding/setup-building', 'yellow');
      log('    Verificar: Persistencia de datos', 'yellow');
    }
    
    if (!results.verifyData?.success && results.setupBuilding?.success) {
      log('  • Los datos no se están persistiendo correctamente', 'red');
      log('    Verificar: Base de datos / data.json', 'yellow');
    }
    
    if (!results.login?.success && results.setupBuilding?.success) {
      log('  • El login no está funcionando', 'red');
      log('    Verificar: /api/auth/login', 'yellow');
      log('    Verificar: Hash de contraseña', 'yellow');
    }
  } else {
    log('🎉 ¡TODOS LOS TESTS PASARON EXITOSAMENTE!', 'green');
  }

  log('\n' + '█'.repeat(80) + '\n', 'magenta');
}

// Ejecutar tests
runAllTests().catch(error => {
  logError(`Error fatal: ${error.message}`);
  console.error(error);
  process.exit(1);
});
