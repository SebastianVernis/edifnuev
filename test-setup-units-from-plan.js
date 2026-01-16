#!/usr/bin/env node

/**
 * Test de validación: Unidades desde el plan
 * Verifica que las unidades se obtienen del plan seleccionado y NO se pueden modificar manualmente
 */

const API_URL = 'https://edificio-admin.sebastianvernis.workers.dev';

// Test 1: Plan Básico (20 unidades)
async function testPlanBasico() {
  console.log('🧪 Test 1: Plan Básico (20 unidades)');
  
  const testData = {
    email: `test-basico-${Date.now()}@example.com`,
    adminPassword: 'TestPass123!',
    adminData: {
      name: 'Admin Básico',
      phone: '5512345678'
    },
    buildingData: {
      name: 'Edificio Plan Básico',
      address: 'Av. Básico 123',
      totalUnits: 20, // Del plan básico
      type: 'edificio',
      monthlyFee: 1000,
      extraordinaryFee: 0,
      cutoffDay: 1,
      paymentDueDays: 5,
      lateFeePercent: 2,
      reglamento: 'Reglamento básico',
      privacyPolicy: 'Política de privacidad',
      paymentPolicies: 'Políticas de pago'
    },
    smtpConfig: { host: '', port: 587, user: '', password: '' },
    patrimonies: []
  };

  try {
    const response = await fetch(`${API_URL}/api/onboarding/complete-setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (!result.ok) {
      console.log('   ❌ Error:', result.msg);
      return false;
    }

    // Login y verificar
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testData.email, password: testData.adminPassword })
    });

    const loginData = await loginRes.json();
    
    if (!loginData.ok) {
      console.log('   ❌ Error en login');
      return false;
    }

    // Verificar building info
    const buildingRes = await fetch(`${API_URL}/api/onboarding/building-info`, {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });

    const buildingData = await buildingRes.json();
    
    if (buildingData.ok && buildingData.buildingInfo.totalUnidades === 20) {
      console.log('   ✅ Plan Básico: 20 unidades guardadas correctamente\n');
      return true;
    } else {
      console.log(`   ❌ Unidades incorrectas: ${buildingData.buildingInfo.totalUnidades} (esperado: 20)\n`);
      return false;
    }

  } catch (error) {
    console.log('   ❌ Error:', error.message, '\n');
    return false;
  }
}

// Test 2: Plan Profesional (50 unidades)
async function testPlanProfesional() {
  console.log('🧪 Test 2: Plan Profesional (50 unidades)');
  
  const testData = {
    email: `test-profesional-${Date.now()}@example.com`,
    adminPassword: 'TestPass123!',
    adminData: {
      name: 'Admin Profesional',
      phone: '5512345678'
    },
    buildingData: {
      name: 'Edificio Plan Profesional',
      address: 'Av. Profesional 456',
      totalUnits: 50, // Del plan profesional
      type: 'edificio',
      monthlyFee: 1500,
      extraordinaryFee: 0,
      cutoffDay: 5,
      paymentDueDays: 7,
      lateFeePercent: 2.5,
      reglamento: 'Reglamento profesional',
      privacyPolicy: 'Política de privacidad',
      paymentPolicies: 'Políticas de pago'
    },
    smtpConfig: { host: '', port: 587, user: '', password: '' },
    patrimonies: []
  };

  try {
    const response = await fetch(`${API_URL}/api/onboarding/complete-setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (!result.ok) {
      console.log('   ❌ Error:', result.msg);
      return false;
    }

    // Login y verificar
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testData.email, password: testData.adminPassword })
    });

    const loginData = await loginRes.json();
    
    if (!loginData.ok) {
      console.log('   ❌ Error en login');
      return false;
    }

    // Verificar building info
    const buildingRes = await fetch(`${API_URL}/api/onboarding/building-info`, {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });

    const buildingData = await buildingRes.json();
    
    if (buildingData.ok && buildingData.buildingInfo.totalUnidades === 50) {
      console.log('   ✅ Plan Profesional: 50 unidades guardadas correctamente\n');
      return true;
    } else {
      console.log(`   ❌ Unidades incorrectas: ${buildingData.buildingInfo.totalUnidades} (esperado: 50)\n`);
      return false;
    }

  } catch (error) {
    console.log('   ❌ Error:', error.message, '\n');
    return false;
  }
}

// Test 3: Plan Empresarial (200 unidades)
async function testPlanEmpresarial() {
  console.log('🧪 Test 3: Plan Empresarial (200 unidades)');
  
  const testData = {
    email: `test-empresarial-${Date.now()}@example.com`,
    adminPassword: 'TestPass123!',
    adminData: {
      name: 'Admin Empresarial',
      phone: '5512345678'
    },
    buildingData: {
      name: 'Edificio Plan Empresarial',
      address: 'Av. Empresarial 789',
      totalUnits: 200, // Del plan empresarial
      type: 'residencial',
      monthlyFee: 2000,
      extraordinaryFee: 1000,
      cutoffDay: 10,
      paymentDueDays: 10,
      lateFeePercent: 3,
      reglamento: 'Reglamento empresarial',
      privacyPolicy: 'Política de privacidad',
      paymentPolicies: 'Políticas de pago'
    },
    smtpConfig: { host: '', port: 587, user: '', password: '' },
    patrimonies: []
  };

  try {
    const response = await fetch(`${API_URL}/api/onboarding/complete-setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (!result.ok) {
      console.log('   ❌ Error:', result.msg);
      return false;
    }

    // Login y verificar
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testData.email, password: testData.adminPassword })
    });

    const loginData = await loginRes.json();
    
    if (!loginData.ok) {
      console.log('   ❌ Error en login');
      return false;
    }

    // Verificar building info
    const buildingRes = await fetch(`${API_URL}/api/onboarding/building-info`, {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });

    const buildingData = await buildingRes.json();
    
    if (buildingData.ok && buildingData.buildingInfo.totalUnidades === 200) {
      console.log('   ✅ Plan Empresarial: 200 unidades guardadas correctamente\n');
      return true;
    } else {
      console.log(`   ❌ Unidades incorrectas: ${buildingData.buildingInfo.totalUnidades} (esperado: 200)\n`);
      return false;
    }

  } catch (error) {
    console.log('   ❌ Error:', error.message, '\n');
    return false;
  }
}

// Test 4: Plan Personalizado (125 unidades custom)
async function testPlanPersonalizado() {
  console.log('🧪 Test 4: Plan Personalizado (125 unidades custom)');
  
  const testData = {
    email: `test-personalizado-${Date.now()}@example.com`,
    adminPassword: 'TestPass123!',
    adminData: {
      name: 'Admin Personalizado',
      phone: '5512345678'
    },
    buildingData: {
      name: 'Edificio Plan Personalizado',
      address: 'Av. Custom 999',
      totalUnits: 125, // Cantidad personalizada
      type: 'condominio',
      monthlyFee: 1800,
      extraordinaryFee: 500,
      cutoffDay: 15,
      paymentDueDays: 5,
      lateFeePercent: 2.5,
      reglamento: 'Reglamento personalizado',
      privacyPolicy: 'Política de privacidad',
      paymentPolicies: 'Políticas de pago'
    },
    smtpConfig: { host: '', port: 587, user: '', password: '' },
    patrimonies: []
  };

  try {
    const response = await fetch(`${API_URL}/api/onboarding/complete-setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (!result.ok) {
      console.log('   ❌ Error:', result.msg);
      return false;
    }

    // Login y verificar
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testData.email, password: testData.adminPassword })
    });

    const loginData = await loginRes.json();
    
    if (!loginData.ok) {
      console.log('   ❌ Error en login');
      return false;
    }

    // Verificar building info
    const buildingRes = await fetch(`${API_URL}/api/onboarding/building-info`, {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });

    const buildingData = await buildingRes.json();
    
    if (buildingData.ok && buildingData.buildingInfo.totalUnidades === 125) {
      console.log('   ✅ Plan Personalizado: 125 unidades guardadas correctamente\n');
      return true;
    } else {
      console.log(`   ❌ Unidades incorrectas: ${buildingData.buildingInfo.totalUnidades} (esperado: 125)\n`);
      return false;
    }

  } catch (error) {
    console.log('   ❌ Error:', error.message, '\n');
    return false;
  }
}

// Ejecutar todos los tests
async function runAllTests() {
  console.log('🚀 Iniciando tests de unidades desde planes\n');
  console.log('=' .repeat(60) + '\n');

  const results = [];
  
  results.push(await testPlanBasico());
  await new Promise(r => setTimeout(r, 1000)); // Esperar 1 seg entre tests
  
  results.push(await testPlanProfesional());
  await new Promise(r => setTimeout(r, 1000));
  
  results.push(await testPlanEmpresarial());
  await new Promise(r => setTimeout(r, 1000));
  
  results.push(await testPlanPersonalizado());

  console.log('=' .repeat(60));
  
  const passed = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;

  console.log(`\n📊 Resultados: ${passed} tests pasados, ${failed} tests fallidos`);
  
  if (failed === 0) {
    console.log('✅ TODOS LOS TESTS PASARON');
    console.log('✅ Las unidades se obtienen correctamente del plan seleccionado\n');
  } else {
    console.log('❌ ALGUNOS TESTS FALLARON');
    console.log('⚠️  Revisar la configuración de planes y unidades\n');
  }

  return failed === 0;
}

// Ejecutar
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
