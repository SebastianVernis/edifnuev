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
    const { email, cardNumber, customPrice } = data;
    
    // Modo testing: Permitir checkout sin OTP si SKIP_OTP_VALIDATION está habilitado
    const skipOtpValidation = env.SKIP_OTP_VALIDATION === 'true' || env.ENVIRONMENT === 'development';
    
    const pendingUser = await request.db.prepare(`
      SELECT * FROM pending_users WHERE email = ?${skipOtpValidation ? '' : ' AND otp_verified = 1'}
    `).bind(email).first();
    
    if (!pendingUser) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false, msg: skipOtpValidation ? 'Usuario no encontrado' : 'Debes verificar tu email primero'
      }), { status: 403, headers: { 'Content-Type': 'application/json' } }), request);
    }
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const plan = PLANS[pendingUser.selected_plan];
    
    // Si es plan personalizado, usar el precio enviado desde el frontend
    const amount = (pendingUser.selected_plan === 'personalizado' && customPrice) 
      ? customPrice 
      : plan.price;
    
    await request.db.prepare(`
      INSERT INTO mockup_payments (pending_user_id, plan, amount, card_last_four, transaction_id)
      VALUES (?, ?, ?, ?, ?)
    `).bind(pendingUser.id, pendingUser.selected_plan, amount, cardNumber.slice(-4), transactionId).run();
    await request.db.prepare(`UPDATE pending_users SET checkout_completed = 1 WHERE email = ?`).bind(email).run();
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true, msg: 'Pago procesado correctamente', data: { transactionId }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }), request);
  } catch (error) {
    console.error('Error en checkout:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false, msg: 'Error procesando el pago', error: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } }), request);
  }
}

export async function setupBuilding(request, env) {
  try {
    const data = await request.json();
    const { email, buildingData, adminPassword, adminData, smtpConfig, patrimonies } = data;
    
    // Modo testing: Permitir setup sin checkout si SKIP_OTP_VALIDATION está habilitado
    const skipValidation = env.SKIP_OTP_VALIDATION === 'true' || env.ENVIRONMENT === 'development';
    
    const pendingUser = await request.db.prepare(`
      SELECT * FROM pending_users WHERE email = ?${skipValidation ? '' : ' AND checkout_completed = 1'}
    `).bind(email).first();
    
    if (!pendingUser) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false, msg: 'Completa los pasos anteriores primero'
      }), { status: 403, headers: { 'Content-Type': 'application/json' } }), request);
    }
    
    // Crear edificio con todos los datos
    const buildingResult = await request.db.prepare(`
      INSERT INTO buildings (
        name, address, total_units, building_type, 
        monthly_fee, extraordinary_fee, cutoff_day,
        payment_due_days, late_fee_percent,
        setup_completed, setup_completed_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
    `).bind(
      buildingData.name,
      buildingData.address,
      buildingData.totalUnits,
      buildingData.type || 'edificio',
      buildingData.monthlyFee || 0,
      buildingData.extraordinaryFee || 0,
      buildingData.cutoffDay || 1,
      buildingData.paymentDueDays || 5,
      buildingData.lateFeePercent || 2.0
    ).run();
    
    const buildingId = buildingResult.meta.last_row_id;
    
    // Crear usuario administrador
    const adminName = adminData?.name || pendingUser.full_name;
    const adminPhone = adminData?.phone || pendingUser.phone;
    
    const userResult = await Usuario.create(request.db, {
      name: adminName,
      email: pendingUser.email,
      password: adminPassword,
      role: 'ADMIN',
      phone: adminPhone,
      building_id: buildingId,
    });
    
    // Crear fondos/patrimonios si se proporcionaron
    if (patrimonies && patrimonies.length > 0) {
      for (const patrimony of patrimonies) {
        try {
          await request.db.prepare(`
            INSERT INTO fondos (nombre, tipo, saldo, descripcion, building_id, created_at)
            VALUES (?, 'PATRIMONIO', ?, ?, ?, datetime('now'))
          `).bind(
            patrimony.name,
            patrimony.amount,
            'Fondo inicial del condominio',
            buildingId
          ).run();
        } catch (fondoError) {
          console.error('Error creando fondo:', fondoError);
        }
      }
    }
    
    // Marcar pending_user como completado
    await request.db.prepare(`
      UPDATE pending_users 
      SET setup_completed = 1, completed_at = datetime('now')
      WHERE email = ?
    `).bind(email).run();
    
    // Generar token
    const token = await generateToken({ id: userResult.id, rol: 'ADMIN' }, env);
    
    // Enviar email de bienvenida
    try {
      await sendWelcomeEmail({
        email: pendingUser.email,
        name: adminName,
        buildingName: buildingData.name
      }, env);
    } catch (emailError) {
      console.error('Error enviando email de bienvenida:', emailError);
      // No fallar si el email falla
    }
    
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      msg: 'Configuración completada',
      token,
      usuario: userResult
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }), request);
    
  } catch (error) {
    console.error('Error en setupBuilding:', error);
    console.error('Error stack:', error.stack);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false,
      msg: 'Error en la configuración: ' + error.message,
      error: error.message,
      stack: error.stack
    }), { status: 500, headers: { 'Content-Type': 'application/json' } }), request);
  }
}
