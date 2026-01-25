import Gasto from '../models/Gasto.js';
import Fondo from '../models/Fondo.js';
import { handleControllerError, validateId, validateRequired, validateNumber } from '../middleware/error-handler.js';
import { uploadBase64File } from '../utils/upload.js';

export const getGastos = async (req, res) => {
  try {
    const gastos = await Gasto.getAll();
    
    res.json({
      ok: true,
      gastos
    });
  } catch (error) {
    return handleControllerError(error, res, 'getGastos');
  }
};

export const getGastoById = async (req, res) => {
  try {
    const id = validateId(req.params.id);
    const gasto = await Gasto.getById(id);
    
    if (!gasto) {
      return res.status(404).json({
        ok: false,
        msg: 'Gasto no encontrado'
      });
    }
    
    res.json({
      ok: true,
      gasto
    });
  } catch (error) {
    return handleControllerError(error, res, 'getGastoById');
  }
};

export const getGastosByCategoria = async (req, res) => {
  const { categoria } = req.params;
  
  try {
    const gastos = await Gasto.getByCategoria(categoria);
    
    res.json({
      ok: true,
      gastos
    });
  } catch (error) {
    return handleControllerError(error, res, 'gastos');
    res.status(500).json({
      ok: false,
      msg: 'Error en el servidor'
    });
  }
};

export const getGastosByMesAño = async (req, res) => {
  const { mes, año } = req.params;
  
  try {
    const gastos = await Gasto.getByMesAño(parseInt(mes), parseInt(año));
    
    res.json({
      ok: true,
      gastos
    });
  } catch (error) {
    return handleControllerError(error, res, 'gastos');
    res.status(500).json({
      ok: false,
      msg: 'Error en el servidor'
    });
  }
};

export const crearGasto = async (req, res) => {
  const { concepto, monto, categoria, proveedor, fecha, comprobante, notas, fondo, base64Comprobante, fileNameComprobante } = req.body;
  
  try {
    // Registrar el gasto en el fondo correspondiente
    await Fondo.registrarGasto(monto, fondo || 'dineroOperacional');
    
    // Si se subió un archivo base64, procesarlo
    let comprobanteUrl = comprobante;
    if (base64Comprobante) {
        try {
            comprobanteUrl = await uploadBase64File(
                base64Comprobante,
                fileNameComprobante || 'comprobante.jpg',
                'expenses',
                req.env || process.env
            );
        } catch (uploadError) {
            console.error('Error al subir comprobante de gasto:', uploadError);
        }
    }

    // Crear registro de gasto
    const gasto = await Gasto.create({
      concepto,
      monto,
      categoria,
      proveedor,
      fecha,
      comprobante: comprobanteUrl,
      notas,
      createdBy: req.usuario.id
    });
    
    res.json({
      ok: true,
      gasto
    });
  } catch (error) {
    return handleControllerError(error, res, 'gastos');
  }
};

export const actualizarGasto = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  try {
    const gasto = await Gasto.getById(id);
    
    if (!gasto) {
      return res.status(404).json({
        ok: false,
        msg: 'Gasto no encontrado'
      });
    }

    // Si hay un nuevo comprobante en base64
    if (updates.base64Comprobante) {
        try {
            updates.comprobante = await uploadBase64File(
                updates.base64Comprobante,
                updates.fileNameComprobante || 'comprobante_actualizado.jpg',
                'expenses',
                req.env || process.env
            );
            // Evitar que estos campos lleguen al modelo
            delete updates.base64Comprobante;
            delete updates.fileNameComprobante;
        } catch (uploadError) {
            console.error('Error al actualizar comprobante de gasto:', uploadError);
        }
    }
    
    // Si se actualiza el monto, ajustar fondos
    if (updates.monto && updates.monto !== gasto.monto) {
      const diferencia = updates.monto - gasto.monto;
      
      if (diferencia > 0) {
        // Si aumentó el gasto, restar la diferencia
        await Fondo.registrarGasto(diferencia, updates.fondo || 'dineroOperacional');
      } else {
        // Si disminuyó el gasto, sumar la diferencia
        await Fondo.registrarIngreso(Math.abs(diferencia), updates.fondo || 'dineroOperacional');
      }
    }
    
    const gastoActualizado = await Gasto.update(id, updates);
    
    res.json({
      ok: true,
      gasto: gastoActualizado
    });
  } catch (error) {
    return handleControllerError(error, res, 'gastos');
  }
};

export const eliminarGasto = async (req, res) => {
  const { id } = req.params;
  
  try {
    const gasto = await Gasto.getById(id);
    
    if (!gasto) {
      return res.status(404).json({
        ok: false,
        msg: 'Gasto no encontrado'
      });
    }
    
    // Devolver el monto al fondo correspondiente
    await Fondo.registrarIngreso(gasto.monto, 'dineroOperacional');
    
    // Eliminar el gasto
    await Gasto.delete(id);
    
    res.json({
      ok: true,
      msg: 'Gasto eliminado correctamente'
    });
  } catch (error) {
    return handleControllerError(error, res, 'gastos');
    res.status(500).json({
      ok: false,
      msg: 'Error en el servidor'
    });
  }
};

export const getGastosStats = async (req, res) => {
  try {
    const gastos = await Gasto.getAll();
    
    const stats = {
      total: gastos.length,
      totalMonto: gastos.reduce((sum, g) => sum + (g.monto || 0), 0),
      porCategoria: {},
      porProveedor: {}
    };
    
    // Agrupar por categoría
    gastos.forEach(gasto => {
      if (!stats.porCategoria[gasto.categoria]) {
        stats.porCategoria[gasto.categoria] = {
          count: 0,
          monto: 0
        };
      }
      stats.porCategoria[gasto.categoria].count++;
      stats.porCategoria[gasto.categoria].monto += gasto.monto || 0;
    });
    
    // Agrupar por proveedor
    gastos.forEach(gasto => {
      if (!stats.porProveedor[gasto.proveedor]) {
        stats.porProveedor[gasto.proveedor] = {
          count: 0,
          monto: 0
        };
      }
      stats.porProveedor[gasto.proveedor].count++;
      stats.porProveedor[gasto.proveedor].monto += gasto.monto || 0;
    });
    
    res.json({
      ok: true,
      stats
    });
  } catch (error) {
    return handleControllerError(error, res, 'getGastosStats');
  }
};