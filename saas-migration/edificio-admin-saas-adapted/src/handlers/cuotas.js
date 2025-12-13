/**
 * Cuotas handlers para Cloudflare Workers
 * Adaptado de cuotas.controller.js
 */
import { addCorsHeaders } from '../middleware/cors.js';

/**
 * GET /api/cuotas - Obtener todas las cuotas con filtros
 */
export async function getAll(request, env) {
  try {
    const url = new URL(request.url);
    const departamento = url.searchParams.get('departamento');
    const mes = url.searchParams.get('mes');
    const anio = url.searchParams.get('anio');
    const estado = url.searchParams.get('estado');
    
    let query = 'SELECT * FROM cuotas WHERE 1=1';
    const params = [];
    
    if (departamento) {
      query += ' AND departamento = ?';
      params.push(departamento);
    }
    if (mes) {
      query += ' AND mes = ?';
      params.push(parseInt(mes));
    }
    if (anio) {
      query += ' AND anio = ?';
      params.push(parseInt(anio));
    }
    if (estado) {
      query += ' AND estado = ?';
      params.push(estado);
    }
    
    query += ' ORDER BY anio DESC, mes DESC';
    
    const stmt = request.db.prepare(query);
    const result = await stmt.bind(...params).all();
    
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      cuotas: result.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  } catch (error) {
    console.error('Error obteniendo cuotas:', error);
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
 * GET /api/cuotas/departamento/:departamento - Obtener cuotas por departamento
 */
export async function getByDepartamento(request, env) {
  try {
    const departamento = request.params.departamento;
    
    const stmt = request.db.prepare(
      'SELECT * FROM cuotas WHERE departamento = ? ORDER BY anio DESC, mes DESC'
    );
    const result = await stmt.bind(departamento).all();
    
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      cuotas: result.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  } catch (error) {
    console.error('Error obteniendo cuotas por departamento:', error);
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
 * POST /api/cuotas - Crear nueva cuota o generar masivamente
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
    
    // Solo admin puede crear cuotas
    if (user.rol !== 'ADMIN') {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'No tiene permisos para crear cuotas'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    const data = await request.json();
    const { mes, anio, monto, departamento, fechaVencimiento } = data;
    
    // Validaciones
    if (!mes || !anio || !monto) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Faltan campos obligatorios: mes, anio, monto'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    // Si departamento es TODOS, generar para todos los departamentos
    if (departamento === 'TODOS') {
      // Verificar que no existan cuotas para este periodo
      const checkExist = await request.db.prepare(
        'SELECT COUNT(*) as count FROM cuotas WHERE mes = ? AND anio = ?'
      ).bind(parseInt(mes), parseInt(anio)).first();
      
      if (checkExist && checkExist.count > 0) {
        return addCorsHeaders(new Response(JSON.stringify({
          ok: false,
          msg: `Ya existen cuotas para ${mes}/${anio}`
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }), request);
      }
      
      // Obtener todos los usuarios inquilinos
      const inquilinos = await request.db.prepare(
        'SELECT DISTINCT departamento FROM usuarios WHERE rol = ? AND activo = 1'
      ).bind('INQUILINO').all();
      
      const cuotasGeneradas = [];
      
      // Generar cuota para cada departamento
      for (const inquilino of inquilinos.results) {
        const id = crypto.randomUUID();
        await request.db.prepare(`
          INSERT INTO cuotas (
            id, departamento, mes, anio, monto, estado, 
            fecha_vencimiento, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          id,
          inquilino.departamento,
          parseInt(mes),
          parseInt(anio),
          parseFloat(monto),
          'pendiente',
          fechaVencimiento || null,
          new Date().toISOString()
        ).run();
        
        cuotasGeneradas.push({
          id,
          departamento: inquilino.departamento,
          mes: parseInt(mes),
          anio: parseInt(anio),
          monto: parseFloat(monto)
        });
      }
      
      return addCorsHeaders(new Response(JSON.stringify({
        ok: true,
        cuotasGeneradas: cuotasGeneradas.length,
        cuotas: cuotasGeneradas
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    // Crear cuota individual
    if (!departamento) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Departamento es requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    // Verificar que no exista cuota para este departamento en este periodo
    const checkExist = await request.db.prepare(
      'SELECT id FROM cuotas WHERE departamento = ? AND mes = ? AND anio = ?'
    ).bind(departamento, parseInt(mes), parseInt(anio)).first();
    
    if (checkExist) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: `Ya existe una cuota para ${mes}/${anio} en el departamento ${departamento}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    const id = crypto.randomUUID();
    await request.db.prepare(`
      INSERT INTO cuotas (
        id, departamento, mes, anio, monto, estado, 
        fecha_vencimiento, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      departamento,
      parseInt(mes),
      parseInt(anio),
      parseFloat(monto),
      'pendiente',
      fechaVencimiento || null,
      new Date().toISOString()
    ).run();
    
    const cuota = await request.db.prepare(
      'SELECT * FROM cuotas WHERE id = ?'
    ).bind(id).first();
    
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      cuota
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  } catch (error) {
    console.error('Error creando cuota:', error);
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
 * PUT /api/cuotas/:id - Actualizar cuota
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
    
    // Verificar que existe
    const cuota = await request.db.prepare(
      'SELECT * FROM cuotas WHERE id = ?'
    ).bind(id).first();
    
    if (!cuota) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Cuota no encontrada'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    const data = await request.json();
    const { estado, fecha_pago, metodo_pago, referencia, monto } = data;
    
    const updates = [];
    const values = [];
    
    if (monto !== undefined && user.rol === 'ADMIN') {
      updates.push('monto = ?');
      values.push(parseFloat(monto));
    }
    if (estado !== undefined) {
      updates.push('estado = ?');
      values.push(estado);
      
      // Si se marca como pagada, registrar fecha de pago
      if (estado === 'pagado' || estado === 'PAGADO') {
        updates.push('fecha_pago = ?');
        values.push(fecha_pago || new Date().toISOString());
      }
    }
    if (metodo_pago !== undefined) {
      updates.push('metodo_pago = ?');
      values.push(metodo_pago);
    }
    if (referencia !== undefined) {
      updates.push('referencia = ?');
      values.push(referencia);
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
    values.push(id);
    
    await request.db.prepare(`
      UPDATE cuotas 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...values).run();
    
    // Si se marcó como pagada, registrar en fondos
    if (estado === 'pagado' || estado === 'PAGADO') {
      // Registrar ingreso en fondo operacional
      const fondoId = crypto.randomUUID();
      await request.db.prepare(`
        INSERT INTO fondos_movimientos (
          id, fondo_id, tipo, monto, descripcion, fecha, created_by, created_at
        ) VALUES (?, 
          (SELECT id FROM fondos WHERE tipo = 'dineroOperacional' LIMIT 1),
          'ingreso', ?, ?, ?, ?, ?
        )
      `).bind(
        fondoId,
        parseFloat(cuota.monto),
        `Pago de cuota ${cuota.mes}/${cuota.anio} - Depto ${cuota.departamento}`,
        new Date().toISOString(),
        user.id,
        new Date().toISOString()
      ).run();
      
      // Actualizar saldo del fondo
      await request.db.prepare(`
        UPDATE fondos 
        SET saldo_actual = saldo_actual + ?
        WHERE tipo = 'dineroOperacional'
      `).bind(parseFloat(cuota.monto)).run();
    }
    
    const cuotaActualizada = await request.db.prepare(
      'SELECT * FROM cuotas WHERE id = ?'
    ).bind(id).first();
    
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      cuota: cuotaActualizada
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  } catch (error) {
    console.error('Error actualizando cuota:', error);
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
 * DELETE /api/cuotas/:id - Eliminar cuota
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
        msg: 'No tiene permisos para eliminar cuotas'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    // Verificar que existe
    const cuota = await request.db.prepare(
      'SELECT * FROM cuotas WHERE id = ?'
    ).bind(id).first();
    
    if (!cuota) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Cuota no encontrada'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    // No permitir eliminar cuotas pagadas
    if (cuota.estado === 'pagado' || cuota.estado === 'PAGADO') {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'No se puede eliminar una cuota pagada'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    await request.db.prepare(
      'DELETE FROM cuotas WHERE id = ?'
    ).bind(id).run();
    
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      msg: 'Cuota eliminada exitosamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  } catch (error) {
    console.error('Error eliminando cuota:', error);
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
 * POST /api/cuotas/:id/pagar - Marcar cuota como pagada
 */
export async function pagar(request, env) {
  try {
    if (request.method !== 'POST') {
      return new Response('Método no permitido', { 
        status: 405,
        headers: { 'Allow': 'POST' }
      });
    }

    const { user } = request;
    const id = request.params.id;
    
    const data = await request.json();
    const { metodo_pago, referencia } = data;
    
    // Verificar que existe
    const cuota = await request.db.prepare(
      'SELECT * FROM cuotas WHERE id = ?'
    ).bind(id).first();
    
    if (!cuota) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Cuota no encontrada'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    // Verificar que no esté ya pagada
    if (cuota.estado === 'pagado' || cuota.estado === 'PAGADO') {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'La cuota ya está pagada'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    const fechaPago = new Date().toISOString();
    
    // Actualizar cuota
    await request.db.prepare(`
      UPDATE cuotas 
      SET estado = 'pagado', 
          fecha_pago = ?, 
          metodo_pago = ?,
          referencia = ?,
          updated_at = ?
      WHERE id = ?
    `).bind(fechaPago, metodo_pago || null, referencia || null, fechaPago, id).run();
    
    // Registrar ingreso en fondo operacional
    const movimientoId = crypto.randomUUID();
    await request.db.prepare(`
      INSERT INTO fondos_movimientos (
        id, fondo_id, tipo, monto, descripcion, fecha, created_by, created_at
      ) VALUES (?, 
        (SELECT id FROM fondos WHERE tipo = 'dineroOperacional' LIMIT 1),
        'ingreso', ?, ?, ?, ?, ?
      )
    `).bind(
      movimientoId,
      parseFloat(cuota.monto),
      `Pago de cuota ${cuota.mes}/${cuota.anio} - Depto ${cuota.departamento}`,
      fechaPago,
      user.id,
      fechaPago
    ).run();
    
    // Actualizar saldo del fondo
    await request.db.prepare(`
      UPDATE fondos 
      SET saldo_actual = saldo_actual + ?
      WHERE tipo = 'dineroOperacional'
    `).bind(parseFloat(cuota.monto)).run();
    
    const cuotaActualizada = await request.db.prepare(
      'SELECT * FROM cuotas WHERE id = ?'
    ).bind(id).first();
    
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      cuota: cuotaActualizada,
      msg: 'Pago registrado exitosamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  } catch (error) {
    console.error('Error registrando pago:', error);
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
