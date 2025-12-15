/**
 * Cron Handlers
 * Tareas programadas ejecutadas por Cloudflare Cron Triggers
 */

import { generarCierreAutomatico } from '../utils/cierreExporter.js';
import { sendEmail } from '../utils/smtp.js';
import { verificarTrialsExpirados } from './leads.js';

/**
 * Handler para cron trigger de fin de mes
 * Se ejecuta a las 00:00 del último día de cada mes
 * 
 * @param {ScheduledEvent} event
 * @param {Object} env
 */
export async function handleCronFinDeMes(event, env) {
  try {
    console.log('🕛 Ejecutando cierre automático de fin de mes...');
    console.log('⏰ Cron ejecutado:', new Date().toISOString());

    const hoy = new Date();
    const mes = hoy.getMonth() + 1;
    const anio = hoy.getFullYear();
    const ultimoDia = new Date(anio, mes, 0).getDate();

    // Verificar que sea último día del mes
    if (hoy.getDate() !== ultimoDia) {
      console.log(`⚠️ No es fin de mes. Hoy: ${hoy.getDate()}, Último día: ${ultimoDia}`);
      return;
    }

    // Generar cierres automáticos para todos los buildings
    const resultado = await generarCierreAutomatico(env.DB, env.UPLOADS, env);

    console.log(`✅ Cierres generados: ${resultado.total}`);

    // Enviar notificaciones por email a cada administrador
    if (resultado.cierres && resultado.cierres.length > 0) {
      await enviarNotificacionesCierres(env.DB, env, resultado.cierres);
    }

    console.log('🎉 Cierre automático completado exitosamente');

  } catch (error) {
    console.error('❌ Error en cron de fin de mes:', error);
    
    // Log del error para análisis
    await logCronError(env.DB, {
      cronType: 'fin_de_mes',
      error: error.message,
      stack: error.stack,
      executedAt: new Date().toISOString(),
    });
    
    throw error;
  }
}

/**
 * Enviar notificaciones de cierres generados
 */
async function enviarNotificacionesCierres(db, env, cierres) {
  try {
    for (const cierre of cierres) {
      // Obtener email del administrador del building
      const admin = await db.prepare(`
        SELECT u.email, u.nombre 
        FROM usuarios u
        JOIN buildings b ON u.building_id = b.id
        WHERE b.id = ? AND u.rol = 'ADMIN' AND u.activo = 1
        LIMIT 1
      `).bind(cierre.buildingId).first();

      if (!admin) {
        console.log(`⚠️ No se encontró admin para building: ${cierre.building}`);
        continue;
      }

      // Enviar email
      const emailResult = await sendEmail({
        to: admin.email,
        subject: `📊 Cierre Mensual Generado - ${cierre.cierre}`,
        html: generarEmailCierre(admin, cierre),
      }, env);

      if (emailResult.ok) {
        console.log(`✅ Email enviado a ${admin.email}`);
      } else {
        console.error(`❌ Error enviando email a ${admin.email}: ${emailResult.error}`);
      }
    }
  } catch (error) {
    console.error('Error enviando notificaciones:', error);
  }
}

/**
 * Template de email para notificación de cierre
 */
function generarEmailCierre(admin, cierre) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #F9FAFB; }
        .summary { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4F46E5; }
        .total { font-size: 1.5rem; font-weight: bold; color: #4F46E5; }
        .btn { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 8px; margin-top: 20px; }
        .footer { text-align: center; color: #6B7280; font-size: 0.875rem; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏢 ChispartBuilding</h1>
          <p>Cierre Mensual Generado</p>
        </div>
        
        <div class="content">
          <p>Hola <strong>${admin.nombre}</strong>,</p>
          
          <p>Se ha generado automáticamente el cierre mensual de <strong>${cierre.building}</strong>:</p>
          
          <div class="summary">
            <h3>📊 ${cierre.cierre}</h3>
            <p><strong>Total Ingresos:</strong> $${cierre.ingresos.toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
            <p><strong>Total Egresos:</strong> $${cierre.egresos.toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
            <p class="total">Saldo Final: $${cierre.saldo.toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
            
            ${cierre.comprobantes > 0 ? `
              <p style="color: #10B981; margin-top: 15px;">
                ✅ <strong>${cierre.comprobantes} comprobantes</strong> adjuntos en el reporte
              </p>
            ` : `
              <p style="color: #F59E0B; margin-top: 15px;">
                ⚠️ No hay comprobantes adjuntos
              </p>
            `}
          </div>
          
          <p>Puedes descargar el reporte completo y los comprobantes desde el panel de administración.</p>
          
          <a href="https://chispartbuilding.pages.dev/admin" class="btn">Ver Reporte Completo</a>
        </div>
        
        <div class="footer">
          <p>Este es un mensaje automático generado el último día del mes.</p>
          <p>&copy; ${new Date().getFullYear()} ChispartBuilding. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Log de errores de cron
 */
async function logCronError(db, errorData) {
  try {
    await db.prepare(`
      INSERT INTO audit_logs (
        id, accion, detalles, tipo, created_at
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      'CRON_ERROR',
      JSON.stringify(errorData),
      'ERROR',
      new Date().toISOString()
    ).run();
  } catch (error) {
    console.error('Error logging cron error:', error);
  }
}

/**
 * Handler para verificación diaria de trials
 */
export async function handleCronVerificarTrials(env) {
  try {
    console.log('🔍 Ejecutando verificación de trials expirados...');

    const resultado = await verificarTrialsExpirados(env.DB);

    console.log(`✅ Trials verificados: ${resultado.trialsExpirados} expirados`);

    return resultado;
  } catch (error) {
    console.error('Error verificando trials:', error);
    throw error;
  }
}

/**
 * Router principal de cron
 */
export async function handleCron(event, env, ctx) {
  const cron = event.cron || event.scheduledTime;
  
  console.log('🕒 Cron trigger ejecutado:', cron);

  try {
    // Ejecutar según tipo de cron
    if (cron === '0 0 L * *') {
      // Fin de mes: Cierres automáticos
      await handleCronFinDeMes(event, env);
    } else if (cron === '0 */6 * * *') {
      // Cada 6 horas: Verificar trials expirados
      await handleCronVerificarTrials(env);
    }
    
    console.log('✅ Cron completado exitosamente');
  } catch (error) {
    console.error('❌ Error en cron handler:', error);
    throw error;
  }
}
