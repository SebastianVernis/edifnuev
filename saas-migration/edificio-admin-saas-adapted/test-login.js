import fetch from 'node-fetch';

const BASE_URL = 'https://edificio-admin-saas-adapted.sebastianvernis.workers.dev';

async function testLogin() {
  console.log('Testing login with different credentials...\n');
  
  const testCases = [
    { email: 'admin@edificio205.com', password: 'Gemelo1' },
    { email: 'admin@edificio205.com', password: 'Admin123!' },
    { email: 'test@example.com', password: 'Admin123!' },
  ];
  
  for (const creds of testCases) {
    console.log(`\nTesting: ${creds.email} / ${creds.password}`);
    
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds)
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
  }
}

testLogin();
