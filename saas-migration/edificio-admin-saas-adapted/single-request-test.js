import fetch from 'node-fetch';

async function singleTest() {
  console.log('Testing single login request...\n');
  
  const response = await fetch('https://edificio-admin-saas-adapted.sebastianvernis.workers.dev/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'sebas@sebas.com',
      password: 'TestPass123!'
    })
  });
  
  console.log('Status:', response.status);
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}

singleTest();
