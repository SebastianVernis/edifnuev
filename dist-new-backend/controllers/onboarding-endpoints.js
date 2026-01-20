import { readData, writeData } from '../data.js';
import fs from 'fs';

/**
 * GET /api/onboarding/building-info
 * Obtener información del edificio
 */
export const getBuildingInfo = async (req, res) => {
  try {
    const data = readData();
    
    // Buscar información del edificio
    const buildingInfo = data.buildingInfo || {
      nombre: 'Edificio 205',
      direccion: '',
      totalUnidades: 20,
      cuotaMensual: 1500,
      diaCorte: 1,
      politicas: ''
    };
    
    res.json({
      ok: true,
      buildingInfo
    });
  } catch (error) {
    console.error('Error al obtener información del edificio:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error al obtener información del edificio'
    });
  }
};

/**
 * PUT /api/onboarding/building-info
 * Actualizar información del edificio
 */
export async function updateBuildingInfo(req, res) {
  try {
    const { nombre, direccion, totalUnidades, cuotaMensual, diaCorte, politicas } = req.body;
    
    const data = readData();
    
    if (!data.buildingInfo) {
      data.buildingInfo = {};
    }
    
    // Actualizar información del edificio
    data.buildingInfo = {
      ...data.buildingInfo,
      nombre,
      direccion,
      totalUnidades,
      cuotaMensual,
      diaCorte,
      politicas,
      fechaActualizacion: new Date().toISOString()
    };
    
    const saved = writeData(data);
    
    if (!saved) {
      return res.status(500).json({
        ok: false,
        msg: 'Error al guardar información del edificio'
      });
    }
    
    res.json({
      ok: true,
      msg: 'Información del edificio actualizada exitosamente',
      buildingInfo: data.buildingInfo
    });
    
  } catch (error) {
    console.error('Error al actualizar información del edificio:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error al actualizar información del edificio'
    });
  }
}

/**
 * GET /api/onboarding/documents
 * Obtener documentos del edificio
 */
export async function getDocuments(req, res) {
  try {
    const data = readData();
    const documents = data.documentos || [];
    
    res.json({
      ok: true,
      documents
    });
  } catch (error) {
    console.error('Error al obtener documentos:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error al obtener documentos'
    });
  }
}

/**
 * POST /api/onboarding/documents
 * Subir documento del edificio
 */
export async function uploadDocument(req, res) {
  try {
    const { tipo, nombre } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        ok: false,
        msg: 'No se proporcionó archivo'
      });
    }
    
    const data = readData();
    
    if (!data.documentos) {
      data.documentos = [];
    }
    
    const nuevoDocumento = {
      id: data.documentos.length > 0 ? Math.max(...data.documentos.map(d => d.id)) + 1 : 1,
      tipo,
      nombre,
      archivo: file.filename,
      ruta: file.path,
      mimeType: file.mimetype,
      tamaño: file.size,
      fecha: new Date().toISOString(),
      uploadedBy: req.usuario.id
    };
    
    data.documentos.push(nuevoDocumento);
    const saved = writeData(data);
    
    if (!saved) {
      // Eliminar archivo si falla el guardado
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(500).json({
        ok: false,
        msg: 'Error al guardar documento'
      });
    }
    
    res.json({
      ok: true,
      msg: 'Documento subido exitosamente',
      document: {
        id: nuevoDocumento.id,
        nombre: nuevoDocumento.nombre,
        tipo: nuevoDocumento.tipo,
        fecha: nuevoDocumento.fecha
      }
    });
  } catch (error) {
    console.error('Error al subir documento:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error al subir documento'
    });
  }
}

/**
 * GET /api/onboarding/documents/:id
 * Descargar un documento
 */
export async function downloadDocument(req, res) {
  try {
    const { id } = req.params;
    const data = readData();
    
    if (!data.documentos) {
      return res.status(404).json({
        ok: false,
        msg: 'No hay documentos'
      });
    }
    
    const documento = data.documentos.find(d => d.id === parseInt(id));
    
    if (!documento) {
      return res.status(404).json({
        ok: false,
        msg: 'Documento no encontrado'
      });
    }
    
    // Verificar que el archivo existe
    if (!fs.existsSync(documento.ruta)) {
      return res.status(404).json({
        ok: false,
        msg: 'Archivo no encontrado'
      });
    }
    
    // Enviar archivo
    res.download(documento.ruta, documento.nombre);
  } catch (error) {
    console.error('Error al descargar documento:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error al descargar documento'
    });
  }
}

/**
 * DELETE /api/onboarding/documents/:id
 * Eliminar documento
 */
export async function deleteDocument(req, res) {
  try {
    const { id } = req.params;
    const data = readData();
    
    if (!data.documentos) {
      return res.status(404).json({
        ok: false,
        msg: 'No se encontraron documentos'
      });
    }
    
    const docIndex = data.documentos.findIndex(d => d.id === parseInt(id));
    
    if (docIndex === -1) {
      return res.status(404).json({
        ok: false,
        msg: 'Documento no encontrado'
      });
    }
    
    // Eliminar archivo físico
    const doc = data.documentos[docIndex];
    if (doc.ruta && fs.existsSync(doc.ruta)) {
      fs.unlinkSync(doc.ruta);
    }
    
    // Eliminar del array
    data.documentos.splice(docIndex, 1);
    writeData(data);
    
    res.json({
      ok: true,
      msg: 'Documento eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error al eliminar documento'
    });
  }
}
