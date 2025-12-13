/**
 * Usuarios handlers para Cloudflare Workers
 * Adaptado de usuarios.controller.js
 */
import { addCorsHeaders } from '../middleware/cors.js';
import bcrypt from 'bcryptjs';

/**
 * GET /api/usuarios - Obtener todos los usuarios
 */
export async function getAll(request, env) {
  try {
    const { user } = request;
    
    // Verificar permisos (solo admin puede ver todos los usuarios)
    if (user.rol !== 'ADMIN' && user.rol !== 'COMITE') {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'No tiene permisos para ver los usuarios'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    // Obtener usuarios de la base de datos
    const stmt = request.db.prepare(`
      SELECT id, nombre, email, rol, departamento, telefono, 
             activo, legitimidad_entregada, estatus_validacion, 
             fechaCreacion, esEditor, rol_editor
      FROM usuarios 
      WHERE activo = 1
      ORDER BY fechaCreacion DESC
    `);
    
    const result = await stmt.all();
    
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      usuarios: result.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false,
      msg: 'Error en el servidor',
      error: env.ENVIRONMENT === 'development' ? error.message : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  }
}

/**
 * GET /api/usuarios/:id - Obtener usuario por ID
 */
export async function getById(request, env) {
  try {
    const { user } = request;
    const id = request.params.id;
    
    // Verificar permisos (usuario puede ver su propio perfil, admin puede ver todos)
    if (user.id !== id && user.rol !== 'ADMIN' && user.rol !== 'COMITE') {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'No tiene permisos para ver este usuario'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    const stmt = request.db.prepare(`
      SELECT id, nombre, email, rol, departamento, telefono, 
             activo, legitimidad_entregada, estatus_validacion, 
             fechaCreacion, esEditor, rol_editor
      FROM usuarios 
      WHERE id = ?
    `);
    
    const usuario = await stmt.bind(id).first();
    
    if (!usuario) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Usuario no encontrado'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      usuario
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false,
      msg: 'Error en el servidor',
      error: env.ENVIRONMENT === 'development' ? error.message : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  }
}

/**
 * POST /api/usuarios - Crear nuevo usuario
 */
export async function create(request, env) {
  try {
    if (request.method !== 'POST') {
      return new Response('Método no permitido', { 
        status: 405,
        headers: { 'Allow': 'POST' }
      });
    }

    const { user } = request;
    
    // Solo admin puede crear usuarios
    if (user.rol !== 'ADMIN') {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'No tiene permisos para crear usuarios'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    const data = await request.json();
    const { nombre, email, rol, departamento, telefono, password } = data;
    
    // Validaciones
    if (!nombre || !email || !rol || !departamento || !password) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Faltan campos obligatorios: nombre, email, rol, departamento, password'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    // Validar roles permitidos
    const rolesPermitidos = ['ADMIN', 'INQUILINO', 'COMITE'];
    if (!rolesPermitidos.includes(rol)) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Rol no válido. Roles permitidos: ADMIN, INQUILINO, COMITE'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    // Validar email único
    const checkEmail = await request.db.prepare(
      'SELECT id FROM usuarios WHERE email = ?'
    ).bind(email).first();
    
    if (checkEmail) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'El email ya está en uso'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    // Validar departamento único para inquilinos
    if (rol === 'INQUILINO') {
      const checkDepto = await request.db.prepare(
        'SELECT id FROM usuarios WHERE departamento = ? AND rol = ?'
      ).bind(departamento, 'INQUILINO').first();
      
      if (checkDepto) {
        return addCorsHeaders(new Response(JSON.stringify({
          ok: false,
          msg: 'El departamento ya está asignado'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }), request);
      }
      
      // Validar formato de departamento
      const deptoRegex = /^[1-5]0[1-4]$/;
      if (!deptoRegex.test(departamento)) {
        return addCorsHeaders(new Response(JSON.stringify({
          ok: false,
          msg: 'Departamento inválido. Formato esperado: 101-504 (piso + depto)'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }), request);
      }
    }
    
    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Crear usuario
    const id = crypto.randomUUID();
    const stmt = request.db.prepare(`
      INSERT INTO usuarios (
        id, nombre, email, password, rol, departamento, telefono,
        legitimidad_entregada, estatus_validacion, fechaCreacion, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    await stmt.bind(
      id,
      nombre,
      email,
      passwordHash,
      rol,
      departamento,
      telefono || null,
      0, // legitimidad_entregada
      'pendiente', // estatus_validacion
      new Date().toISOString(),
      1 // activo
    ).run();
    
    // Obtener el usuario creado
    const nuevoUsuario = await request.db.prepare(
      'SELECT id, nombre, email, rol, departamento, telefono, activo FROM usuarios WHERE id = ?'
    ).bind(id).first();
    
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      usuario: nuevoUsuario
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  } catch (error) {
    console.error('Error creando usuario:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false,
      msg: 'Error en el servidor',
      error: env.ENVIRONMENT === 'development' ? error.message : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  }
}

/**
 * PUT /api/usuarios/:id - Actualizar usuario
 */
export async function update(request, env) {
  try {
    if (request.method !== 'PUT') {
      return new Response('Método no permitido', { 
        status: 405,
        headers: { 'Allow': 'PUT' }
      });
    }

    const { user } = request;
    const id = request.params.id;
    
    // Verificar permisos
    if (user.id !== id && user.rol !== 'ADMIN') {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'No tiene permisos para actualizar este usuario'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    // Verificar que el usuario existe
    const usuarioExistente = await request.db.prepare(
      'SELECT * FROM usuarios WHERE id = ?'
    ).bind(id).first();
    
    if (!usuarioExistente) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Usuario no encontrado'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    const data = await request.json();
    const { nombre, email, rol, departamento, telefono, estatus_validacion, esEditor, password } = data;
    
    // Validar email único (excluyendo el usuario actual)
    if (email && email !== usuarioExistente.email) {
      const checkEmail = await request.db.prepare(
        'SELECT id FROM usuarios WHERE email = ? AND id != ?'
      ).bind(email, id).first();
      
      if (checkEmail) {
        return addCorsHeaders(new Response(JSON.stringify({
          ok: false,
          msg: 'El email ya está en uso'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }), request);
      }
    }
    
    // Validar departamento único para inquilinos
    if (rol === 'INQUILINO' && departamento && departamento !== usuarioExistente.departamento) {
      const checkDepto = await request.db.prepare(
        'SELECT id FROM usuarios WHERE departamento = ? AND rol = ? AND id != ?'
      ).bind(departamento, 'INQUILINO', id).first();
      
      if (checkDepto) {
        return addCorsHeaders(new Response(JSON.stringify({
          ok: false,
          msg: 'El departamento ya está asignado'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }), request);
      }
    }
    
    // Preparar campos a actualizar
    const updates = [];
    const values = [];
    
    if (nombre !== undefined) {
      updates.push('nombre = ?');
      values.push(nombre);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (rol !== undefined && user.rol === 'ADMIN') {
      updates.push('rol = ?');
      values.push(rol);
    }
    if (departamento !== undefined) {
      updates.push('departamento = ?');
      values.push(departamento);
    }
    if (telefono !== undefined) {
      updates.push('telefono = ?');
      values.push(telefono);
    }
    if (estatus_validacion !== undefined && user.rol === 'ADMIN') {
      updates.push('estatus_validacion = ?');
      values.push(estatus_validacion);
    }
    if (esEditor !== undefined && user.rol === 'ADMIN') {
      updates.push('esEditor = ?');
      values.push(esEditor ? 1 : 0);
    }
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      values.push(passwordHash);
    }
    
    if (updates.length === 0) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'No hay campos para actualizar'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    values.push(id);
    
    await request.db.prepare(`
      UPDATE usuarios 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...values).run();
    
    // Obtener usuario actualizado
    const usuarioActualizado = await request.db.prepare(
      'SELECT id, nombre, email, rol, departamento, telefono, activo, esEditor FROM usuarios WHERE id = ?'
    ).bind(id).first();
    
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      usuario: usuarioActualizado
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false,
      msg: 'Error en el servidor',
      error: env.ENVIRONMENT === 'development' ? error.message : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  }
}

/**
 * DELETE /api/usuarios/:id - Eliminar usuario
 */
export async function remove(request, env) {
  try {
    if (request.method !== 'DELETE') {
      return new Response('Método no permitido', { 
        status: 405,
        headers: { 'Allow': 'DELETE' }
      });
    }

    const { user } = request;
    const id = request.params.id;
    
    // Solo admin puede eliminar
    if (user.rol !== 'ADMIN') {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'No tiene permisos para eliminar usuarios'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    // No permitir eliminar el propio usuario
    if (user.id === id) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'No puede eliminar su propio usuario'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    // Verificar que existe
    const usuario = await request.db.prepare(
      'SELECT id FROM usuarios WHERE id = ?'
    ).bind(id).first();
    
    if (!usuario) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Usuario no encontrado'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    // Soft delete (marcar como inactivo)
    await request.db.prepare(
      'UPDATE usuarios SET activo = 0 WHERE id = ?'
    ).bind(id).run();
    
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      msg: 'Usuario eliminado exitosamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false,
      msg: 'Error en el servidor',
      error: env.ENVIRONMENT === 'development' ? error.message : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  }
}
