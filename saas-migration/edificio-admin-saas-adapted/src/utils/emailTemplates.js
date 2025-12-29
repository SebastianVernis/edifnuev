/**
 * Templates HTML para emails
 * Sistema de onboarding Edificio Admin
 */

/**
 * Estilos base para todos los emails
 */
const baseStyles = `
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .email-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
    }
    .email-header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .email-body {
      padding: 40px 30px;
    }
    .email-body h2 {
      color: #667eea;
      font-size: 22px;
      margin-top: 0;
    }
    .email-body p {
      margin: 15px 0;
      font-size: 16px;
    }
    .otp-code {
      background-color: #f8f9fa;
      border: 2px dashed #667eea;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 30px 0;
    }
    .otp-code-number {
      font-size: 36px;
      font-weight: bold;
      color: #667eea;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
    }
    .btn {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .btn:hover {
      opacity: 0.9;
    }
    .info-box {
      background-color: #e7f3ff;
      border-left: 4px solid #2196F3;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning-box {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .email-footer {
      background-color: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      font-size: 14px;
      color: #6c757d;
    }
    .email-footer a {
      color: #667eea;
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background-color: #e9ecef;
      margin: 30px 0;
    }
  </style>
`;

/**
 * Template para código OTP
 */
function otpTemplate({ code, email }) {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Código de Verificación</title>
      ${baseStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>🏢 Edificio Admin</h1>
        </div>
        <div class="email-body">
          <h2>Código de Verificación</h2>
          <p>Hola,</p>
          <p>Has solicitado un código de verificación para completar tu registro en Edificio Admin.</p>
          
          <div class="otp-code">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #6c757d;">Tu código de verificación es:</p>
            <div class="otp-code-number">${code}</div>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #6c757d;">Este código expira en 10 minutos</p>
          </div>
          
          <div class="info-box">
            <p style="margin: 0;"><strong>📌 Importante:</strong></p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
              <li>No compartas este código con nadie</li>
              <li>Nuestro equipo nunca te pedirá este código</li>
              <li>Si no solicitaste este código, ignora este email</li>
            </ul>
          </div>
          
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          
          <p style="margin-top: 30px;">
            Saludos,<br>
            <strong>El equipo de Edificio Admin</strong>
          </p>
        </div>
        <div class="email-footer">
          <p>Este email fue enviado a <strong>${email}</strong></p>
          <p>© 2025 Edificio Admin. Todos los derechos reservados.</p>
          <p>
            <a href="#">Política de Privacidad</a> | 
            <a href="#">Términos de Servicio</a> | 
            <a href="#">Soporte</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Template para invitación
 */
function invitationTemplate({ name, invitedBy, buildingName, role, activationUrl, expiresAt }) {
  const roleNames = {
    ADMIN: 'Administrador',
    COMITE: 'Miembro del Comité',
    INQUILINO: 'Inquilino',
  };
  
  const roleName = roleNames[role] || role;
  const expiryDate = new Date(expiresAt).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitación a Edificio Admin</title>
      ${baseStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>🏢 Edificio Admin</h1>
        </div>
        <div class="email-body">
          <h2>¡Has sido invitado!</h2>
          <p>Hola <strong>${name}</strong>,</p>
          <p><strong>${invitedBy}</strong> te ha invitado a unirte a <strong>${buildingName}</strong> en Edificio Admin.</p>
          
          <div class="info-box">
            <p style="margin: 0;"><strong>📋 Detalles de la invitación:</strong></p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
              <li><strong>Edificio:</strong> ${buildingName}</li>
              <li><strong>Rol asignado:</strong> ${roleName}</li>
              <li><strong>Invitado por:</strong> ${invitedBy}</li>
            </ul>
          </div>
          
          <p>Para aceptar esta invitación y crear tu cuenta, haz clic en el siguiente botón:</p>
          
          <div style="text-align: center;">
            <a href="${activationUrl}" class="btn">Aceptar Invitación</a>
          </div>
          
          <p style="font-size: 14px; color: #6c757d;">
            O copia y pega este enlace en tu navegador:<br>
            <a href="${activationUrl}" style="color: #667eea; word-break: break-all;">${activationUrl}</a>
          </p>
          
          <div class="warning-box">
            <p style="margin: 0;"><strong>⚠️ Importante:</strong></p>
            <p style="margin: 10px 0 0 0;">Esta invitación expira el <strong>${expiryDate}</strong>. Asegúrate de aceptarla antes de esa fecha.</p>
          </div>
          
          <div class="divider"></div>
          
          <h3 style="color: #667eea; font-size: 18px;">¿Qué es Edificio Admin?</h3>
          <p>Edificio Admin es una plataforma completa para la gestión de edificios y condominios que te permite:</p>
          <ul>
            <li>💰 Gestionar cuotas y pagos</li>
            <li>📊 Controlar gastos y presupuestos</li>
            <li>📢 Publicar anuncios y comunicados</li>
            <li>📝 Gestionar solicitudes de mantenimiento</li>
            <li>👥 Administrar usuarios y permisos</li>
          </ul>
          
          <p style="margin-top: 30px;">
            Si tienes alguna pregunta, no dudes en contactarnos.<br><br>
            Saludos,<br>
            <strong>El equipo de Edificio Admin</strong>
          </p>
        </div>
        <div class="email-footer">
          <p>© 2025 Edificio Admin. Todos los derechos reservados.</p>
          <p>
            <a href="#">Política de Privacidad</a> | 
            <a href="#">Términos de Servicio</a> | 
            <a href="#">Soporte</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Template de bienvenida
 */
function welcomeTemplate({ name, buildingName, dashboardUrl }) {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>¡Bienvenido a Edificio Admin!</title>
      ${baseStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>🏢 Edificio Admin</h1>
        </div>
        <div class="email-body">
          <h2>¡Bienvenido a Edificio Admin!</h2>
          <p>Hola <strong>${name}</strong>,</p>
          <p>¡Felicitaciones! Has completado exitosamente el proceso de configuración de <strong>${buildingName}</strong> en Edificio Admin.</p>
          
          <div class="info-box">
            <p style="margin: 0;"><strong>✅ Tu cuenta está lista</strong></p>
            <p style="margin: 10px 0 0 0;">Ya puedes comenzar a gestionar tu edificio de manera eficiente y profesional.</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${dashboardUrl}" class="btn">Ir al Panel de Control</a>
          </div>
          
          <div class="divider"></div>
          
          <h3 style="color: #667eea; font-size: 18px;">🚀 Primeros pasos recomendados:</h3>
          <ol style="line-height: 2;">
            <li><strong>Invita a los residentes:</strong> Agrega a los inquilinos y miembros del comité</li>
            <li><strong>Configura las cuotas:</strong> Define las cuotas mensuales para cada departamento</li>
            <li><strong>Registra gastos:</strong> Comienza a llevar un control de los gastos del edificio</li>
            <li><strong>Publica anuncios:</strong> Mantén informados a todos los residentes</li>
          </ol>
          
          <div class="info-box">
            <p style="margin: 0;"><strong>💡 ¿Necesitas ayuda?</strong></p>
            <p style="margin: 10px 0 0 0;">
              Visita nuestro <a href="#" style="color: #667eea;">Centro de Ayuda</a> o 
              <a href="#" style="color: #667eea;">contáctanos</a> si tienes alguna pregunta.
            </p>
          </div>
          
          <p style="margin-top: 30px;">
            Estamos aquí para ayudarte a gestionar tu edificio de la mejor manera.<br><br>
            Saludos,<br>
            <strong>El equipo de Edificio Admin</strong>
          </p>
        </div>
        <div class="email-footer">
          <p>© 2025 Edificio Admin. Todos los derechos reservados.</p>
          <p>
            <a href="#">Política de Privacidad</a> | 
            <a href="#">Términos de Servicio</a> | 
            <a href="#">Soporte</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Obtener template por tipo
 * @param {string} type - Tipo de template (otp, invitation, welcome)
 * @param {Object} data - Datos para el template
 * @returns {string} HTML del email
 */
export function getEmailTemplate(type, data) {
  switch (type) {
    case 'otp':
      return otpTemplate(data);
    case 'invitation':
      return invitationTemplate(data);
    case 'welcome':
      return welcomeTemplate(data);
    default:
      throw new Error(`Template type '${type}' no encontrado`);
  }
}
