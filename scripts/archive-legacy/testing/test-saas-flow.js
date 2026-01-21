import fetch from 'node-fetch';

const API = 'https://edificio-admin.sebastianvernis.workers.dev';

console.log('🧪 Testing SAAS Onboarding Flow\n');

// Step 1: Register
console.log('1️⃣  POST /api/onboarding/register');
const register = await fetch(`${API}/api/onboarding/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@edificio.com',
    fullName: 'Test Usuario',
    phone: '555-1234',
    buildingName: 'Edificio Test',
    selectedPlan: 'basico'
  })
});
const registerData = await register.json();
console.log(`   Status: ${register.status}`);
console.log(`   Success: ${registerData.ok ? '✅' : '❌'}`);
console.log(`   Message: ${registerData.msg}`);
console.log(`   OTP: ${registerData.otp}`);
console.log('');

// Step 2: Verify OTP
if (registerData.otp) {
  console.log('2️⃣  POST /api/onboarding/verify-otp');
  const verify = await fetch(`${API}/api/onboarding/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@edificio.com',
      otp: registerData.otp
    })
  });
  const verifyData = await verify.json();
  console.log(`   Status: ${verify.status}`);
  console.log(`   Success: ${verifyData.ok ? '✅' : '❌'}`);
  console.log(`   Message: ${verifyData.msg}`);
  console.log('');

  // Step 3: Complete setup
  if (verifyData.ok) {
    console.log('3️⃣  POST /api/onboarding/complete-setup');
    const setup = await fetch(`${API}/api/onboarding/complete-setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@edificio.com',
        buildingName: 'Edificio Test',
        unitsCount: 20,
        address: 'Calle Test 123',
        selectedPlan: 'basico'
      })
    });
    const setupData = await setup.json();
    console.log(`   Status: ${setup.status}`);
    console.log(`   Success: ${setupData.ok ? '✅' : '❌'}`);
    console.log(`   Message: ${setupData.msg}`);
    if (setupData.credentials) {
      console.log(`   Email: ${setupData.credentials.email}`);
      console.log(`   Password: ${setupData.credentials.password}`);
    }
    console.log('');
  }
}

console.log('═══════════════════════════════════════════════════');
console.log('✅ SAAS Flow Test Complete!');
