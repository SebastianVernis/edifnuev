import bcrypt from 'bcryptjs';
import { readData } from './src/data.js';

const data = readData();
const admin = data.usuarios.find(u => u.email === 'admin@edificio205.com');

console.log('Admin user:', admin);
console.log('\nTesting password: Gemelo1');

const testPasswords = ['Gemelo1', 'Admin2025!', 'admin', 'Admin123'];

for (const pwd of testPasswords) {
  const result = await bcrypt.compare(pwd, admin.password);
  console.log(`Password "${pwd}": ${result ? '✅ MATCH' : '❌ NO MATCH'}`);
}
