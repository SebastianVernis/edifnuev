/**
 * Handler para descargas de archivos de R2
 * Maneja PDFs de cierres y ZIPs de comprobantes
 */

import { addCorsHeaders } from '../middleware/cors.js';

/**
 * Descargar archivo de cierre (PDF o ZIP)
 * @param {Request} request
 * @param {Object} env
 */
export async function downloadCierreFile(request, env) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/api/downloads/cierres/')[1];
    
    if (!pathParts) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Ruta de archivo inválida'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }

    // Obtener archivo de R2
    const fileKey = pathParts;
    const object = await env.UPLOADS.get(fileKey);

    if (!object) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Archivo no encontrado'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }

    // Determinar content type
    const contentType = object.httpMetadata?.contentType || 
                       (fileKey.endsWith('.pdf') ? 'application/pdf' : 
                        fileKey.endsWith('.zip') ? 'application/zip' : 
                        'application/octet-stream');

    // Extraer nombre de archivo
    const filename = fileKey.split('/').pop();

    // Retornar archivo
    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600',
      }
    });

  } catch (error) {
    console.error('Error descargando archivo:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false,
      msg: 'Error al descargar archivo',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  }
}

/**
 * Listar archivos disponibles de un cierre
 * @param {Request} request
 * @param {Object} env
 */
export async function listCierreFiles(request, env) {
  try {
    const url = new URL(request.url);
    const cierreId = url.searchParams.get('cierreId');

    if (!cierreId) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'cierreId requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }

    // Obtener información del cierre
    const cierre = await request.db.prepare(
      'SELECT * FROM cierres WHERE id = ?'
    ).bind(cierreId).first();

    if (!cierre) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false,
        msg: 'Cierre no encontrado'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }), request);
    }

    const archivos = [];

    // PDF del reporte
    if (cierre.pdf_url) {
      archivos.push({
        tipo: 'pdf',
        nombre: `Reporte_${cierre.periodo}.pdf`,
        url: cierre.pdf_url,
        size: 'N/A',
      });
    }

    // ZIP de comprobantes
    if (cierre.comprobantes_zip_url) {
      archivos.push({
        tipo: 'zip',
        nombre: `Comprobantes_${cierre.periodo}.zip`,
        url: cierre.comprobantes_zip_url,
        totalComprobantes: cierre.total_comprobantes || 0,
      });
    }

    return addCorsHeaders(new Response(JSON.stringify({
      ok: true,
      cierre: {
        id: cierre.id,
        periodo: cierre.periodo,
        estado: cierre.estado,
      },
      archivos: archivos,
      total: archivos.length,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }), request);

  } catch (error) {
    console.error('Error listando archivos:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false,
      msg: 'Error al listar archivos',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }), request);
  }
}
