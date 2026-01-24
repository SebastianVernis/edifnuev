import { readData, writeData } from '../src/data.js';

const emailToPromote = process.argv[2];

if (!emailToPromote) {
    console.log('Uso: node scripts/admin/promote-super-admin.js <email>');
    process.exit(1);
}

const data = readData();
const user = data.usuarios.find(u => u.email === emailToPromote);

if (!user) {
    console.log(`Error: Usuario con email ${emailToPromote} no encontrado.`);
    process.exit(1);
}

user.rol = 'SUPERADMIN';
// Asegurar que tenga todos los permisos
user.permisos = {
    anuncios: true,
    gastos: true,
    presupuestos: true,
    cuotas: true,
    usuarios: true,
    cierres: true
};

if (writeData(data)) {
    console.log(`✅ Usuario ${emailToPromote} promovido a SUPERADMIN exitosamente.`);
} else {
    console.log('❌ Error al guardar los cambios.');
}
