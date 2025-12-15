/**
 * Generador de Facturas con IVA 16%
 * Genera factura en formato HTML y la envía por email
 */

import { sendEmail } from './smtp.js';

const PLANS = {
  basico: { name: 'Plan Básico Anual', price: 2000, maxUnits: 20 },
  profesional: { name: 'Plan Profesional Anual', price: 4000, maxUnits: 50 },
  empresarial: { name: 'Plan Empresarial Anual', price: 6000, maxUnits: 200 },
};

const IVA_RATE = 0.16;

/**
 * Generar y enviar factura
 */
export async function generarYEnviarFactura(pendingUser, env) {
  try {
    if (!pendingUser.requiere_factura) {
      console.log('Cliente no requiere factura');
      return { ok: true, msg: 'Factura no requerida' };
    }

    const plan = PLANS[pendingUser.selected_plan];
    if (!plan) {
      throw new Error('Plan no válido');
    }

    // Calcular montos
    const subtotal = plan.price;
    const iva = subtotal * IVA_RATE;
    const total = subtotal + iva;

    // Generar folio único
    const folio = `FACT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const fecha = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Generar HTML de la factura
    const facturaHTML = generarHTMLFactura({
      folio,
      fecha,
      cliente: {
        rfc: pendingUser.rfc,
        razonSocial: pendingUser.razon_social,
        direccion: pendingUser.direccion_fiscal,
        codigoPostal: pendingUser.codigo_postal_fiscal,
        email: pendingUser.email
      },
      concepto: {
        descripcion: `${plan.name} - ChispartBuilding`,
        cantidad: 1,
        unidad: 'Servicio',
        precioUnitario: subtotal,
        importe: subtotal
      },
      subtotal,
      iva,
      total
    });

    // Enviar factura por email
    const emailResult = await sendEmail({
      to: pendingUser.email,
      subject: `📄 Factura ${folio} - ChispartBuilding`,
      html: facturaHTML,
    }, env);

    if (!emailResult.ok) {
      throw new Error('Error al enviar factura: ' + emailResult.error);
    }

    // También enviar copia a ventas
    await sendEmail({
      to: 'solucionesdigitalesdev@outlook.com',
      subject: `[LEAD] Factura ${folio} - ${pendingUser.razon_social}`,
      html: facturaHTML,
    }, env);

    // Actualizar pending_user
    await env.DB.prepare(`
      UPDATE pending_users 
      SET factura_generada = 1, factura_url = ?
      WHERE email = ?
    `).bind(folio, pendingUser.email).run();

    console.log(`✅ Factura ${folio} generada y enviada a ${pendingUser.email}`);

    return {
      ok: true,
      folio,
      subtotal,
      iva,
      total,
      msg: 'Factura generada y enviada'
    };

  } catch (error) {
    console.error('Error generando factura:', error);
    return {
      ok: false,
      error: error.message
    };
  }
}

/**
 * Generar HTML de factura
 */
function generarHTMLFactura(data) {
  const { folio, fecha, cliente, concepto, subtotal, iva, total } = data;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Factura ${folio}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #4F46E5;
      padding-bottom: 1rem;
      margin-bottom: 2rem;
    }
    .header h1 {
      color: #4F46E5;
      margin-bottom: 0.5rem;
    }
    .header p {
      color: #6B7280;
      font-size: 0.875rem;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }
    .info-section h3 {
      color: #4F46E5;
      font-size: 0.875rem;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }
    .info-section p {
      margin: 0.25rem 0;
      font-size: 0.875rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 2rem 0;
    }
    th, td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #E5E7EB;
    }
    th {
      background: #F3F4F6;
      font-weight: 600;
      color: #4F46E5;
    }
    .totales {
      text-align: right;
      margin-top: 2rem;
    }
    .totales table {
      margin-left: auto;
      width: 300px;
    }
    .totales .total-row {
      font-weight: bold;
      font-size: 1.25rem;
      background: #F3F4F6;
    }
    .footer {
      text-align: center;
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid #E5E7EB;
      color: #6B7280;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏢 ChispartBuilding</h1>
    <p>Sistema de Gestión para Condominios</p>
  </div>

  <div style="text-align: right; margin-bottom: 2rem;">
    <h2 style="color: #4F46E5; margin: 0;">FACTURA</h2>
    <p style="margin: 0.25rem 0;"><strong>Folio:</strong> ${folio}</p>
    <p style="margin: 0.25rem 0;"><strong>Fecha:</strong> ${fecha}</p>
  </div>

  <div class="info-grid">
    <div class="info-section">
      <h3>Emisor</h3>
      <p><strong>ChispartBuilding S.A. de C.V.</strong></p>
      <p>RFC: CHI123456789</p>
      <p>Av. Insurgentes Sur 1234, CDMX</p>
      <p>CP: 03100</p>
    </div>

    <div class="info-section">
      <h3>Cliente</h3>
      <p><strong>${cliente.razonSocial}</strong></p>
      <p>RFC: ${cliente.rfc}</p>
      <p>${cliente.direccion}</p>
      <p>CP: ${cliente.codigoPostal}</p>
      <p>Email: ${cliente.email}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Descripción</th>
        <th>Cantidad</th>
        <th>Unidad</th>
        <th>Precio Unitario</th>
        <th>Importe</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${concepto.descripcion}</td>
        <td>${concepto.cantidad}</td>
        <td>${concepto.unidad}</td>
        <td>$${concepto.precioUnitario.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
        <td>$${concepto.importe.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
      </tr>
    </tbody>
  </table>

  <div class="totales">
    <table>
      <tr>
        <td>Subtotal:</td>
        <td>$${subtotal.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
      </tr>
      <tr>
        <td>IVA (16%):</td>
        <td>$${iva.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
      </tr>
      <tr class="total-row">
        <td>TOTAL:</td>
        <td>$${total.toLocaleString('es-MX', {minimumFractionDigits: 2})} MXN</td>
      </tr>
    </table>
  </div>

  <div style="margin-top: 3rem; padding: 1rem; background: #FEF3C7; border-radius: 0.5rem; border-left: 4px solid #F59E0B;">
    <p style="margin: 0; color: #92400E;">
      <strong>⏰ Pago Pendiente:</strong> Esta factura se generará oficialmente una vez confirmado el pago de tu suscripción anual.
    </p>
  </div>

  <div class="footer">
    <p><strong>ChispartBuilding S.A. de C.V.</strong></p>
    <p>RFC: CHI123456789 | Régimen Fiscal: 601 - General de Ley Personas Morales</p>
    <p>Este documento es una prefactura. La factura oficial se generará al confirmar el pago.</p>
    <p style="margin-top: 1rem;">&copy; ${new Date().getFullYear()} ChispartBuilding. Todos los derechos reservados.</p>
  </div>
</body>
</html>
  `;
}
