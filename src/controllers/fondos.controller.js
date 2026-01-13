import { readData } from '../data.js';

export const getFondos = (req, res) => {
  try {
    const data = readData();
    const fondos = data.fondos || {
      ahorroAcumulado: 0,
      gastosMayores: 0,
      dineroOperacional: 0,
      patrimonioTotal: 0
    };
    const movimientos = data.movimientos || [];

    res.json({
      ok: true,
      fondos,
      movimientos
    });
  } catch (error) {
    console.error('Error fetching fondos:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error interno del servidor'
    });
  }
};