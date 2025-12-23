import fetch from 'node-fetch';

const BASE_URL = 'https://edificio-admin-saas-adapted.sebastianvernis.workers.dev';

async function testRealUser() {
  console.log('Testing with real user from DB: sebas@sebas.com\n');
  
  // Probar con usuario real de la DB
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'sebas@sebas.com',
      password: 'Admin123!'
    })
  });
  
  const data = await response.json();
  console.log(`Status: ${response.status}`);
  console.log(`Response:`, JSON.stringify(data, null, 2));
  
  if (response.status === 200 && data.token) {
    console.log('\n✅ Login exitoso!');
    console.log(`Token: ${data.token.substring(0, 50)}...`);
    return data.token;
  } else {
    console.log('\n❌ Login failed - Usuario puede no tener password o password incorrecto');
    return null;
  }
}

testRealUser();
