import bcrypt from 'bcryptjs';

const password = 'Gemelo1';
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);

console.log(hash);
