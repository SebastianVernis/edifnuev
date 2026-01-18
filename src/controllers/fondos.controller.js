import { readData, writeData } from '../data.js';

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

export const getPatrimonio = (req, res) => {
  try {
    const data = readData();
    const fondos = data.fondos || {
      ahorroAcumulado: 0,
      gastosMayores: 0,
      dineroOperacional: 0,
      patrimonioTotal: 0
    };

    res.json({
      ok: true,
      patrimonio: fondos.patrimonioTotal || 0
    });
  } catch (error) {
    console.error('Error fetching patrimonio:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error interno del servidor'
    });
  }
};

export const actualizarFondos = (req, res) => {
  try {
    const { ahorroAcumulado, gastosMayores, dineroOperacional } = req.body;
    const data = readData();

    data.fondos = {
      ahorroAcumulado: ahorroAcumulado || 0,
      gastosMayores: gastosMayores || 0,
      dineroOperacional: dineroOperacional || 0,
      patrimonioTotal: (ahorroAcumulado || 0) + (gastosMayores || 0) + (dineroOperacional || 0)
    };

    writeData(data);

    res.json({
      ok: true,
      fondos: data.fondos
    });
  } catch (error) {
    console.error('Error updating fondos:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error interno del servidor'
    });
  }
};

export const transferirEntreFondos = (req, res) => {
  try {
    const { origen, destino, monto, descripcion } = req.body;
    const data = readData();

    if (!data.fondos) {
      data.fondos = {
        ahorroAcumulado: 0,
        gastosMayores: 0,
        dineroOperacional: 0,
        patrimonioTotal: 0
      };
    }

    // Validar que hay fondos suficientes
    if (data.fondos[origen] < monto) {
      return res.status(400).json({
        ok: false,
        msg: 'Fondos insuficientes en el fondo de origen'
      });
    }

    // Realizar transferencia
    data.fondos[origen] -= monto;
    data.fondos[destino] += monto;

    // Registrar movimiento
    if (!data.movimientos) {
      data.movimientos = [];
    }

    data.movimientos.push({
      id: Date.now(),
      tipo: 'transferencia',
      origen,
      destino,
      monto,
      descripcion: descripcion || `Transferencia de ${origen} a ${destino}`,
      fecha: new Date().toISOString(),
      usuario: req.usuario.email
    });

    writeData(data);

    res.json({
      ok: true,
      fondos: data.fondos,
      msg: 'Transferencia realizada exitosamente'
    });
  } catch (error) {
    console.error('Error transferring fondos:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error interno del servidor'
    });
  }
};