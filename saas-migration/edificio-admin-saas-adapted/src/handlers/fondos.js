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
    const stmt = request.db.prepare('SELECT * FROM fondos ORDER BY created_at DESC');
    const result = await stmt.all();
    
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
    const stmt = request.db.prepare('SELECT * FROM fondos WHERE id = ?');
    const item = await stmt.bind(id).first();
    
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

    const { user } = request;
    const data = await request.json();
    
    // Aquí va la lógica específica de creación
    // Por ahora retornamos success genérico
    
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      msg: 'Creado exitosamente (pendiente de implementación completa)'
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

    const { user } = request;
    const id = request.params.id;
    const data = await request.json();
    
    // Verificar que existe
    const check = await request.db.prepare('SELECT id FROM fondos WHERE id = ?').bind(id).first();
    if (!check) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'No encontrado'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    // Aquí va la lógica específica de actualización
    
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      msg: 'Actualizado exitosamente (pendiente de implementación completa)'
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

    const { user } = request;
    const id = request.params.id;
    
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
    
    await request.db.prepare('DELETE FROM fondos WHERE id = ?').bind(id).run();
    
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
