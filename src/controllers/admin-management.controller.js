import { handleControllerError } from '../middleware/error-handler.js';
import { readData, writeData } from '../data.js';

// GET /api/admins - Obtener todos los administradores
export const getAdmins = async (req, res) => {
  try {
    const data = readData();
    
    // Filtrar solo usuarios con rol ADMIN o SUPERADMIN
    const admins = data.usuarios.filter(usuario => 
      usuario.rol === 'ADMIN' || usuario.rol === 'SUPERADMIN'
    ).map(usuario => ({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      edificioId: usuario.buildingId || null,
      edificioNombre: usuario.buildingId ? getBuildingName(usuario.buildingId, data) : 'No asignado',
      rol: usuario.rol,
      estado: usuario.activo ? 'activo' : 'inactivo',
      fechaCreacion: usuario.fechaCreacion,
      telefono: usuario.telefono || null,
      notas: usuario.notas || null
    }));

    res.json({ ok: true, admins });
  } catch (error) {
    return handleControllerError(error, res, 'getAdmins');
  }
};

// GET /api/admins/:id - Obtener un administrador por ID
export const getAdminById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = readData();
    
    const usuario = data.usuarios.find(u => u.id === id);
    
    if (!usuario || (usuario.rol !== 'ADMIN' && usuario.rol !== 'SUPERADMIN')) {
      return res.status(404).json({
        ok: false,
        msg: 'Administrador no encontrado'
      });
    }

    const admin = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      edificioId: usuario.buildingId || null,
      edificioNombre: usuario.buildingId ? getBuildingName(usuario.buildingId, data) : 'No asignado',
      rol: usuario.rol,
      estado: usuario.activo ? 'activo' : 'inactivo',
      fechaCreacion: usuario.fechaCreacion,
      telefono: usuario.telefono || null,
      notas: usuario.notas || null
    };

    res.json({ ok: true, admin });
  } catch (error) {
    return handleControllerError(error, res, 'getAdminById');
  }
};

// POST /api/admins - Crear un nuevo administrador
export const createAdmin = async (req, res) => {
  try {
    const { nombre, email, password, edificioId, rol, telefono, notas } = req.body;

    // Validar campos requeridos
    if (!nombre || !email || !password || !edificioId || !rol) {
      return res.status(400).json({
        ok: false,
        msg: 'Faltan campos requeridos: nombre, email, password, edificioId, rol'
      });
    }

    // Validar rol
    if (!['ADMIN', 'SUPERADMIN'].includes(rol)) {
      return res.status(400).json({
        ok: false,
        msg: 'Rol inválido. Use ADMIN o SUPERADMIN'
      });
    }

    const { readData, writeData } = await import('../data.js');
    const data = readData();

    // Validar que el email no exista
    if (data.usuarios.find(u => u.email === email)) {
      return res.status(400).json({
        ok: false,
        msg: 'Ya existe un usuario con este email'
      });
    }

    // Importar bcrypt para hash de contraseña
    const bcrypt = await import('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generar nuevo ID
    const newId = data.usuarios.length > 0
      ? Math.max(...data.usuarios.map(u => u.id)) + 1
      : 1;

    const nuevoAdmin = {
      id: newId,
      nombre,
      email,
      password: hashedPassword,
      rol,
      departamento: 'Admin', // Departamento especial para admins
      buildingId: edificioId,
      telefono: telefono || null,
      notas: notas || null,
      fechaCreacion: new Date().toISOString(),
      activo: true
    };

    data.usuarios.push(nuevoAdmin);
    writeData(data);

    // Excluir contraseña en la respuesta
    const { password: _, ...adminSinPassword } = nuevoAdmin;
    
    res.status(201).json({
      ok: true,
      msg: 'Administrador creado exitosamente',
      admin: adminSinPassword
    });
  } catch (error) {
    return handleControllerError(error, res, 'createAdmin');
  }
};

// PUT /api/admins/:id - Actualizar un administrador
export const updateAdmin = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, email, password, edificioId, rol, estado, telefono, notas } = req.body;

    const { readData, writeData } = await import('../data.js');
    const data = readData();

    const usuario = data.usuarios.find(u => u.id === id);

    if (!usuario || (usuario.rol !== 'ADMIN' && usuario.rol !== 'SUPERADMIN')) {
      return res.status(404).json({
        ok: false,
        msg: 'Administrador no encontrado'
      });
    }

    // Validar rol si se está actualizando
    if (rol && !['ADMIN', 'SUPERADMIN'].includes(rol)) {
      return res.status(400).json({
        ok: false,
        msg: 'Rol inválido. Use ADMIN o SUPERADMIN'
      });
    }

    // Validar que el email no esté en uso por otro usuario
    if (email && data.usuarios.find(u => u.email === email && u.id !== id)) {
      return res.status(400).json({
        ok: false,
        msg: 'Ya existe un usuario con este email'
      });
    }

    // Actualizar campos
    if (nombre) usuario.nombre = nombre;
    if (email) usuario.email = email;
    if (rol) usuario.rol = rol;
    if (edificioId) usuario.buildingId = edificioId;
    if (telefono !== undefined) usuario.telefono = telefono;
    if (notas !== undefined) usuario.notas = notas;
    if (estado !== undefined) usuario.activo = estado === 'activo';

    // Actualizar contraseña si se proporciona
    if (password) {
      const bcrypt = await import('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      usuario.password = await bcrypt.hash(password, salt);
    }

    writeData(data);

    // Excluir contraseña en la respuesta
    const { password: _, ...adminSinPassword } = usuario;
    
    res.json({
      ok: true,
      msg: 'Administrador actualizado exitosamente',
      admin: adminSinPassword
    });
  } catch (error) {
    return handleControllerError(error, res, 'updateAdmin');
  }
};

// DELETE /api/admins/:id - Eliminar un administrador
export const deleteAdmin = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { readData, writeData } = await import('../data.js');
    const data = readData();

    const usuarioIndex = data.usuarios.findIndex(u => 
      u.id === id && (u.rol === 'ADMIN' || u.rol === 'SUPERADMIN')
    );

    if (usuarioIndex === -1) {
      return res.status(404).json({
        ok: false,
        msg: 'Administrador no encontrado'
      });
    }

    // No permitir eliminar al admin principal (id = 1)
    if (id === 1) {
      return res.status(400).json({
        ok: false,
        msg: 'No se puede eliminar el administrador principal'
      });
    }

    // Soft delete: marcar como inactivo
    data.usuarios[usuarioIndex].activo = false;
    data.usuarios[usuarioIndex].deletedAt = new Date().toISOString();
    data.usuarios[usuarioIndex].deletedBy = req.usuario.id;

    writeData(data);

    res.json({
      ok: true,
      msg: 'Administrador desactivado exitosamente'
    });
  } catch (error) {
    return handleControllerError(error, res, 'deleteAdmin');
  }
};

// Función auxiliar para obtener el nombre del edificio
function getBuildingName(buildingId, data) {
  // En una implementación real, esto obtendría el nombre del edificio de la base de datos
  // Por ahora, devolvemos un nombre genérico basado en el ID
  const building = data.buildings ? data.buildings.find(b => b.id === buildingId) : null;
  return building ? building.nombre : `Edificio ${buildingId}`;
}