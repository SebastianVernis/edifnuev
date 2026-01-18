import bcrypt from 'bcryptjs';
import { readData, writeData } from './src/data.js';

async function resetDemoPasswords() {
  console.log('🔄 Reseteando contraseñas de usuarios demo...\n');
  
  const data = readData();
  
  // Contraseñas según las credenciales de prueba
  const passwords = {
    'admin@edificio205.com': 'Admin2025!',
    'comite@edificio205.com': 'Comite2025!',
    'maria.garcia@edificio205.com': 'Inquilino2025!',
    'carlos.lopez@edificio205.com': 'Inquilino2025!',
    'ana.martinez@edificio205.com': 'Inquilino2025!',
    'roberto.silva@edificio205.com': 'Inquilino2025!'
  };
  
  let updated = 0;
  let created = 0;
  
  for (const [email, password] of Object.entries(passwords)) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const usuario = data.usuarios.find(u => u.email === email);
    
    if (usuario) {
      usuario.password = hashedPassword;
      console.log(`✅ Password actualizado para: ${email}`);
      updated++;
    } else {
      // Crear usuario si no existe
      const newUser = {
        id: data.usuarios.length + 1,
        email,
        password: hashedPassword,
        activo: true,
        fechaCreacion: new Date().toISOString()
      };
      
      // Configurar según el tipo de usuario
      if (email.includes('admin')) {
        newUser.nombre = 'Administrador Principal';
        newUser.departamento = 'ADMIN';
        newUser.rol = 'ADMIN';
        newUser.telefono = '+52 55 1234 5678';
        newUser.estatus_validacion = 'validado';
        newUser.esEditor = true;
      } else if (email.includes('comite')) {
        newUser.nombre = 'Comité Edificio';
        newUser.departamento = 'COMITE';
        newUser.rol = 'COMITE';
        newUser.telefono = '+52 55 2345 6789';
        newUser.estatus_validacion = 'validado';
      } else {
        // Inquilinos
        const inquilinoData = {
          'maria.garcia@edificio205.com': { nombre: 'María García', depto: '101', tel: '+52 55 3456 7890' },
          'carlos.lopez@edificio205.com': { nombre: 'Carlos López', depto: '102', tel: '+52 55 4567 8901' },
          'ana.martinez@edificio205.com': { nombre: 'Ana Martínez', depto: '201', tel: '+52 55 5678 9012' },
          'roberto.silva@edificio205.com': { nombre: 'Roberto Silva', depto: '202', tel: '+52 55 6789 0123' }
        };
        
        const info = inquilinoData[email];
        newUser.nombre = info.nombre;
        newUser.departamento = info.depto;
        newUser.rol = 'INQUILINO';
        newUser.telefono = info.tel;
        newUser.legitimidad_entregada = email.includes('maria') || email.includes('ana');
        newUser.estatus_validacion = 'validado';
      }
      
      data.usuarios.push(newUser);
      console.log(`✅ Usuario creado: ${email}`);
      created++;
    }
  }
  
  writeData(data);
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`✅ Proceso completado:`);
  console.log(`   - ${updated} contraseñas actualizadas`);
  console.log(`   - ${created} usuarios creados`);
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Mostrar las credenciales
  console.log('📋 CREDENCIALES DE PRUEBA:\n');
  console.log('👤 ADMIN:');
  console.log('   Email: admin@edificio205.com');
  console.log('   Password: Admin2025!\n');
  
  console.log('👤 COMITÉ:');
  console.log('   Email: comite@edificio205.com');
  console.log('   Password: Comite2025!\n');
  
  console.log('👤 INQUILINOS:');
  console.log('   Email: maria.garcia@edificio205.com');
  console.log('   Password: Inquilino2025!');
  console.log('   Email: carlos.lopez@edificio205.com');
  console.log('   Password: Inquilino2025!');
  console.log('   Email: ana.martinez@edificio205.com');
  console.log('   Password: Inquilino2025!');
  console.log('   Email: roberto.silva@edificio205.com');
  console.log('   Password: Inquilino2025!\n');
}

resetDemoPasswords().catch(console.error);
