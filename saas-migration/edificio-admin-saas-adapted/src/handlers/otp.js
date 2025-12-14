/**
 * OTP Handler - Generación y validación de códigos OTP
 * Sistema de onboarding Edificio Admin
 */

import { addCorsHeaders } from '../middleware/cors.js';
import { sendOtpEmail, checkEmailRateLimit } from '../utils/smtp.js';

/**
 * Generar código OTP de 6 dígitos
 * @returns {string}
 */
function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Enviar código OTP
 * POST /api/otp/send
 * @param {Request} request
 * @param {Object} env
 * @returns {Promise<Response>}
 */
export async function sendOtp(request, env) {
  try {
    if (request.method !== 'POST') {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Método no permitido'
      }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }

    const data = await request.json();
    const { email } = data;

    // Validar email
    if (!email || !email.includes('@')) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Email inválido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }

    // Verificar rate limiting
    const rateLimitCheck = await checkEmailRateLimit(email, env);
    if (!rateLimitCheck.ok) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: rateLimitCheck.msg
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }

    // Generar código OTP
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Guardar en KV storage
    const otpKey = `otp:${email}`;
    const otpData = {
      code,
      email,
      attempts: 0,
      maxAttempts: 5,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    };

    await env.OTP_CODES.put(otpKey, JSON.stringify(otpData), {
      expirationTtl: 600, // 10 minutos
    });

    // Guardar también en base de datos (backup y auditoría)
    try {
      await request.db.prepare(`
        INSERT INTO otp_codes (email, code, attempts, max_attempts, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `)
      .bind(email, code, 0, 5, expiresAt.toISOString())
      .run();
    } catch (dbError) {
      console.error('Error guardando OTP en DB:', dbError);
      // Continuar aunque falle el backup en DB
    }

    // Enviar email con código OTP
    console.log(`📧 Enviando OTP a ${email} con código ${code}`);
    const emailResult = await sendOtpEmail(email, code, env);

    if (!emailResult.ok) {
      console.error(`❌ Error enviando OTP: ${emailResult.error || emailResult.msg}`);
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Error al enviar el código. Intenta nuevamente.',
        error: env.ENVIRONMENT === 'development' ? emailResult.error : undefined
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }
    
    console.log(`✅ OTP enviado exitosamente a ${email}`);

    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      msg: 'Código OTP enviado correctamente',
      expiresAt: expiresAt.toISOString(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }), request);

  } catch (error) {
    console.error('Error en sendOtp:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false,
      msg: 'Error interno del servidor',
      error: env.ENVIRONMENT === 'development' ? error.message : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  }
}

/**
 * Verificar código OTP
 * POST /api/otp/verify
 * @param {Request} request
 * @param {Object} env
 * @returns {Promise<Response>}
 */
export async function verifyOtp(request, env) {
  try {
    if (request.method !== 'POST') {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Método no permitido'
      }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }

    const data = await request.json();
    const { email, code } = data;

    // Validar datos
    if (!email || !code) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Email y código son requeridos'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }

    // Validar formato de código (6 dígitos)
    if (!/^\d{6}$/.test(code)) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Código inválido. Debe ser de 6 dígitos'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }

    // Obtener OTP de KV storage
    const otpKey = `otp:${email}`;
    const otpDataStr = await env.OTP_CODES.get(otpKey);

    if (!otpDataStr) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Código expirado o no encontrado. Solicita uno nuevo.'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }

    const otpData = JSON.parse(otpDataStr);

    // Verificar si ya se alcanzó el máximo de intentos
    if (otpData.attempts >= otpData.maxAttempts) {
      // Eliminar OTP
      await env.OTP_CODES.delete(otpKey);

      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Máximo de intentos alcanzado. Solicita un nuevo código.'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }

    // Verificar si el código es correcto
    if (otpData.code !== code) {
      // Incrementar intentos
      otpData.attempts += 1;
      await env.OTP_CODES.put(otpKey, JSON.stringify(otpData), {
        expirationTtl: Math.floor((new Date(otpData.expiresAt) - Date.now()) / 1000),
      });

      const remainingAttempts = otpData.maxAttempts - otpData.attempts;

      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: `Código incorrecto. Te quedan ${remainingAttempts} intentos.`,
        remainingAttempts,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }

    // Código correcto - eliminar de KV
    await env.OTP_CODES.delete(otpKey);

    // Actualizar en base de datos
    try {
      await request.db.prepare(`
        UPDATE otp_codes 
        SET verified = 1, verified_at = datetime('now')
        WHERE email = ? AND code = ? AND verified = 0
      `)
      .bind(email, code)
      .run();
    } catch (dbError) {
      console.error('Error actualizando OTP en DB:', dbError);
    }

    // Actualizar pending_user si existe
    try {
      await request.db.prepare(`
        UPDATE pending_users 
        SET otp_verified = 1, verified_at = datetime('now')
        WHERE email = ?
      `)
      .bind(email)
      .run();
    } catch (dbError) {
      console.error('Error actualizando pending_user:', dbError);
    }

    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      msg: 'Código verificado correctamente',
      verified: true,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }), request);

  } catch (error) {
    console.error('Error en verifyOtp:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false,
      msg: 'Error interno del servidor',
      error: env.ENVIRONMENT === 'development' ? error.message : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  }
}

/**
 * Reenviar código OTP
 * POST /api/otp/resend
 * @param {Request} request
 * @param {Object} env
 * @returns {Promise<Response>}
 */
export async function resendOtp(request, env) {
  try {
    if (request.method !== 'POST') {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Método no permitido'
      }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }

    const data = await request.json();
    const { email } = data;

    // Validar email
    if (!email || !email.includes('@')) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Email inválido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }

    // Eliminar OTP anterior si existe
    const otpKey = `otp:${email}`;
    await env.OTP_CODES.delete(otpKey);

    // Reutilizar la función sendOtp
    return await sendOtp(request, env);

  } catch (error) {
    console.error('Error en resendOtp:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false,
      msg: 'Error interno del servidor',
      error: env.ENVIRONMENT === 'development' ? error.message : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  }
}

/**
 * Verificar estado de OTP (sin consumirlo)
 * GET /api/otp/status/:email
 * @param {Request} request
 * @param {Object} env
 * @returns {Promise<Response>}
 */
export async function getOtpStatus(request, env) {
  try {
    if (request.method !== 'GET') {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Método no permitido'
      }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }

    const url = new URL(request.url);
    const email = url.pathname.split('/').pop();

    if (!email || !email.includes('@')) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Email inválido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }

    // Obtener OTP de KV storage
    const otpKey = `otp:${email}`;
    const otpDataStr = await env.OTP_CODES.get(otpKey);

    if (!otpDataStr) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: true,
        exists: false,
        msg: 'No hay código OTP activo'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }

    const otpData = JSON.parse(otpDataStr);
    const now = new Date();
    const expiresAt = new Date(otpData.expiresAt);
    const isExpired = now > expiresAt;

    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      exists: true,
      expired: isExpired,
      expiresAt: otpData.expiresAt,
      attempts: otpData.attempts,
      maxAttempts: otpData.maxAttempts,
      remainingAttempts: otpData.maxAttempts - otpData.attempts,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }), request);

  } catch (error) {
    console.error('Error en getOtpStatus:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false,
      msg: 'Error interno del servidor',
      error: env.ENVIRONMENT === 'development' ? error.message : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  }
}
