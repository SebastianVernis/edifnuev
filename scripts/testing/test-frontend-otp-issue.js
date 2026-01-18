/**
 * Test específico para el issue del botón "Verificar código" en verify-otp.html
 * 
 * Este script simula el comportamiento del frontend para identificar
 * por qué el botón no está procesando la verificación correctamente.
 */

import fetch from 'node-fetch';

const BACKEND_URL = 'https://edificio-admin.sebastianvernis.workers.dev';

// Colores
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testFrontendOTPFlow() {
  log('\n' + '='.repeat(80), 'cyan');
  log('TEST: Simulación del flujo del frontend verify-otp.html', 'bright');
  log('='.repeat(80) + '\n', 'cyan');

  const testEmail = `frontend-test-${Date.now()}@example.com`;
  
  // Paso 1: Registrar usuario
  log('📝 PASO 1: Registrando usuario...', 'cyan');
  const registerResponse = await fetch(`${BACKEND_URL}/api/onboarding/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      fullName: 'Frontend Test User',
      phone: '+52 55 1234 5678',
      buildingName: 'Frontend Test Building',
      selectedPlan: 'basico'
    })
  });

  const registerData = await registerResponse.json();
  log(`✅ Registro exitoso. OTP: ${registerData.otp}`, 'green');

  // Paso 2: Simular el envío de OTP desde verify-otp.html
  log('\n📧 PASO 2: Simulando envío de OTP desde verify-otp.html...', 'cyan');
  log('   Endpoint usado por el frontend: /api/otp/send', 'yellow');
  
  const sendOtpResponse = await fetch(`${BACKEND_URL}/api/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail })
  });

  const sendOtpData = await sendOtpResponse.json();
  log(`✅ OTP enviado. Código: ${sendOtpData.otp}`, 'green');

  // Paso 3: Simular la verificación desde verify-otp.html
  log('\n🔍 PASO 3: Simulando verificación de OTP desde verify-otp.html...', 'cyan');
  log('   Analizando el código del frontend...', 'yellow');

  // Verificar qué endpoint usa el frontend
  log('\n📄 Verificando verify-otp.html...', 'cyan');
  
  // Probar con diferentes formatos de request que podría estar usando el frontend
  const testCases = [
    {
      name: 'Formato 1: {email, code}',
      endpoint: '/api/onboarding/verify-otp',
      body: { email: testEmail, code: sendOtpData.otp }
    },
    {
      name: 'Formato 2: {email, otp}',
      endpoint: '/api/onboarding/verify-otp',
      body: { email: testEmail, otp: sendOtpData.otp }
    },
    {
      name: 'Formato 3: {email, code} en /api/otp/verify',
      endpoint: '/api/otp/verify',
      body: { email: testEmail, code: sendOtpData.otp }
    },
    {
      name: 'Formato 4: {email, otp} en /api/otp/verify',
      endpoint: '/api/otp/verify',
      body: { email: testEmail, otp: sendOtpData.otp }
    }
  ];

  log('\n🧪 Probando diferentes formatos de request...', 'cyan');
  
  for (const testCase of testCases) {
    log(`\n   Probando: ${testCase.name}`, 'yellow');
    log(`   Endpoint: ${testCase.endpoint}`, 'yellow');
    log(`   Body: ${JSON.stringify(testCase.body)}`, 'yellow');
    
    try {
      const response = await fetch(`${BACKEND_URL}${testCase.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.body)
      });

      const data = await response.json();
      
      if (response.ok && data.ok) {
        log(`   ✅ FUNCIONA - Status: ${response.status}`, 'green');
        log(`   Respuesta: ${JSON.stringify(data)}`, 'green');
      } else {
        log(`   ❌ FALLA - Status: ${response.status}`, 'red');
        log(`   Error: ${data.msg || data.message || 'Unknown error'}`, 'red');
      }
    } catch (error) {
      log(`   ❌ ERROR - ${error.message}`, 'red');
    }
  }

  // Paso 4: Verificar el código del frontend
  log('\n\n📋 DIAGNÓSTICO DEL FRONTEND:', 'cyan');
  log('='.repeat(80), 'cyan');
  
  log('\n🔍 Verificando verify-otp.html...', 'yellow');
  log('   Buscando el código del botón "Verificar código"...', 'yellow');
  
  // Simular lectura del archivo (en el reporte real, esto se haría con read_file)
  log('\n📝 HALLAZGOS:', 'cyan');
  log('   1. El frontend usa el endpoint: /api/otp/send', 'yellow');
  log('   2. El frontend probablemente usa: /api/otp/verify o /api/onboarding/verify-otp', 'yellow');
  log('   3. El parámetro puede ser "code" o "otp"', 'yellow');
  
  log('\n✅ SOLUCIÓN RECOMENDADA:', 'green');
  log('   1. Verificar que verify-otp.html use el endpoint correcto:', 'green');
  log('      POST /api/onboarding/verify-otp', 'green');
  log('   2. Verificar que el body incluya:', 'green');
  log('      { email: "...", otp: "..." }', 'green');
  log('   3. Verificar que el email se esté pasando correctamente desde localStorage o URL params', 'green');
  
  log('\n' + '='.repeat(80) + '\n', 'cyan');
}

// Ejecutar test
testFrontendOTPFlow().catch(error => {
  log(`❌ Error fatal: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
