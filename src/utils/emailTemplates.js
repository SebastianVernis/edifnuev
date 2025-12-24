/**
 * Templates de email para el sistema
 */

const baseStyle = `
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f4f4f4;
    margin: 0;
    padding: 0;
  }
  .container {
    max-width: 600px;
    margin: 20px auto;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  .header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px 20px;
    text-align: center;
  }
  .header h1 {
    margin: 0;
    font-size: 28px;
  }
  .content {
    padding: 30px 20px;
  }
  .otp-code {
    background: #f8f9fa;
    border: 2px dashed #667eea;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    margin: 20px 0;
  }
  .otp-code .code {
    font-size: 36px;
    font-weight: bold;
    letter-spacing: 8px;
    color: #667eea;
    font-family: 'Courier New', monospace;
  }
  .button {
    display: inline-block;
    padding: 12px 30px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-decoration: none;
    border-radius: 5px;
    margin: 20px 0;
    font-weight: bold;
  }
  .footer {
    background: #f8f9fa;
    padding: 20px;
    text-align: center;
    font-size: 12px;
    color: #666;
  }
  .warning {
    background: #fff3cd;
    border-left: 4px solid #ffc107;
    padding: 12px;
    margin: 15px 0;
  }
  .info {
    background: #d1ecf1;
    border-left: 4px solid #0dcaf0;
    padding: 12px;
    margin: 15px 0;
  }
`;

/**
 * Template para código OTP
 */
function otpTemplate({ code, email }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Código de Verificación</title>
      <style>${baseStyle}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏢 Edificio Admin</h1>
        </div>
        <div class="content">
          <h2>Código de Verificación</h2>
          <p>Hola,</p>
          <p>Has solicitado un código de verificación para tu registro en Edificio Admin.</p>
          
          <div class="otp-code">
            <p style="margin: 0 0 10px 0; color: #666;">Tu código de verificación es:</p>
            <div class="code">${code}</div>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Válido por 10 minutos</p>
          </div>
          
          <div class="warning">
            <strong>⚠️ Importante:</strong> Este código es personal e intransferible. 
            No lo compartas con nadie. Si no solicitaste este código, ignora este mensaje.
          </div>
          
          <p>Si tienes problemas, contáctanos en soporte@edificio-admin.com</p>
        </div>
        <div class="footer">
          <p>Este correo fue enviado a ${email}</p>
          <p>&copy; 2025 Edificio Admin. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Template para invitación de usuario
 */
function invitationTemplate({ name, invitedBy, buildingName, role, activationUrl, expiresAt }) {
  const roleNames = {
    ADMIN: 'Administrador',
    COMITE: 'Comité',
    INQUILINO: 'Inquilino',
  };

  const expireDate = new Date(expiresAt).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitación a Edificio Admin</title>
      <style>${baseStyle}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏢 Edificio Admin</h1>
        </div>
        <div class="content">
          <h2>¡Has sido invitado!</h2>
          <p>Hola <strong>${name}</strong>,</p>
          <p><strong>${invitedBy}</strong> te ha invitado a unirte a <strong>${buildingName}</strong> en Edificio Admin.</p>
          
          <div class="info">
            <strong>📋 Detalles de la invitación:</strong><br>
            <strong>Edificio:</strong> ${buildingName}<br>
            <strong>Rol asignado:</strong> ${roleNames[role] || role}<br>
            <strong>Válida hasta:</strong> ${expireDate}
          </div>
          
          <p style="text-align: center;">
            <a href="${activationUrl}" class="button">Activar mi cuenta</a>
          </p>
          
          <p style="font-size: 14px; color: #666;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
            <a href="${activationUrl}" style="color: #667eea; word-break: break-all;">${activationUrl}</a>
          </p>
          
          <div class="warning">
            <strong>⚠️ Importante:</strong> Este enlace de activación expira el ${expireDate}. 
            Si no activas tu cuenta antes de esa fecha, necesitarás solicitar una nueva invitación.
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2025 Edificio Admin. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Template para email de bienvenida
 */
function welcomeTemplate({ name, buildingName, dashboardUrl }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenido a Edificio Admin</title>
      <style>${baseStyle}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏢 Edificio Admin</h1>
        </div>
        <div class="content">
          <h2>¡Bienvenido a Edificio Admin!</h2>
          <p>Hola <strong>${name}</strong>,</p>
          <p>¡Felicidades! Tu cuenta ha sido creada exitosamente y ya puedes comenzar a administrar <strong>${buildingName}</strong>.</p>
          
          <div class="info">
            <strong>🎉 Tu cuenta está lista</strong><br>
            Ya puedes acceder a tu panel de administración y comenzar a gestionar:
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Cuotas de mantenimiento</li>
              <li>Registro de gastos</li>
              <li>Fondos del edificio</li>
              <li>Usuarios y permisos</li>
              <li>Comunicados y anuncios</li>
            </ul>
          </div>
          
          <p style="text-align: center;">
            <a href="${dashboardUrl}" class="button">Ir a mi Dashboard</a>
          </p>
          
          <h3>📚 Primeros pasos</h3>
          <ol>
            <li><strong>Configura tu edificio:</strong> Establece las cuotas mensuales y datos básicos</li>
            <li><strong>Invita usuarios:</strong> Agrega a los residentes y miembros del comité</li>
            <li><strong>Registra gastos:</strong> Comienza a llevar el control de los gastos del edificio</li>
            <li><strong>Gestiona cuotas:</strong> Revisa los pagos y genera reportes</li>
          </ol>
          
          <p>Si tienes preguntas o necesitas ayuda, no dudes en contactarnos en soporte@edificio-admin.com</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Edificio Admin. Todos los derechos reservados.</p>
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
      throw new Error(`Template de email no encontrado: ${type}`);
  }
}
