// tests/admin-deactivation.test.js
import request from 'supertest';
import assert from 'assert';
import app from '../src/app.js';
import { readData, writeData } from '../src/data.js';

async function runTest() {
  console.log('🧪 Starting Admin Deactivation Tests...');

  try {
    // 1. Get SuperAdmin Token (Virtual)
    const saEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@edificio205.com';
    const saPassword = process.env.SUPER_ADMIN_PASSWORD || 'SA_Secret_2025';
    
    console.log('Logging in as SuperAdmin...');
    const saLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: saEmail, password: saPassword });
    
    const saToken = saLoginResponse.body.token;
    assert(saToken, 'SuperAdmin login failed');
    console.log('✅ SuperAdmin logged in');

    // 2. Identify an admin to deactivate (id 1 is the main admin)
    const adminId = 1;
    const adminEmail = 'admin@edificio205.com';
    const adminPassword = 'Gemelo1';

    // Ensure admin is active first
    const data = readData();
    const adminIndex = data.usuarios.findIndex(u => u.id === adminId);
    data.usuarios[adminIndex].activo = true;
    writeData(data);
    console.log('Admin set to active for test setup');

    // 3. Verify Admin can log in
    console.log('Verifying Admin can log in...');
    const adminLogin1 = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: adminPassword });
    
    assert.strictEqual(adminLogin1.status, 200, 'Admin should be able to log in initially');
    const adminToken = adminLogin1.body.token;
    console.log('✅ Admin logged in successfully');

    // 4. Deactivate Admin via SuperAdmin
    console.log(`Deactivating Admin ID ${adminId}...`);
    const restrictResponse = await request(app)
      .put(`/api/super-admin/admins/${adminId}/restrict`)
      .set('Authorization', `Bearer ${saToken}`);
    
    assert.strictEqual(restrictResponse.status, 200, 'Deactivation should succeed');
    console.log('✅ Admin deactivated via API');

    // 5. Try to log in again as deactivated Admin
    console.log('Trying to log in as deactivated Admin...');
    const adminLogin2 = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: adminPassword });
    
    assert.strictEqual(adminLogin2.status, 403, 'Login should be forbidden for inactive user');
    assert(adminLogin2.body.msg.includes('desactivada'), 'Error message should mention deactivation');
    console.log('✅ Login rejected for inactive admin');

    // 6. Try to use existing token
    console.log('Trying to use existing token for deactivated admin...');
    const profileResponse = await request(app)
      .get('/api/auth/perfil')
      .set('Authorization', `Bearer ${adminToken}`);
    
    assert.strictEqual(profileResponse.status, 401, 'Existing token should be invalidated');
    assert(profileResponse.body.message.includes('invalidada'), 'Error message should mention invalidation');
    console.log('✅ Existing token rejected for inactive admin');

    // 7. Cleanup: Reactivate admin
    console.log('Cleaning up: Reactivating admin...');
    const dataFinal = readData();
    dataFinal.usuarios[adminIndex].activo = true;
    writeData(dataFinal);
    console.log('✅ Environment restored');

    console.log('\n🎉 ALL DEACTIVATION TESTS PASSED!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    if (error.response) {
        console.error('Response Status:', error.response.status);
        console.error('Response Body:', error.response.body);
    }
    // Restore admin state even if test fails
    try {
        const data = readData();
        const adminIndex = data.usuarios.findIndex(u => u.id === 1);
        if (adminIndex !== -1) {
            data.usuarios[adminIndex].activo = true;
            writeData(data);
        }
    } catch (e) {}
    process.exit(1);
  }
}

runTest();
