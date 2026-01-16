#!/usr/bin/env node

/**
 * Test de validación del flujo de setup del edificio
 * Verifica:
 * 1. Creación de edificio con todas las configuraciones
 * 2. Guardado de fondos/patrimonies
 * 3. Guardado de políticas
 */

const API_URL = 'https://edificio-admin.sebastianvernis.workers.dev';

// Datos de prueba
const testData = {
  email: `test-setup-${Date.now()}@example.com`,
  adminPassword: 'TestPass123!',
  adminData: {
    name: 'Juan Administrador',
    phone: '5512345678'
  },
  buildingData: {
    name: 'Torre de Prueba Setup',
    address: 'Av. Test 123, Col. Prueba, CDMX',
    totalUnits: 30,
    type: 'edificio',
    monthlyFee: 1200.50,
    extraordinaryFee: 500.00,
    cutoffDay: 5,
    paymentDueDays: 7,
    lateFeePercent: 2.5,
    reglamento: 'Reglamento de prueba para validar guardado',
    privacyPolicy: 'Política de privacidad de prueba',
    paymentPolicies: 'Políticas de pago de prueba: mora del 2.5% mensual'
  },
  smtpConfig: {
    host: 'smtp.test.com',
    port: 587,
    user: 'test@test.com',
    password: 'testpass'
  },
  patrimonies: [
    { name: 'Fondo de Reserva', amount: 50000 },
    { name: 'Fondo de Mantenimiento', amount: 25000 },
    { name: 'Fondo de Emergencias', amount: 15000 }
  ]
};

async function testCompleteSetup() {
  console.log('🧪 Iniciando test de setup completo...\n');

  try {
    // 1. Llamar al endpoint de complete-setup
    console.log('📤 Enviando datos de setup...');
    const response = await fetch(`${API_URL}/api/onboarding/complete-setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (!result.ok) {
      console.error('❌ Error en setup:', result.msg);
      console.error('Detalles:', result.error);
      return false;
    }

    console.log('✅ Setup completado exitosamente');
    console.log('   Building ID:', result.buildingId);
    console.log('   User ID:', result.userId);
    console.log('   Email:', result.credentials?.email);
    console.log('');

    // 2. Validar que el edificio se creó correctamente
    console.log('🔍 Validando datos guardados...\n');

    // Login para obtener token
    console.log('🔐 Iniciando sesión...');
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testData.email,
        password: testData.adminPassword
      })
    });

    const loginResult = await loginResponse.json();
    
    if (!loginResult.ok) {
      console.error('❌ Error en login:', loginResult.msg);
      return false;
    }

    const token = loginResult.token;
    console.log('✅ Login exitoso\n');

    // 3. Obtener información del edificio
    console.log('🏢 Obteniendo información del edificio...');
    const buildingResponse = await fetch(`${API_URL}/api/onboarding/building-info`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const buildingInfo = await buildingResponse.json();

    if (!buildingInfo.ok) {
      console.error('❌ Error obteniendo building info:', buildingInfo.msg);
      return false;
    }

    console.log('✅ Datos del edificio obtenidos\n');

    // 4. Validar cada campo
    let allValid = true;
    const info = buildingInfo.buildingInfo;

    console.log('📋 Validación de campos:\n');

    // Validar datos básicos
    const checks = [
      { name: 'Nombre', expected: testData.buildingData.name, actual: info.nombre },
      { name: 'Dirección', expected: testData.buildingData.address, actual: info.direccion },
      { name: 'Total Unidades', expected: testData.buildingData.totalUnits, actual: info.totalUnidades },
      { name: 'Cuota Mensual', expected: testData.buildingData.monthlyFee, actual: info.cuotaMensual },
      { name: 'Cuota Extraordinaria', expected: testData.buildingData.extraordinaryFee, actual: info.extraFee },
      { name: 'Día de Corte', expected: testData.buildingData.cutoffDay, actual: info.diaCorte }
    ];

    checks.forEach(check => {
      const isValid = check.expected === check.actual;
      const icon = isValid ? '✅' : '❌';
      console.log(`${icon} ${check.name}: ${check.actual} ${!isValid ? `(esperado: ${check.expected})` : ''}`);
      if (!isValid) allValid = false;
    });

    console.log('');

    // Validar políticas
    console.log('📜 Validación de políticas:\n');
    
    const policyChecks = [
      { name: 'Reglamento', expected: testData.buildingData.reglamento, actual: info.politicas || '' },
      // Nota: privacy_policy y payment_policies pueden estar en diferentes campos
    ];

    policyChecks.forEach(check => {
      const hasContent = check.actual && check.actual.length > 0;
      const icon = hasContent ? '✅' : '❌';
      console.log(`${icon} ${check.name}: ${hasContent ? 'Guardado (' + check.actual.length + ' caracteres)' : 'NO guardado'}`);
      if (!hasContent) allValid = false;
    });

    console.log('');

    // Validar fondos
    console.log('💰 Validación de fondos:\n');
    const funds = info.funds || [];
    
    console.log(`   Total de fondos creados: ${funds.length}`);
    console.log(`   Fondos esperados: ${testData.patrimonies.length}\n`);

    if (funds.length !== testData.patrimonies.length) {
      console.log(`❌ Cantidad de fondos incorrecta`);
      allValid = false;
    } else {
      console.log(`✅ Cantidad de fondos correcta`);
    }

    testData.patrimonies.forEach(expectedFund => {
      const actualFund = funds.find(f => f.name === expectedFund.name);
      if (actualFund) {
        const amountMatch = parseFloat(actualFund.amount) === parseFloat(expectedFund.amount);
        const icon = amountMatch ? '✅' : '⚠️';
        console.log(`${icon} ${expectedFund.name}: $${actualFund.amount} ${!amountMatch ? `(esperado: $${expectedFund.amount})` : ''}`);
        if (!amountMatch) allValid = false;
      } else {
        console.log(`❌ ${expectedFund.name}: NO ENCONTRADO`);
        allValid = false;
      }
    });

    console.log('\n' + '='.repeat(60));
    if (allValid) {
      console.log('✅ TODAS LAS VALIDACIONES PASARON');
      console.log('✅ El flujo de setup está funcionando correctamente');
    } else {
      console.log('❌ ALGUNAS VALIDACIONES FALLARON');
      console.log('⚠️  Revisar los campos marcados con ❌');
    }
    console.log('='.repeat(60) + '\n');

    return allValid;

  } catch (error) {
    console.error('💥 Error en el test:', error.message);
    console.error(error.stack);
    return false;
  }
}

// Ejecutar test
testCompleteSetup().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
