import fetch from 'node-fetch';

async function checkStatus() {
  console.log('Checking Worker status...\n');
  
  try {
    const response = await fetch('https://edificio-admin-saas-adapted.sebastianvernis.workers.dev/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test', password: 'test' })
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('\nResponse preview:', text.substring(0, 200));
    
    if (text.includes('Worker exceeded resource limits')) {
      console.log('\n🚨 WORKER CAÍDO - Error 1102');
      console.log('El Worker está excediendo límites de CPU/memoria');
      console.log('\nSoluciones:');
      console.log('1. Esperar unos minutos para cooldown');
      console.log('2. Redeploy del Worker: wrangler deploy');
      console.log('3. Revisar logs: wrangler tail');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkStatus();
