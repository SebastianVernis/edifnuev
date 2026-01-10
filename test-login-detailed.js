/**
 * Test detallado de Login Flow
 */

const API_URL = 'https://edificio-admin.sebastianvernis.workers.dev';

async function testLoginDetailed() {
    console.log('🔐 Test Detallado de Login Flow\n');
    console.log('═══════════════════════════════════════════════════\n');

    // 1. Login con credenciales correctas
    console.log('1️⃣  Login con credenciales correctas...');
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@edificio.com',
            password: 'admin123'
        })
    });

    const loginData = await loginResponse.json();
    console.log(`   Status: ${loginResponse.status}`);
    console.log(`   Success: ${loginData.ok ? '✅' : '❌'}`);
    console.log(`   Token: ${loginData.token ? '✅ Recibido' : '❌ No recibido'}`);
    console.log(`   Usuario: ${loginData.usuario?.nombre || 'N/A'}`);
    console.log(`   Rol: ${loginData.usuario?.rol || 'N/A'}`);
    console.log(`   Edificio: ${loginData.usuario?.edificio_id || 'N/A'}`);
    console.log('');

    if (!loginData.token) {
        console.log('❌ No se pudo obtener token, abortando tests');
        return;
    }

    const token = loginData.token;

    // 2. Verificar token en endpoint protegido
    console.log('2️⃣  Verificar token en endpoint protegido...');
    const usuariosResponse = await fetch(`${API_URL}/api/usuarios`, {
        headers: { 'x-auth-token': token }
    });

    const usuariosData = await usuariosResponse.json();
    console.log(`   Status: ${usuariosResponse.status}`);
    console.log(`   Success: ${usuariosData.ok ? '✅' : '❌'}`);
    console.log(`   Usuarios: ${usuariosData.usuarios?.length || 0}`);
    console.log('');

    // 3. Test con token inválido
    console.log('3️⃣  Test con token inválido...');
    const invalidResponse = await fetch(`${API_URL}/api/usuarios`, {
        headers: { 'x-auth-token': 'token-invalido' }
    });

    const invalidData = await invalidResponse.json();
    console.log(`   Status: ${invalidResponse.status}`);
    console.log(`   Rechazado correctamente: ${invalidResponse.status === 401 ? '✅' : '❌'}`);
    console.log(`   Mensaje: ${invalidData.msg || 'N/A'}`);
    console.log('');

    // 4. Test sin token
    console.log('4️⃣  Test sin token...');
    const noTokenResponse = await fetch(`${API_URL}/api/usuarios`);
    const noTokenData = await noTokenResponse.json();
    console.log(`   Status: ${noTokenResponse.status}`);
    console.log(`   Rechazado correctamente: ${noTokenResponse.status === 401 ? '✅' : '❌'}`);
    console.log(`   Mensaje: ${noTokenData.msg || 'N/A'}`);
    console.log('');

    // 5. Test login con credenciales incorrectas
    console.log('5️⃣  Test login con credenciales incorrectas...');
    const wrongLoginResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@edificio.com',
            password: 'password-incorrecto'
        })
    });

    const wrongLoginData = await wrongLoginResponse.json();
    console.log(`   Status: ${wrongLoginResponse.status}`);
    console.log(`   Rechazado correctamente: ${wrongLoginResponse.status === 401 ? '✅' : '❌'}`);
    console.log(`   Mensaje: ${wrongLoginData.msg || 'N/A'}`);
    console.log('');

    // 6. Test de otros endpoints protegidos
    console.log('6️⃣  Test de otros endpoints protegidos...');
    
    const endpoints = [
        { name: 'Cuotas', url: '/api/cuotas' },
        { name: 'Gastos', url: '/api/gastos' },
        { name: 'Presupuestos', url: '/api/presupuestos' }
    ];

    for (const endpoint of endpoints) {
        const response = await fetch(`${API_URL}${endpoint.url}`, {
            headers: { 'x-auth-token': token }
        });
        const data = await response.json();
        console.log(`   ${endpoint.name}: ${response.status === 200 ? '✅' : '❌'} (${response.status})`);
    }
    console.log('');

    // Resumen
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 Resumen del Test');
    console.log('═══════════════════════════════════════════════════\n');
    
    const allPassed = 
        loginResponse.status === 200 &&
        usuariosResponse.status === 200 &&
        invalidResponse.status === 401 &&
        noTokenResponse.status === 401 &&
        wrongLoginResponse.status === 401;

    if (allPassed) {
        console.log('✅ Todos los tests pasaron correctamente');
        console.log('✅ Sistema de autenticación funcionando correctamente');
    } else {
        console.log('⚠️  Algunos tests fallaron, revisar logs arriba');
    }
    console.log('');
}

testLoginDetailed().catch(console.error);
