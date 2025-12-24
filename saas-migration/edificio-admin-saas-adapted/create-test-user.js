import fetch from 'node-fetch';
import bcrypt from 'bcryptjs';

console.log('Creating test user password hash...\n');

const password = 'TestPass123!';
const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Hash:', hash);
console.log('\nUse wrangler to insert:');
console.log(`
wrangler d1 execute edificio_admin_db --remote --command="
UPDATE usuarios 
SET password = '${hash}' 
WHERE email = 'sebas@sebas.com'
"
`);
