/**
 * Fondos handlers para Cloudflare Workers
 * Adaptado de fondos.controller.js
 */
import { addCorsHeaders } from '../middleware/cors.js';

/**
 * GET /api/fondos - Obtener todos
 */
export async function getAll(request, env) {
  try {
    // SECURITY: Obtener building_id del usuario autenticado
    const buildingId = request.usuario?.building_id || request.user?.building_id;
    
    if (!buildingId) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Usuario sin edificio asignado'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    // SECURITY: Filtrar por building_id para aislamiento multitenancy
    const stmt = request.db.prepare('SELECT * FROM fondos WHERE building_id = ? ORDER BY created_at DESC');
    const result = await stmt.bind(buildingId).all();
    
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      fondos: result.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  } catch (error) {
    console.error('Error obteniendo fondos:', error);
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
 * GET /api/fondos/:id - Obtener por ID
 */
export async function getById(request, env) {
  try {
    const id = request.params.id;
    
    // SECURITY: Obtener building_id del usuario autenticado
    const buildingId = request.usuario?.building_id || request.user?.building_id;
    
    if (!buildingId) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Usuario sin edificio asignado'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    // SECURITY: Validar ownership - solo puede ver fondos de su building
    const stmt = request.db.prepare('SELECT * FROM fondos WHERE id = ? AND building_id = ?');
    const item = await stmt.bind(id, buildingId).first();
    
    if (!item) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'No encontrado'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      fondo: item
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  } catch (error) {
    console.error('Error obteniendo fondos:', error);
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
 * POST /api/fondos - Crear nuevo
 */
export async function create(request, env) {
  try {
    if (request.method !== 'POST') {
      return new Response('Método no permitido', { 
        status: 405,
        headers: { 'Allow': 'POST' }
      });
    }

    // SECURITY: Obtener building_id del usuario autenticado
    const buildingId = request.usuario?.building_id || request.user?.building_id;
    
    if (!buildingId) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Usuario sin edificio asignado'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }

    const data = await request.json();
    const { nombre, tipo, saldo_inicial, descripcion } = data;
    
    // Validaciones básicas
    if (!nombre || !tipo) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Faltan campos requeridos: nombre y tipo'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    const id = crypto.randomUUID();
    const saldo = parseFloat(saldo_inicial || 0);
    const now = new Date().toISOString();
    
    // SECURITY: Incluir building_id en INSERT para aislamiento multitenancy
    await request.db.prepare(`
      INSERT INTO fondos (id, nombre, tipo, saldo, descripcion, building_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, nombre, tipo, saldo, descripcion || null, buildingId, now, now).run();
    
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      msg: 'Fondo creado exitosamente',
      fondo: { id, nombre, tipo, saldo, descripcion, building_id: buildingId }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  } catch (error) {
    console.error('Error creando fondos:', error);
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
 * PUT /api/fondos/:id - Actualizar
 */
export async function update(request, env) {
  try {
    if (request.method !== 'PUT') {
      return new Response('Método no permitido', { 
        status: 405,
        headers: { 'Allow': 'PUT' }
      });
    }

    const id = request.params.id;
    
    // SECURITY: Obtener building_id del usuario autenticado
    const buildingId = request.usuario?.building_id || request.user?.building_id;
    
    if (!buildingId) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Usuario sin edificio asignado'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    // SECURITY: Validar ownership - verificar que el fondo pertenece al building del usuario
    const check = await request.db.prepare('SELECT id FROM fondos WHERE id = ? AND building_id = ?').bind(id, buildingId).first();
    if (!check) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'No encontrado o no tiene permisos'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    const data = await request.json();
    const { nombre, tipo, descripcion } = data;
    
    // Construir UPDATE dinámico
    const updates = [];
    const values = [];
    
    if (nombre !== undefined) {
      updates.push('nombre = ?');
      values.push(nombre);
    }
    if (tipo !== undefined) {
      updates.push('tipo = ?');
      values.push(tipo);
    }
    if (descripcion !== undefined) {
      updates.push('descripcion = ?');
      values.push(descripcion);
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
    
    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    
    // SECURITY: Incluir building_id en WHERE para garantizar aislamiento
    values.push(id, buildingId);
    
    await request.db.prepare(`
      UPDATE fondos SET ${updates.join(', ')} WHERE id = ? AND building_id = ?
    `).bind(...values).run();
    
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      msg: 'Fondo actualizado exitosamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  } catch (error) {
    console.error('Error actualizando fondos:', error);
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
 * DELETE /api/fondos/:id - Eliminar
 */
export async function remove(request, env) {
  try {
    if (request.method !== 'DELETE') {
      return new Response('Método no permitido', { 
        status: 405,
        headers: { 'Allow': 'DELETE' }
      });
    }

    const id = request.params.id;
    const user = request.usuario || request.user;
    
    // SECURITY: Obtener building_id del usuario autenticado
    const buildingId = user?.building_id;
    
    if (!buildingId) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Usuario sin edificio asignado'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    // Solo admin puede eliminar
    if (user.rol !== 'ADMIN') {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'No tiene permisos para eliminar'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    // SECURITY: Validar ownership antes de eliminar
    const check = await request.db.prepare('SELECT id FROM fondos WHERE id = ? AND building_id = ?').bind(id, buildingId).first();
    if (!check) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'No encontrado o no tiene permisos'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    // SECURITY: Incluir building_id en DELETE para garantizar aislamiento
    await request.db.prepare('DELETE FROM fondos WHERE id = ? AND building_id = ?').bind(id, buildingId).run();
    
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      msg: 'Eliminado exitosamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  } catch (error) {
    console.error('Error eliminando fondos:', error);
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
 * POST /api/fondos/transferir - Transferir entre fondos
 */
export async function transferir(request, env) {
  try {
    // SECURITY: Obtener building_id del usuario autenticado
    const buildingId = request.usuario?.building_id || request.user?.building_id;
    
    if (!buildingId) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Usuario sin edificio asignado'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    const data = await request.json();
    const { fondoOrigenId, fondoDestinoId, monto, concepto } = data;

    if (!fondoOrigenId || !fondoDestinoId || !monto) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Faltan datos requeridos'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
    }

    const montoNum = parseFloat(monto);
    
    // SECURITY: Validar que ambos fondos pertenecen al mismo building
    const origen = await request.db.prepare('SELECT * FROM fondos WHERE id = ? AND building_id = ?').bind(fondoOrigenId, buildingId).first();
    const destino = await request.db.prepare('SELECT * FROM fondos WHERE id = ? AND building_id = ?').bind(fondoDestinoId, buildingId).first();

    if (!origen || !destino) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Fondo no encontrado o no tiene permisos'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } }), request);
    }

    if (origen.saldo < montoNum) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Saldo insuficiente'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
    }

    // SECURITY: Actualizar saldos con building_id en WHERE para garantizar aislamiento
    await request.db.prepare('UPDATE fondos SET saldo = saldo - ?, updated_at = ? WHERE id = ? AND building_id = ?').bind(montoNum, new Date().toISOString(), fondoOrigenId, buildingId).run();
    await request.db.prepare('UPDATE fondos SET saldo = saldo + ?, updated_at = ? WHERE id = ? AND building_id = ?').bind(montoNum, new Date().toISOString(), fondoDestinoId, buildingId).run();

    // Registrar movimiento
    await request.db.prepare(`
      INSERT INTO fondos_movimientos (id, fondo_origen_id, fondo_destino_id, monto, concepto, building_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(crypto.randomUUID(), fondoOrigenId, fondoDestinoId, montoNum, concepto || 'Transferencia', buildingId, new Date().toISOString()).run();

    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      msg: 'Transferencia exitosa'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }), request);
  } catch (error) {
    console.error('Error en transferencia:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false,
      msg: 'Error en el servidor',
      error: env.ENVIRONMENT === 'development' ? error.message : undefined
    }), { status: 500, headers: { 'Content-Type': 'application/json' } }), request);
  }
}

/**
 * GET /api/fondos/patrimonio - Obtener patrimonio total
 */
export async function getPatrimonio(request, env) {
  try {
    // SECURITY: Obtener building_id del usuario autenticado
    const buildingId = request.usuario?.building_id || request.user?.building_id;
    
    if (!buildingId) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Usuario sin edificio asignado'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    // SECURITY: Filtrar por building_id para calcular solo patrimonio del building
    const result = await request.db.prepare('SELECT COALESCE(SUM(saldo), 0) as total FROM fondos WHERE building_id = ?').bind(buildingId).first();
    
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      patrimonioTotal: parseFloat(result?.total || 0)
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }), request);
  } catch (error) {
    console.error('Error obteniendo patrimonio:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false,
      msg: 'Error en el servidor'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } }), request);
  }
}
