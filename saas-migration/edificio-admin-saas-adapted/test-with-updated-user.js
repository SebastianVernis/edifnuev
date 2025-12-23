import fetch from 'node-fetch';

const BASE_URL = 'https://edificio-admin-saas-adapted.sebastianvernis.workers.dev';

async function testLogin() {
  console.log('Testing login with updated password...\n');
  
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'sebas@sebas.com',
      password: 'TestPass123!'
    })
  });
  
  const data = await response.json();
  console.log(`Status: ${response.status}`);
  console.log(`Response:`, JSON.stringify(data, null, 2));
  
  if (response.status === 200 && data.token) {
    console.log('\n✅ LOGIN EXITOSO!');
    console.log(`✅ Token: ${data.token.substring(0, 80)}...`);
    console.log('\n🚀 API accesible sin Zero Trust');
    console.log('🚀 Ready para ejecutar tests E2E completos\n');
    return true;
  } else {
    console.log('\n❌ Login failed\n');
    return false;
  }
}

testLogin();
