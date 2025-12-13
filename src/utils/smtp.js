/**
 * SMTP Utility para envío de emails
 * Usa nodemailer para envío real de emails
 */

import nodemailer from 'nodemailer';
import { getEmailTemplate } from './emailTemplates.js';

/**
 * Configuración SMTP desde variables de entorno
 */
function getSmtpConfig() {
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true para 465, false para 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    from: process.env.SMTP_FROM || process.env.EMAIL_SENDER || 'noreply@edificio-admin.com',
  };
}

/**
 * Crear transportador de email
 */
let transporterCache = null;

async function getTransporter() {
  if (transporterCache) return transporterCache;

  const config = getSmtpConfig();
  
  // Validar configuración
  if (!config.auth.user || !config.auth.pass) {
    throw new Error('Configuración SMTP incompleta. Verifica SMTP_USER y SMTP_PASS en .env');
  }

  transporterCache = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  // Verificar conexión
  try {
    await transporterCache.verify();
    console.log('✅ SMTP configurado correctamente');
  } catch (error) {
    console.error('❌ Error verificando configuración SMTP:', error.message);
    transporterCache = null;
    throw error;
  }

  return transporterCache;
}

/**
 * Enviar email usando SMTP
 * @param {Object} options - Opciones del email
 * @param {string} options.to - Destinatario
 * @param {string} options.subject - Asunto
 * @param {string} options.html - Contenido HTML
 * @param {string} options.text - Contenido texto plano (opcional)
 * @returns {Promise<Object>} {ok: boolean, msg: string}
 */
export async function sendEmail({ to, subject, html, text }) {
  try {
    const config = getSmtpConfig();
    const transporter = await getTransporter();
    
    // Validar destinatario
    if (!to || !to.includes('@')) {
      throw new Error('Email destinatario inválido');
    }
    
    // Enviar email
    const info = await transporter.sendMail({
      from: `"Edificio Admin" <${config.from}>`,
      to,
      subject,
      html,
      text: text || stripHtml(html),
    });
    
    console.log('✅ Email enviado:', info.messageId);
    
    return {
      ok: true,
      msg: 'Email enviado correctamente',
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    
    return {
      ok: false,
      msg: 'Error al enviar email',
      error: error.message,
    };
  }
}

/**
 * Eliminar tags HTML para texto plano
 */
function stripHtml(html) {
  return html
    .replace(/<style[^>]*>.*<\/style>/gm, '')
    .replace(/<script[^>]*>.*<\/script>/gm, '')
    .replace(/<[^>]+>/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Enviar OTP por email
 * @param {string} email - Email destinatario
 * @param {string} code - Código OTP
 * @returns {Promise<Object>}
 */
export async function sendOtpEmail(email, code) {
  const html = getEmailTemplate('otp', { code, email });
  
  return await sendEmail({
    to: email,
    subject: 'Código de verificación - Edificio Admin',
    html,
  });
}

/**
 * Enviar invitación por email
 * @param {Object} invitation - Datos de la invitación
 * @returns {Promise<Object>}
 */
export async function sendInvitationEmail(invitation) {
  const activationUrl = `${process.env.APP_URL || 'http://localhost:3001'}/activate?token=${invitation.token}`;
  
  const html = getEmailTemplate('invitation', {
    name: invitation.name,
    invitedBy: invitation.invitedByName,
    buildingName: invitation.buildingName,
    role: invitation.role,
    activationUrl,
    expiresAt: invitation.expiresAt,
  });
  
  return await sendEmail({
    to: invitation.email,
    subject: `Invitación a Edificio Admin - ${invitation.buildingName}`,
    html,
  });
}

/**
 * Enviar email de bienvenida
 * @param {Object} user - Datos del usuario
 * @returns {Promise<Object>}
 */
export async function sendWelcomeEmail(user) {
  const html = getEmailTemplate('welcome', {
    name: user.name,
    buildingName: user.buildingName,
    dashboardUrl: `${process.env.APP_URL || 'http://localhost:3001'}/admin`,
  });
  
  return await sendEmail({
    to: user.email,
    subject: '¡Bienvenido a Edificio Admin!',
    html,
  });
}

/**
 * Rate limiting en memoria para envío de emails
 * Previene spam y abuso
 */
const rateLimitStore = new Map();

export function checkEmailRateLimit(email) {
  const key = `email_rate_limit:${email}`;
  const limit = 5; // 5 emails por hora
  const window = 3600000; // 1 hora en milisegundos
  
  try {
    const now = Date.now();
    const record = rateLimitStore.get(key);
    
    // Limpiar registros expirados
    if (record && now - record.firstRequest > window) {
      rateLimitStore.delete(key);
    }
    
    const current = rateLimitStore.get(key);
    
    if (!current) {
      rateLimitStore.set(key, {
        count: 1,
        firstRequest: now,
      });
      return { ok: true };
    }
    
    if (current.count >= limit) {
      return {
        ok: false,
        msg: 'Límite de envío de emails alcanzado. Intenta más tarde.',
      };
    }
    
    // Incrementar contador
    current.count += 1;
    rateLimitStore.set(key, current);
    
    return { ok: true };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // En caso de error, permitir el envío
    return { ok: true };
  }
}

// Limpiar rate limit store cada hora
setInterval(() => {
  const now = Date.now();
  const window = 3600000;
  
  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.firstRequest > window) {
      rateLimitStore.delete(key);
    }
  }
}, 3600000);
