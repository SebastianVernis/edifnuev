import Fondo from '../models/Fondo.js';
import { handleControllerError } from '../middleware/error-handler.js';

export const getFondos = async (req, res) => {
  try {
    const { readData } = await import('../data.js');
    const data = readData();
    const fondos = data.fondos;
    const movimientos = data.movimientos || [];
    
    res.json({
      ok: true,
      fondos,
      movimientos
    });
  } catch (error) {
    return handleControllerError(error, res, 'fondos');
  }
};

export const actualizarFondos = async (req, res) => {
  const updates = req.body;
  
  try {
    const fondosActualizados = await Fondo.updateFondos(updates);
    
    res.json({
      ok: true,
      fondos: fondosActualizados
    });
  } catch (error) {
    return handleControllerError(error, res, 'fondos');
  }
};

export const transferirEntreFondos = async (req, res) => {
  const { origen, destino, monto, descripcion } = req.body;
  
  try {
    const fondosActualizados = await Fondo.transferirEntreFondos(origen, destino, monto);
    
    res.json({
      ok: true,
      fondos: fondosActualizados,
      msg: `Transferencia de ${monto} realizada correctamente de ${origen} a ${destino}`
    });
  } catch (error) {
    return handleControllerError(error, res, 'transferirEntreFondos');
  }
};

export const getPatrimonio = async (req, res) => {
  try {
    const { readData } = await import('../data.js');
    const data = readData();
    const fondos = data.fondos;
    
    const patrimonioTotal = (fondos.ahorroAcumulado || 0) + 
                           (fondos.gastosMayores || 0) + 
                           (fondos.dineroOperacional || 0);
    
    res.json({
      ok: true,
      patrimonioTotal,
      fondos: {
        ahorroAcumulado: fondos.ahorroAcumulado || 0,
        gastosMayores: fondos.gastosMayores || 0,
        dineroOperacional: fondos.dineroOperacional || 0
      }
    });
  } catch (error) {
    return handleControllerError(error, res, 'getPatrimonio');
  }
};