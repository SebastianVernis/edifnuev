#!/usr/bin/env node

/**
 * Test complete setup flow with funds and building configuration
 */

const API = 'http://localhost:8787';

async function testSetupFlow() {
  console.log('🧪 Testing Complete Setup Flow\n');
  
  const testEmail = `test${Date.now()}@example.com`;
  
  try {
    // 1. Complete setup with funds and config
    console.log('1️⃣  POST /api/onboarding/complete-setup');
    const setupResponse = await fetch(`${API}/api/onboarding/complete-setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        buildingData: {
          name: 'Edificio Test',
          address: 'Calle Test 123',
          totalUnits: 25,
          monthlyFee: 2500,
          extraFee: 500,
          cutoffDay: 5,
          reglamento: 'Test policies and regulations',
          funds: [
            { name: 'Ahorro Acumulado', amount: 67500 },
            { name: 'Gastos Mayores', amount: 125000 },
            { name: 'Dinero Operacional', amount: 48000 },
            { name: 'Patrimonio Total', amount: 240500 }
          ]
        }
      })
    });
    
    const setupData = await setupResponse.json();
    console.log('Setup Response:', JSON.stringify(setupData, null, 2));
    
    if (!setupData.ok) {
      console.error('❌ Setup failed:', setupData.msg);
      return;
    }
    
    console.log('✅ Setup completed successfully');
    console.log('   Building ID:', setupData.buildingId);
    console.log('   User ID:', setupData.userId);
    console.log('   Email:', setupData.credentials.email);
    console.log('   Password:', setupData.credentials.password);
    
    // 2. Login with created credentials
    console.log('\n2️⃣  POST /api/auth/login');
    const loginResponse = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login Response:', JSON.stringify(loginData, null, 2));
    
    if (!loginData.ok && !loginData.success) {
      console.error('❌ Login failed:', loginData.msg || loginData.message);
      return;
    }
    
    console.log('✅ Login successful');
    const token = loginData.token;
    
    // 3. Get building info with funds
    console.log('\n3️⃣  GET /api/onboarding/building-info');
    const buildingInfoResponse = await fetch(`${API}/api/onboarding/building-info`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const buildingInfo = await buildingInfoResponse.json();
    console.log('Building Info Response:', JSON.stringify(buildingInfo, null, 2));
    
    if (!buildingInfo.ok) {
      console.error('❌ Failed to get building info:', buildingInfo.msg);
      return;
    }
    
    console.log('✅ Building info retrieved successfully');
    console.log('\n📊 Building Configuration:');
    console.log('   Name:', buildingInfo.buildingInfo.nombre);
    console.log('   Address:', buildingInfo.buildingInfo.direccion);
    console.log('   Total Units:', buildingInfo.buildingInfo.totalUnidades);
    console.log('   Monthly Fee:', buildingInfo.buildingInfo.cuotaMensual);
    console.log('   Extra Fee:', buildingInfo.buildingInfo.extraFee);
    console.log('   Cutoff Day:', buildingInfo.buildingInfo.diaCorte);
    console.log('   Policies:', buildingInfo.buildingInfo.politicas?.substring(0, 50) + '...');
    
    console.log('\n💰 Funds:');
    buildingInfo.buildingInfo.funds.forEach(fund => {
      console.log(`   - ${fund.name}: $${fund.amount.toLocaleString('es-MX')}`);
    });
    
    // 4. Verify all values match what was sent
    console.log('\n✅ Verification:');
    const checks = [
      { name: 'Name', expected: 'Edificio Test', actual: buildingInfo.buildingInfo.nombre },
      { name: 'Address', expected: 'Calle Test 123', actual: buildingInfo.buildingInfo.direccion },
      { name: 'Total Units', expected: 25, actual: buildingInfo.buildingInfo.totalUnidades },
      { name: 'Monthly Fee', expected: 2500, actual: buildingInfo.buildingInfo.cuotaMensual },
      { name: 'Extra Fee', expected: 500, actual: buildingInfo.buildingInfo.extraFee },
      { name: 'Cutoff Day', expected: 5, actual: buildingInfo.buildingInfo.diaCorte },
      { name: 'Funds Count', expected: 4, actual: buildingInfo.buildingInfo.funds.length }
    ];
    
    let allPassed = true;
    checks.forEach(check => {
      const passed = check.expected === check.actual;
      allPassed = allPassed && passed;
      console.log(`   ${passed ? '✅' : '❌'} ${check.name}: ${check.actual} ${passed ? '' : `(expected: ${check.expected})`}`);
    });
    
    if (allPassed) {
      console.log('\n🎉 All tests passed! Setup flow is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Check the values above.');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error.stack);
  }
}

testSetupFlow();
