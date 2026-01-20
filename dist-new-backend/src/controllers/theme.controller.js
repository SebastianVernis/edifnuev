import ThemeConfig from '../models/ThemeConfig.js';

// Obtener configuración de tema por buildingId
export const getTheme = async (req, res) => {
  try {
    const { buildingId } = req.params;
    
    // Validar que el usuario tenga acceso al building
    if (req.user.rol !== 'ADMIN' && req.user.buildingId !== parseInt(buildingId)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para acceder a esta configuración'
      });
    }

    const theme = ThemeConfig.getByBuildingId(parseInt(buildingId));

    if (!theme) {
      // Retornar tema por defecto si no existe configuración
      return res.json({
        success: true,
        data: {
          buildingId: parseInt(buildingId),
          config: ThemeConfig.getDefault(),
          isDefault: true
        }
      });
    }

    res.json({
      success: true,
      data: theme
    });
  } catch (error) {
    console.error('Error al obtener tema:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración de tema',
      error: error.message
    });
  }
};

// Obtener tema actual del usuario autenticado
export const getMyTheme = async (req, res) => {
  try {
    const buildingId = req.user.buildingId;

    if (!buildingId) {
      return res.json({
        success: true,
        data: {
          config: ThemeConfig.getDefault(),
          isDefault: true
        }
      });
    }

    const theme = ThemeConfig.getByBuildingId(buildingId);

    if (!theme) {
      return res.json({
        success: true,
        data: {
          buildingId,
          config: ThemeConfig.getDefault(),
          isDefault: true
        }
      });
    }

    res.json({
      success: true,
      data: theme
    });
  } catch (error) {
    console.error('Error al obtener tema del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tema',
      error: error.message
    });
  }
};

// Crear o actualizar configuración de tema (solo ADMIN)
export const createOrUpdateTheme = async (req, res) => {
  try {
    const { buildingId } = req.params;
    const themeConfig = req.body;

    // Solo ADMIN puede modificar temas
    if (req.user.rol !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden modificar la configuración de tema'
      });
    }

    // Validar que el usuario tenga acceso al building
    if (req.user.buildingId && req.user.buildingId !== parseInt(buildingId)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para modificar esta configuración'
      });
    }

    const theme = await ThemeConfig.createOrUpdate(parseInt(buildingId), themeConfig);

    res.json({
      success: true,
      message: 'Configuración de tema guardada exitosamente',
      data: theme
    });
  } catch (error) {
    console.error('Error al guardar tema:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar configuración de tema',
      error: error.message
    });
  }
};

// Eliminar configuración de tema (solo ADMIN)
export const deleteTheme = async (req, res) => {
  try {
    const { buildingId } = req.params;

    // Solo ADMIN puede eliminar temas
    if (req.user.rol !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden eliminar configuraciones de tema'
      });
    }

    const deleted = await ThemeConfig.delete(parseInt(buildingId));

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Configuración de tema no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Configuración de tema eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar tema:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar configuración de tema',
      error: error.message
    });
  }
};

// Obtener CSS generado para un tema
export const getThemeCSS = async (req, res) => {
  try {
    const { buildingId } = req.params;

    const theme = ThemeConfig.getByBuildingId(parseInt(buildingId));

    let css;
    if (!theme) {
      // Generar CSS por defecto
      const defaultTheme = new ThemeConfig(parseInt(buildingId), {});
      css = ThemeConfig.generateCSS(defaultTheme);
    } else {
      css = ThemeConfig.generateCSS(theme);
    }

    res.setHeader('Content-Type', 'text/css');
    res.send(css);
  } catch (error) {
    console.error('Error al generar CSS:', error);
    res.status(500).send('/* Error al generar CSS */');
  }
};

// Obtener CSS del usuario autenticado
export const getMyThemeCSS = async (req, res) => {
  try {
    const buildingId = req.user.buildingId;

    if (!buildingId) {
      const defaultTheme = new ThemeConfig(null, {});
      const css = ThemeConfig.generateCSS(defaultTheme);
      res.setHeader('Content-Type', 'text/css');
      return res.send(css);
    }

    const theme = ThemeConfig.getByBuildingId(buildingId);

    let css;
    if (!theme) {
      const defaultTheme = new ThemeConfig(buildingId, {});
      css = ThemeConfig.generateCSS(defaultTheme);
    } else {
      css = ThemeConfig.generateCSS(theme);
    }

    res.setHeader('Content-Type', 'text/css');
    res.send(css);
  } catch (error) {
    console.error('Error al generar CSS del usuario:', error);
    res.status(500).send('/* Error al generar CSS */');
  }
};

// Obtener todos los temas (solo para super admin)
export const getAllThemes = async (req, res) => {
  try {
    // Solo super admin puede ver todos los temas
    if (req.user.rol !== 'ADMIN' || req.user.buildingId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para acceder a esta información'
      });
    }

    const themes = ThemeConfig.getAll();

    res.json({
      success: true,
      data: themes
    });
  } catch (error) {
    console.error('Error al obtener todos los temas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener temas',
      error: error.message
    });
  }
};
