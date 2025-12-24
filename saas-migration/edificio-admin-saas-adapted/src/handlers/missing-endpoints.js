/**
 * Endpoints faltantes que llama el frontend
 * Stubs temporales para evitar 404
 */

import { addCorsHeaders } from '../middleware/cors.js';

// Cuotas
export async function cuotasGetStats(request, env) {
  try {
    const result = await request.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'PAGADA' THEN 1 ELSE 0 END) as pagadas,
        SUM(CASE WHEN estado = 'PENDIENTE' THEN 1 ELSE 0 END) as pendientes,
        SUM(monto) as totalMonto
      FROM cuotas
    `).first();
    
    return addCorsHeaders(new Response(JSON.stringify({ ok: true, stats: result }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    }), request);
  } catch (error) {
    return addCorsHeaders(new Response(JSON.stringify({ ok: false, msg: 'Error' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    }), request);
  }
}

export async function cuotasGetPendientes(request, env) {
  try {
    const result = await request.db.prepare(
      "SELECT * FROM cuotas WHERE estado IN ('PENDIENTE', 'VENCIDA') ORDER BY fecha_vencimiento"
    ).all();
    
    return addCorsHeaders(new Response(JSON.stringify({ ok: true, cuotas: result.results || [] }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    }), request);
  } catch (error) {
    return addCorsHeaders(new Response(JSON.stringify({ ok: false, msg: 'Error' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    }), request);
  }
}

export async function cuotasVerificarVencimientos(request, env) {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    await request.db.prepare("UPDATE cuotas SET estado = 'VENCIDA' WHERE estado = 'PENDIENTE' AND fecha_vencimiento < ?").bind(hoy).run();
    
    return addCorsHeaders(new Response(JSON.stringify({ ok: true, msg: 'Vencimientos actualizados' }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    }), request);
  } catch (error) {
    return addCorsHeaders(new Response(JSON.stringify({ ok: false, msg: 'Error' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    }), request);
  }
}

// Gastos
export async function gastosGetStats(request, env) {
  try {
    const result = await request.db.prepare('SELECT COUNT(*) as total, SUM(monto) as totalMonto FROM gastos').first();
    
    return addCorsHeaders(new Response(JSON.stringify({ ok: true, stats: result }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    }), request);
  } catch (error) {
    return addCorsHeaders(new Response(JSON.stringify({ ok: false, msg: 'Error' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    }), request);
  }
}

// Fondos
export async function fondosTransferir(request, env) {
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
    
    // SECURITY: Actualizar saldos con building_id en WHERE
    await request.db.prepare('UPDATE fondos SET saldo = saldo - ?, updated_at = ? WHERE id = ? AND building_id = ?').bind(montoNum, new Date().toISOString(), fondoOrigenId, buildingId).run();
    await request.db.prepare('UPDATE fondos SET saldo = saldo + ?, updated_at = ? WHERE id = ? AND building_id = ?').bind(montoNum, new Date().toISOString(), fondoDestinoId, buildingId).run();
    
    await request.db.prepare(`
      INSERT INTO fondos_movimientos (id, fondo_origen_id, fondo_destino_id, monto, concepto, building_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(crypto.randomUUID(), fondoOrigenId, fondoDestinoId, montoNum, concepto || 'Transferencia', buildingId, new Date().toISOString()).run();

    return addCorsHeaders(new Response(JSON.stringify({ ok: true, msg: 'Transferencia exitosa' }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    }), request);
  } catch (error) {
    return addCorsHeaders(new Response(JSON.stringify({ ok: false, msg: 'Error', error: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    }), request);
  }
}

export async function fondosGetPatrimonio(request, env) {
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
    
    return addCorsHeaders(new Response(JSON.stringify({ ok: true, patrimonioTotal: parseFloat(result?.total || 0) }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    }), request);
  } catch (error) {
    return addCorsHeaders(new Response(JSON.stringify({ ok: false, msg: 'Error' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    }), request);
  }
}

// Parcialidades
export async function parcialidadesGetPagos(request, env) {
  return addCorsHeaders(new Response(JSON.stringify({ ok: true, pagos: [] }), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  }), request);
}

export async function parcialidadesGetEstado(request, env) {
  return addCorsHeaders(new Response(JSON.stringify({ ok: true, estado: 'activo', parcialidades: 0 }), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  }), request);
}

export async function parcialidadesValidarPago(request, env) {
  return addCorsHeaders(new Response(JSON.stringify({ ok: true, msg: 'Validado' }), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  }), request);
}
