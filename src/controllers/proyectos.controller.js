import { readData, writeData } from '../data.js';

/**
 * GET /api/proyectos
 * Obtener lista de proyectos críticos
 */
export async function getProyectos(req, res) {
  try {
    const data = readData();
    
    if (!data) {
      return res.status(500).json({
        ok: false,
        msg: 'Error al leer datos'
      });
    }
    
    const proyectos = data.proyectos || [];
    const totalMonto = proyectos.reduce((sum, p) => sum + p.monto, 0);
    const totalUnidades = data.usuarios.filter(u => u.departamento !== 'ADMIN' && u.departamento !== 'Admin').length || 20;
    const montoPorDepto = totalMonto / totalUnidades;
    
    res.json({
      ok: true,
      proyectos,
      resumen: {
        total: totalMonto,
        porDepartamento: montoPorDepto,
        totalUnidades
      }
    });
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error al obtener proyectos'
    });
  }
}

/**
 * POST /api/proyectos
 * Crear nuevo proyecto crítico
 */
export async function crearProyecto(req, res) {
  try {
    const { nombre, monto, prioridad } = req.body;
    
    if (!nombre || !monto || !prioridad) {
      return res.status(400).json({
        ok: false,
        msg: 'Datos incompletos'
      });
    }
    
    const data = readData();
    if (!data) {
      return res.status(500).json({
        ok: false,
        msg: 'Error al leer datos'
      });
    }
    
    if (!data.proyectos) {
      data.proyectos = [];
    }
    
    const nuevoProyecto = {
      id: data.proyectos.length > 0 ? Math.max(...data.proyectos.map(p => p.id)) + 1 : 1,
      nombre,
      monto: parseFloat(monto),
      prioridad
    };
    
    data.proyectos.push(nuevoProyecto);
    const saved = writeData(data);
    
    if (!saved) {
      return res.status(500).json({
        ok: false,
        msg: 'Error al guardar proyecto'
      });
    }
    
    res.json({
      ok: true,
      msg: 'Proyecto creado exitosamente',
      proyecto: nuevoProyecto
    });
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error al crear proyecto'
    });
  }
}

/**
 * PUT /api/proyectos/:id
 * Actualizar proyecto crítico
 */
export async function actualizarProyecto(req, res) {
  try {
    const { id } = req.params;
    const { nombre, monto, prioridad } = req.body;
    
    const data = readData();
    if (!data) {
      return res.status(500).json({
        ok: false,
        msg: 'Error al leer datos'
      });
    }
    
    const proyectoIndex = data.proyectos.findIndex(p => p.id === parseInt(id));
    if (proyectoIndex === -1) {
      return res.status(404).json({
        ok: false,
        msg: 'Proyecto no encontrado'
      });
    }
    
    if (nombre) data.proyectos[proyectoIndex].nombre = nombre;
    if (monto) data.proyectos[proyectoIndex].monto = parseFloat(monto);
    if (prioridad) data.proyectos[proyectoIndex].prioridad = prioridad;
    
    const saved = writeData(data);
    
    if (!saved) {
      return res.status(500).json({
        ok: false,
        msg: 'Error al actualizar proyecto'
      });
    }
    
    res.json({
      ok: true,
      msg: 'Proyecto actualizado exitosamente',
      proyecto: data.proyectos[proyectoIndex]
    });
  } catch (error) {
    console.error('Error al actualizar proyecto:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error al actualizar proyecto'
    });
  }
}

/**
 * DELETE /api/proyectos/:id
 * Eliminar proyecto crítico
 */
export async function eliminarProyecto(req, res) {
  try {
    const { id } = req.params;
    
    const data = readData();
    if (!data) {
      return res.status(500).json({
        ok: false,
        msg: 'Error al leer datos'
      });
    }
    
    const proyectoIndex = data.proyectos.findIndex(p => p.id === parseInt(id));
    if (proyectoIndex === -1) {
      return res.status(404).json({
        ok: false,
        msg: 'Proyecto no encontrado'
      });
    }
    
    data.proyectos.splice(proyectoIndex, 1);
    const saved = writeData(data);
    
    if (!saved) {
      return res.status(500).json({
        ok: false,
        msg: 'Error al eliminar proyecto'
      });
    }
    
    res.json({
      ok: true,
      msg: 'Proyecto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
    res.status(500).json({
      ok: false,
      msg: 'Error al eliminar proyecto'
    });
  }
}
