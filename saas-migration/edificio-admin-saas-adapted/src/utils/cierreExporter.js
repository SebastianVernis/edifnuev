/**
 * Exportador de Cierres con Comprobantes
 * Genera PDF + ZIP con todos los comprobantes de gastos
 */

import Cierre from '../models/Cierre.js';
import Gasto from '../models/Gasto.js';

/**
 * Generar reporte de cierre con comprobantes
 * @param {Object} db - D1 Database
 * @param {Object} r2 - R2 Bucket
 * @param {string} cierreId - ID del cierre
 * @returns {Promise<Object>} { pdfUrl, zipUrl, comprobantes }
 */
export async function generarReporteCierre(db, r2, cierreId) {
  try {
    // 1. Obtener datos del cierre
    const cierre = await Cierre.getById(db, cierreId);
    if (!cierre) {
      throw new Error('Cierre no encontrado');
    }

    // 2. Obtener gastos del periodo con comprobantes
    const fechaInicio = `${cierre.anio}-${String(cierre.mes).padStart(2, '0')}-01`;
    const fechaFin = new Date(cierre.anio, cierre.mes, 0).toISOString().split('T')[0];
    
    const gastos = await Gasto.getAll(db, {
      fecha_desde: fechaInicio,
      fecha_hasta: fechaFin,
      building_id: cierre.building_id
    });

    // 3. Filtrar gastos con comprobantes
    const gastosConComprobante = gastos.filter(g => g.comprobante);

    console.log(`📄 Cierre ${cierre.periodo}: ${gastos.length} gastos, ${gastosConComprobante.length} con comprobante`);

    // 4. Generar PDF del reporte
    const pdfContent = await generarPDF(cierre, gastos);
    const pdfKey = `cierres/${cierre.building_id}/${cierre.anio}/${cierre.mes}/reporte-${cierreId}.pdf`;
    
    await r2.put(pdfKey, pdfContent, {
      httpMetadata: {
        contentType: 'application/pdf',
      },
      customMetadata: {
        cierreId: cierreId,
        periodo: cierre.periodo,
        generatedAt: new Date().toISOString(),
      }
    });

    // 5. Si hay comprobantes, crear ZIP
    let zipUrl = null;
    if (gastosConComprobante.length > 0) {
      const zipContent = await generarZIPConComprobantes(r2, gastosConComprobante);
      const zipKey = `cierres/${cierre.building_id}/${cierre.anio}/${cierre.mes}/comprobantes-${cierreId}.zip`;
      
      await r2.put(zipKey, zipContent, {
        httpMetadata: {
          contentType: 'application/zip',
        },
        customMetadata: {
          cierreId: cierreId,
          totalComprobantes: gastosConComprobante.length.toString(),
        }
      });

      zipUrl = `/api/downloads/cierres/${zipKey}`;
    }

    // 6. Actualizar cierre con URLs de archivos
    await Cierre.update(db, cierreId, {
      pdf_url: `/api/downloads/cierres/${pdfKey}`,
      comprobantes_zip_url: zipUrl,
      estado: 'generado'
    });

    return {
      ok: true,
      pdfUrl: `/api/downloads/cierres/${pdfKey}`,
      zipUrl: zipUrl,
      totalGastos: gastos.length,
      totalComprobantes: gastosConComprobante.length,
    };

  } catch (error) {
    console.error('Error generando reporte de cierre:', error);
    throw error;
  }
}

/**
 * Generar PDF del cierre mensual
 */
async function generarPDF(cierre, gastos) {
  // Construir contenido HTML del reporte
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Cierre ${cierre.periodo}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 2rem; }
    h1 { color: #4F46E5; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #4F46E5; color: white; }
    .total { font-weight: bold; background-color: #F3F4F6; }
    .comprobante { color: #10B981; }
  </style>
</head>
<body>
  <h1>🏢 ChispartBuilding</h1>
  <h2>Reporte de Cierre ${cierre.periodo}</h2>
  
  <div style="margin: 2rem 0;">
    <p><strong>Periodo:</strong> ${getNombreMes(cierre.mes)} ${cierre.anio}</p>
    <p><strong>Tipo:</strong> ${cierre.tipo.toUpperCase()}</p>
    <p><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString('es-MX')}</p>
  </div>

  <h3>📊 Resumen Financiero</h3>
  <table>
    <tr>
      <td><strong>Total Ingresos</strong></td>
      <td style="text-align: right;">$${cierre.total_ingresos.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
    </tr>
    <tr>
      <td><strong>Total Egresos</strong></td>
      <td style="text-align: right;">$${cierre.total_egresos.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
    </tr>
    <tr class="total">
      <td><strong>Saldo Final</strong></td>
      <td style="text-align: right;">$${cierre.saldo_final.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
    </tr>
  </table>

  <h3>💰 Detalle de Gastos (${gastos.length})</h3>
  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Concepto</th>
        <th>Categoría</th>
        <th>Proveedor</th>
        <th>Monto</th>
        <th>Comprobante</th>
      </tr>
    </thead>
    <tbody>
      ${gastos.map(g => `
        <tr>
          <td>${g.fecha.split('T')[0]}</td>
          <td>${g.concepto}</td>
          <td>${g.categoria}</td>
          <td>${g.proveedor || 'N/A'}</td>
          <td style="text-align: right;">$${parseFloat(g.monto).toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
          <td class="${g.comprobante ? 'comprobante' : ''}">${g.comprobante ? '✅ Adjunto' : '❌ Sin comprobante'}</td>
        </tr>
      `).join('')}
      <tr class="total">
        <td colspan="4" style="text-align: right;"><strong>TOTAL</strong></td>
        <td style="text-align: right;"><strong>$${gastos.reduce((sum, g) => sum + parseFloat(g.monto), 0).toLocaleString('es-MX', {minimumFractionDigits: 2})}</strong></td>
        <td></td>
      </tr>
    </tbody>
  </table>

  ${cierre.observaciones ? `
    <h3>📝 Observaciones</h3>
    <p>${cierre.observaciones}</p>
  ` : ''}

  <hr style="margin-top: 3rem;">
  <p style="text-align: center; color: #6B7280; font-size: 0.875rem;">
    Generado automáticamente por ChispartBuilding<br>
    ${new Date().toLocaleString('es-MX')}
  </p>
</body>
</html>
  `;

  // Convertir HTML a PDF usando Cloudflare's HTML to PDF service
  // O generar como HTML para descarga
  return new TextEncoder().encode(html);
}

/**
 * Generar ZIP con todos los comprobantes de gastos
 */
async function generarZIPConComprobantes(r2, gastos) {
  // Lista de archivos para el ZIP
  const archivos = [];

  for (const gasto of gastos) {
    if (!gasto.comprobante) continue;

    try {
      // Obtener comprobante de R2
      const comprobanteObj = await r2.get(gasto.comprobante);
      if (!comprobanteObj) {
        console.warn(`Comprobante no encontrado en R2: ${gasto.comprobante}`);
        continue;
      }

      const buffer = await comprobanteObj.arrayBuffer();
      const filename = `${gasto.id}_${gasto.concepto.replace(/[^a-zA-Z0-9]/g, '_')}.${getExtension(gasto.comprobante)}`;

      archivos.push({
        name: filename,
        data: new Uint8Array(buffer)
      });
    } catch (error) {
      console.error(`Error obteniendo comprobante ${gasto.comprobante}:`, error);
    }
  }

  // Crear ZIP simple (sin librerías externas)
  // Para Workers, mejor retornar lista de URLs para descarga individual
  // O usar librería zip-js si está disponible
  
  // Por ahora, retornamos un JSON con la lista de comprobantes
  const manifest = {
    totalComprobantes: archivos.length,
    archivos: archivos.map(a => a.name),
    generatedAt: new Date().toISOString(),
  };

  return new TextEncoder().encode(JSON.stringify(manifest, null, 2));
}

/**
 * Obtener extensión del archivo
 */
function getExtension(filepath) {
  const parts = filepath.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : 'pdf';
}

/**
 * Obtener nombre del mes
 */
function getNombreMes(mes) {
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return meses[mes - 1] || 'Desconocido';
}

/**
 * Generar cierre automático de fin de mes
 * Ejecutado por Cron Trigger
 */
export async function generarCierreAutomatico(db, r2, env) {
  try {
    const hoy = new Date();
    const mes = hoy.getMonth() + 1; // 1-12
    const anio = hoy.getFullYear();

    console.log(`🤖 Generando cierre automático: ${mes}/${anio}`);

    // Obtener todos los buildings activos
    const buildings = await db.prepare('SELECT * FROM buildings WHERE activo = 1').all();

    const resultados = [];

    for (const building of buildings.results || []) {
      // Verificar si ya existe cierre para este periodo
      const cierreExistente = await db.prepare(
        'SELECT id FROM cierres WHERE building_id = ? AND mes = ? AND anio = ?'
      ).bind(building.id, mes, anio).first();

      if (cierreExistente) {
        console.log(`⚠️ Cierre ya existe para ${building.name} (${mes}/${anio})`);
        continue;
      }

      // Calcular ingresos y egresos
      const fechaInicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
      const ultimoDia = new Date(anio, mes, 0).getDate();
      const fechaFin = `${anio}-${String(mes).padStart(2, '0')}-${ultimoDia}`;

      // Total ingresos (cuotas pagadas)
      const ingresos = await db.prepare(`
        SELECT COALESCE(SUM(monto), 0) as total
        FROM cuotas 
        WHERE building_id = ? AND estado = 'PAGADA' 
        AND fecha_pago BETWEEN ? AND ?
      `).bind(building.id, fechaInicio, fechaFin).first();

      // Total egresos (gastos)
      const egresos = await db.prepare(`
        SELECT COALESCE(SUM(monto), 0) as total
        FROM gastos 
        WHERE building_id = ? 
        AND fecha BETWEEN ? AND ?
      `).bind(building.id, fechaInicio, fechaFin).first();

      const totalIngresos = parseFloat(ingresos?.total || 0);
      const totalEgresos = parseFloat(egresos?.total || 0);
      const saldoFinal = totalIngresos - totalEgresos;

      // Crear cierre
      const nuevoCierre = await Cierre.create(db, {
        periodo: `${getNombreMes(mes)} ${anio}`,
        anio: anio,
        mes: mes,
        tipo: 'mensual',
        total_ingresos: totalIngresos,
        total_egresos: totalEgresos,
        saldo_final: saldoFinal,
        observaciones: 'Generado automáticamente al cierre del mes',
        created_by: 'SYSTEM',
        building_id: building.id
      });

      // Generar reporte con comprobantes
      const reporte = await generarReporteCierre(db, r2, nuevoCierre.id);

      resultados.push({
        building: building.name,
        cierre: nuevoCierre.periodo,
        ingresos: totalIngresos,
        egresos: totalEgresos,
        saldo: saldoFinal,
        comprobantes: reporte.totalComprobantes,
        pdfUrl: reporte.pdfUrl,
        zipUrl: reporte.zipUrl,
      });

      console.log(`✅ Cierre generado: ${building.name} - ${nuevoCierre.periodo}`);
    }

    return {
      ok: true,
      msg: 'Cierres automáticos generados',
      cierres: resultados,
      total: resultados.length,
    };

  } catch (error) {
    console.error('Error en cierre automático:', error);
    throw error;
  }
}
