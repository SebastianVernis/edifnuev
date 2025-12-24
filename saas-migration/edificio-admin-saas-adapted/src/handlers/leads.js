/**
 * Handler de Leads y Trial
 * Gestiona leads de ventas y validación de trials de 24 horas
 */

import { addCorsHeaders } from '../middleware/cors.js';
import { sendEmail } from '../utils/smtp.js';

/**
 * GET /api/leads - Listar todos los leads
 */
export async function getAll(request, env) {
  try {
    const result = await request.db.prepare(`
      SELECT * FROM pending_users 
      ORDER BY created_at DESC
    `).all();

    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      leads: result.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  } catch (error) {
    console.error('Error obteniendo leads:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false,
      msg: 'Error en el servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  }
}

/**
 * PUT /api/leads/:email/confirmar-pago - Confirmar pago de suscripción
 */
export async function confirmarPago(request, env) {
  try {
    const email = request.params.email;
    const data = await request.json();
    const { metodoPago, referencia } = data;

    // Obtener pending user
    const pendingUser = await request.db.prepare(
      'SELECT * FROM pending_users WHERE email = ?'
    ).bind(email).first();

    if (!pendingUser) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Lead no encontrado'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }

    // Actualizar como pagado
    await request.db.prepare(`
      UPDATE pending_users 
      SET pago_confirmado = 1,
          fecha_pago = ?,
          metodo_pago = ?,
          trial_active = 0,
          lead_status = 'pagado'
      WHERE email = ?
    `).bind(
      new Date().toISOString(),
      metodoPago || 'transferencia',
      email
    ).run();

    // Enviar confirmación al cliente
    await sendEmail({
      to: email,
      subject: '✅ Pago Confirmado - ChispartBuilding',
      html: `
        <h1>¡Pago Confirmado!</h1>
        <p>Hola ${pendingUser.full_name},</p>
        <p>Tu pago ha sido confirmado exitosamente.</p>
        <p><strong>Plan:</strong> ${pendingUser.selected_plan}</p>
        <p><strong>Método de pago:</strong> ${metodoPago}</p>
        <p>Tu cuenta ahora tiene acceso completo sin restricciones.</p>
        <p><a href="https://chispartbuilding.pages.dev/login.html">Iniciar Sesión</a></p>
      `
    }, env);

    console.log(`✅ Pago confirmado para ${email}`);

    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      msg: 'Pago confirmado exitosamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }), request);

  } catch (error) {
    console.error('Error confirmando pago:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false,
      msg: 'Error en el servidor',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  }
}

/**
 * Verificar trials expirados (ejecutado por cron)
 */
export async function verificarTrialsExpirados(db) {
  try {
    const ahora = new Date().toISOString();

    // Buscar trials expirados que no han pagado
    const expirados = await db.prepare(`
      SELECT * FROM pending_users 
      WHERE trial_active = 1 
      AND trial_expires < ? 
      AND pago_confirmado = 0
    `).bind(ahora).all();

    console.log(`🕒 Verificando trials: ${expirados.results?.length || 0} expirados`);

    for (const user of (expirados.results || [])) {
      // Marcar trial como inactivo
      await db.prepare(`
        UPDATE pending_users 
        SET trial_active = 0, lead_status = 'trial_expirado'
        WHERE email = ?
      `).bind(user.email).run();

      // Enviar email de recordatorio de pago
      await sendEmail({
        to: user.email,
        subject: '⏰ Trial Expirado - ChispartBuilding',
        html: `
          <h1>Tu periodo de prueba ha expirado</h1>
          <p>Hola ${user.full_name},</p>
          <p>Tu periodo de prueba de 24 horas ha finalizado.</p>
          <p>Para continuar usando ChispartBuilding, por favor confirma tu suscripción anual.</p>
          <p><strong>Plan seleccionado:</strong> ${user.selected_plan}</p>
          <p>Nuestro equipo de ventas se pondrá en contacto contigo.</p>
        `
      });

      console.log(`📧 Email de expiración enviado a ${user.email}`);
    }

    return {
      ok: true,
      trialsExpirados: expirados.results?.length || 0
    };

  } catch (error) {
    console.error('Error verificando trials:', error);
    return { ok: false, error: error.message };
  }
}
