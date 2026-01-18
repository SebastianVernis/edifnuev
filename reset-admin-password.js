import bcrypt from 'bcryptjs';
import { readData, writeData } from './src/data.js';

async function resetAdminPassword() {
  const data = readData();
  
  // Find admin user
  const adminIndex = data.usuarios.findIndex(u => u.email === 'admin@edificio205.com');
  
  if (adminIndex === -1) {
    console.log('❌ Admin user not found');
    return;
  }
  
  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Gemelo1', salt);
  
  // Update password
  data.usuarios[adminIndex].password = hashedPassword;
  
  // Save data
  writeData(data);
  
  console.log('✅ Admin password reset to: Gemelo1');
  console.log('Admin user:', data.usuarios[adminIndex].email);
  
  // Test the password
  const testResult = await bcrypt.compare('Gemelo1', hashedPassword);
  console.log('Password test:', testResult ? '✅ WORKS' : '❌ FAILED');
}

resetAdminPassword();
