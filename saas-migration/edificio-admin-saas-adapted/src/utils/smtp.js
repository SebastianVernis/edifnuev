/**
 * SMTP Utility para envío de emails
 * Cloudflare Workers compatible
 * Soporta múltiples proveedores SMTP
 */

import { getEmailTemplate } from './emailTemplates.js';

/**
 * Configuración SMTP desde variables de entorno
 */
function getSmtpConfig(env) {
  return {
    host: env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(env.SMTP_PORT || '587'),
    secure: env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.SMTP_FROM || env.EMAIL_SENDER || 'noreply@edificio-admin.com',
  };
}

/**
 * Enviar email usando SMTP
 * @param {Object} options - Opciones del email
 * @param {string} options.to - Destinatario
 * @param {string} options.subject - Asunto
 * @param {string} options.html - Contenido HTML
 * @param {string} options.text - Contenido texto plano (opcional)
 * @param {Object} env - Environment variables
 * @returns {Promise<Object>} {ok: boolean, msg: string}
 */
export async function sendEmail({ to, subject, html, text }, env) {
  try {
    const config = getSmtpConfig(env);
    
    // Validar configuración
    if (!config.user || !config.pass) {
      throw new Error('Configuración SMTP incompleta. Verifica SMTP_USER y SMTP_PASS');
    }
    
    // Validar destinatario
    if (!to || !to.includes('@')) {
      throw new Error('Email destinatario inválido');
    }
    
    // Construir el email en formato MIME
    const emailContent = buildMimeMessage({
      from: config.from,
      to,
      subject,
      html,
      text: text || stripHtml(html),
    });
    
    // Enviar usando fetch a API SMTP (MailChannels para Cloudflare Workers)
    // Alternativa: usar servicio externo como SendGrid, Mailgun, etc.
    const response = await sendViaMailChannels(emailContent, env);
    
    // Log del envío
    await logEmail(env.DB, {
      recipient: to,
      emailType: getEmailType(subject),
      subject,
      status: response.ok ? 'sent' : 'failed',
      errorMessage: response.ok ? null : response.error,
    });
    
    return response;
  } catch (error) {
    console.error('Error enviando email:', error);
    
    // Log del error
    if (env.DB) {
      await logEmail(env.DB, {
        recipient: to,
        emailType: 'unknown',
        subject: subject || 'Sin asunto',
        status: 'failed',
        errorMessage: error.message,
      });
    }
    
    return {
      ok: false,
      msg: 'Error al enviar email',
      error: error.message,
    };
  }
}

/**
 * Enviar email usando MailChannels (recomendado para Cloudflare Workers)
 * MailChannels es gratuito para Workers y no requiere configuración adicional
 */
async function sendViaMailChannels(emailContent, env) {
  try {
    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: emailContent.to }],
          },
        ],
        from: {
          email: emailContent.from,
          name: 'Edificio Admin',
        },
        subject: emailContent.subject,
        content: [
          {
            type: 'text/html',
            value: emailContent.html,
          },
          {
            type: 'text/plain',
            value: emailContent.text,
          },
        ],
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MailChannels error: ${error}`);
    }
    
    return { ok: true, msg: 'Email enviado correctamente' };
  } catch (error) {
    console.error('Error con MailChannels:', error);
    
    // Fallback: intentar con SMTP tradicional si está configurado
    return await sendViaSmtp(emailContent, env);
  }
}

/**
 * Enviar email usando SMTP tradicional (fallback)
 * Nota: Cloudflare Workers no soporta conexiones SMTP directas
 * Esta función usa un servicio proxy o API externa
 */
async function sendViaSmtp(emailContent, env) {
  const config = getSmtpConfig(env);
  
  // Si hay una API SMTP configurada (ej: SendGrid, Mailgun)
  if (env.SMTP_API_URL && env.SMTP_API_KEY) {
    try {
      const response = await fetch(env.SMTP_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.SMTP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: emailContent.from,
          to: emailContent.to,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`SMTP API error: ${response.statusText}`);
      }
      
      return { ok: true, msg: 'Email enviado correctamente' };
    } catch (error) {
      console.error('Error con SMTP API:', error);
      return {
        ok: false,
        msg: 'Error al enviar email',
        error: error.message,
      };
    }
  }
  
  // Si no hay configuración alternativa, retornar error
  return {
    ok: false,
    msg: 'No hay servicio SMTP configurado. Configura MailChannels o SMTP_API_URL',
  };
}

/**
 * Construir mensaje MIME
 */
function buildMimeMessage({ from, to, subject, html, text }) {
  return {
    from,
    to,
    subject,
    html,
    text,
  };
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
 * Determinar tipo de email por el asunto
 */
function getEmailType(subject) {
  const subjectLower = subject.toLowerCase();
  if (subjectLower.includes('código') || subjectLower.includes('otp') || subjectLower.includes('verificación')) {
    return 'otp';
  }
  if (subjectLower.includes('invitación') || subjectLower.includes('invitacion')) {
    return 'invitation';
  }
  if (subjectLower.includes('bienvenid')) {
    return 'welcome';
  }
  return 'notification';
}

/**
 * Registrar envío de email en base de datos
 */
async function logEmail(db, logData) {
  if (!db) return;
  
  try {
    await db.prepare(`
      INSERT INTO email_logs (recipient, email_type, subject, status, error_message, sent_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `)
    .bind(
      logData.recipient,
      logData.emailType,
      logData.subject,
      logData.status,
      logData.errorMessage
    )
    .run();
  } catch (error) {
    console.error('Error logging email:', error);
  }
}

/**
 * Enviar OTP por email
 * @param {string} email - Email destinatario
 * @param {string} code - Código OTP
 * @param {Object} env - Environment variables
 * @returns {Promise<Object>}
 */
export async function sendOtpEmail(email, code, env) {
  const html = getEmailTemplate('otp', { code, email });
  
  return await sendEmail({
    to: email,
    subject: 'Código de verificación - Edificio Admin',
    html,
  }, env);
}

/**
 * Enviar invitación por email
 * @param {Object} invitation - Datos de la invitación
 * @param {Object} env - Environment variables
 * @returns {Promise<Object>}
 */
export async function sendInvitationEmail(invitation, env) {
  const activationUrl = `${env.APP_URL || 'https://edificio-admin.com'}/activate?token=${invitation.token}`;
  
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
  }, env);
}

/**
 * Enviar email de bienvenida
 * @param {Object} user - Datos del usuario
 * @param {Object} env - Environment variables
 * @returns {Promise<Object>}
 */
export async function sendWelcomeEmail(user, env) {
  const html = getEmailTemplate('welcome', {
    name: user.name,
    buildingName: user.buildingName,
    dashboardUrl: `${env.APP_URL || 'https://edificio-admin.com'}/admin`,
  });
  
  return await sendEmail({
    to: user.email,
    subject: '¡Bienvenido a Edificio Admin!',
    html,
  }, env);
}

/**
 * Rate limiting para envío de emails
 * Previene spam y abuso
 */
export async function checkEmailRateLimit(email, env) {
  const key = `email_rate_limit:${email}`;
  const limit = 5; // 5 emails por hora
  const window = 3600; // 1 hora en segundos
  
  try {
    const current = await env.RATE_LIMIT.get(key);
    const count = current ? parseInt(current) : 0;
    
    if (count >= limit) {
      return {
        ok: false,
        msg: 'Límite de envío de emails alcanzado. Intenta más tarde.',
      };
    }
    
    // Incrementar contador
    await env.RATE_LIMIT.put(key, (count + 1).toString(), {
      expirationTtl: window,
    });
    
    return { ok: true };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // En caso de error, permitir el envío
    return { ok: true };
  }
}
