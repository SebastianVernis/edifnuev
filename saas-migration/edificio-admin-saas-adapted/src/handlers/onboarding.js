import { addCorsHeaders } from '../middleware/cors.js';
import { generateToken } from '../middleware/auth.js';
import { sendWelcomeEmail } from '../utils/smtp.js';
import Usuario from '../models/Usuario.js';

const PLANS = {
  basico: { name: 'Básico', price: 499, maxUnits: 20 },
  profesional: { name: 'Profesional', price: 999, maxUnits: 50 },
  empresarial: { name: 'Empresarial', price: 1999, maxUnits: 200 },
  personalizado: { name: 'Personalizado', price: 0, maxUnits: -1 },
};

export async function register(request, env) {
  try {
    const data = await request.json();
    const { email, fullName, phone, buildingName, selectedPlan } = data;
    if (!email || !email.includes('@')) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false, msg: 'Email inválido'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
    }
    const existingUser = await Usuario.getByEmail(request.db, email);
    if (existingUser) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false, msg: 'Este email ya está registrado'
      }), { status: 409, headers: { 'Content-Type': 'application/json' } }), request);
    }
    await request.db.prepare(`
      INSERT OR REPLACE INTO pending_users (email, full_name, phone, building_name, selected_plan)
      VALUES (?, ?, ?, ?, ?)
    `).bind(email, fullName, phone || null, buildingName, selectedPlan).run();
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true, msg: 'Registro iniciado correctamente'
    }), { status: 201, headers: { 'Content-Type': 'application/json' } }), request);
  } catch (error) {
    console.error('Error en register:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false, msg: 'Error interno del servidor'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } }), request);
  }
}

export async function checkout(request, env) {
  try {
    const data = await request.json();
    const { email, cardNumber } = data;
    const pendingUser = await request.db.prepare(`
      SELECT * FROM pending_users WHERE email = ? AND otp_verified = 1
    `).bind(email).first();
    if (!pendingUser) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false, msg: 'Debes verificar tu email primero'
      }), { status: 403, headers: { 'Content-Type': 'application/json' } }), request);
    }
    const transactionId = `TXN-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}`;
    const plan = PLANS[pendingUser.selected_plan];
    await request.db.prepare(`
      INSERT INTO mockup_payments (pending_user_id, plan, amount, card_last_four, transaction_id)
      VALUES (?, ?, ?, ?, ?)
    `).bind(pendingUser.id, pendingUser.selected_plan, plan.price, cardNumber.slice(-4), transactionId).run();
    await request.db.prepare(`UPDATE pending_users SET checkout_completed = 1 WHERE email = ?`).bind(email).run();
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true, msg: 'Pago procesado correctamente', data: { transactionId }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }), request);
  } catch (error) {
    console.error('Error en checkout:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false, msg: 'Error procesando el pago'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } }), request);
  }
}

export async function setupBuilding(request, env) {
  try {
    const data = await request.json();
    const { email, buildingData, adminPassword } = data;
    const pendingUser = await request.db.prepare(`
      SELECT * FROM pending_users WHERE email = ? AND checkout_completed = 1
    `).bind(email).first();
    if (!pendingUser) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false, msg: 'Completa los pasos anteriores primero'
      }), { status: 403, headers: { 'Content-Type': 'application/json' } }), request);
    }
    const buildingResult = await request.db.prepare(`
      INSERT INTO buildings (name, address, total_units, building_type, monthly_fee, cutoff_day, setup_completed)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).bind(
      buildingData.name, buildingData.address, buildingData.totalUnits,
      buildingData.type || 'edificio', buildingData.monthlyFee || 0, buildingData.cutoffDay || 1
    ).run();
    const buildingId = buildingResult.meta.last_row_id;
    const userResult = await Usuario.create(request.db, {
      name: pendingUser.full_name, email: pendingUser.email, password: adminPassword,
      role: 'ADMIN', phone: pendingUser.phone, building_id: buildingId,
    });
    await request.db.prepare(`UPDATE pending_users SET setup_completed = 1 WHERE email = ?`).bind(email).run();
    const token = await generateToken({ id: userResult.id, rol: 'ADMIN' }, env);
    await sendWelcomeEmail({ email: pendingUser.email, name: pendingUser.full_name, buildingName: buildingData.name }, env);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true, msg: 'Configuración completada', token, usuario: userResult
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }), request);
  } catch (error) {
    console.error('Error en setupBuilding:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false, msg: 'Error en la configuración'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } }), request);
  }
}
