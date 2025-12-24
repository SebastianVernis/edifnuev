/**
 * Theme customization handlers for Cloudflare Workers
 * Adapted for D1 database
 */

// Obtener configuración de tema por buildingId
export async function getTheme(request, env) {
  try {
    const buildingId = parseInt(request.params.buildingId);
    const user = request.user;
    
    // Validar que el usuario tenga acceso al building
    if (user.role !== 'ADMIN' && user.buildingId !== buildingId) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No tienes permiso para acceder a esta configuración'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Buscar tema en D1
    const theme = await env.DB.prepare(
      'SELECT * FROM theme_configs WHERE building_id = ?'
    ).bind(buildingId).first();

    if (!theme) {
      // Retornar tema por defecto
      return new Response(JSON.stringify({
        success: true,
        data: {
          buildingId,
          config: getDefaultTheme(),
          isDefault: true
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        buildingId: theme.building_id,
        config: JSON.parse(theme.config),
        createdAt: theme.created_at,
        updatedAt: theme.updated_at
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al obtener tema:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al obtener configuración de tema',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Obtener tema actual del usuario autenticado
export async function getMyTheme(request, env) {
  try {
    const buildingId = request.user.buildingId;

    if (!buildingId) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          config: getDefaultTheme(),
          isDefault: true
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const theme = await env.DB.prepare(
      'SELECT * FROM theme_configs WHERE building_id = ?'
    ).bind(buildingId).first();

    if (!theme) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          buildingId,
          config: getDefaultTheme(),
          isDefault: true
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        buildingId: theme.building_id,
        config: JSON.parse(theme.config),
        createdAt: theme.created_at,
        updatedAt: theme.updated_at
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al obtener tema del usuario:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al obtener tema',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Crear o actualizar configuración de tema (solo ADMIN)
export async function createOrUpdateTheme(request, env) {
  try {
    const buildingId = parseInt(request.params.buildingId);
    const user = request.user;
    const themeConfig = await request.json();

    // Solo ADMIN puede modificar temas
    if (user.role !== 'ADMIN') {
      return new Response(JSON.stringify({
        success: false,
        message: 'Solo los administradores pueden modificar la configuración de tema'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar que el usuario tenga acceso al building
    if (user.buildingId && user.buildingId !== buildingId) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No tienes permiso para modificar esta configuración'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Buscar si existe
    const existing = await env.DB.prepare(
      'SELECT id FROM theme_configs WHERE building_id = ?'
    ).bind(buildingId).first();

    const configJson = JSON.stringify(themeConfig);
    const now = new Date().toISOString();

    if (existing) {
      // Actualizar
      await env.DB.prepare(
        'UPDATE theme_configs SET config = ?, updated_at = ? WHERE building_id = ?'
      ).bind(configJson, now, buildingId).run();
    } else {
      // Crear
      await env.DB.prepare(
        'INSERT INTO theme_configs (building_id, config, created_at, updated_at) VALUES (?, ?, ?, ?)'
      ).bind(buildingId, configJson, now, now).run();
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Configuración de tema guardada exitosamente',
      data: {
        buildingId,
        config: themeConfig,
        updatedAt: now
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al guardar tema:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al guardar configuración de tema',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Eliminar configuración de tema (solo ADMIN)
export async function deleteTheme(request, env) {
  try {
    const buildingId = parseInt(request.params.buildingId);
    const user = request.user;

    // Solo ADMIN puede eliminar temas
    if (user.role !== 'ADMIN') {
      return new Response(JSON.stringify({
        success: false,
        message: 'Solo los administradores pueden eliminar configuraciones de tema'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await env.DB.prepare(
      'DELETE FROM theme_configs WHERE building_id = ?'
    ).bind(buildingId).run();

    if (result.changes === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Configuración de tema no encontrada'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Configuración de tema eliminada exitosamente'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al eliminar tema:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al eliminar configuración de tema',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Obtener CSS generado para un tema
export async function getThemeCSS(request, env) {
  try {
    const buildingId = parseInt(request.params.buildingId);

    const theme = await env.DB.prepare(
      'SELECT config FROM theme_configs WHERE building_id = ?'
    ).bind(buildingId).first();

    let config;
    if (!theme) {
      config = getDefaultTheme();
    } else {
      config = JSON.parse(theme.config);
    }

    const css = generateCSS(buildingId, config);

    return new Response(css, {
      headers: { 'Content-Type': 'text/css' }
    });
  } catch (error) {
    console.error('Error al generar CSS:', error);
    return new Response('/* Error al generar CSS */', {
      status: 500,
      headers: { 'Content-Type': 'text/css' }
    });
  }
}

// Obtener CSS del usuario autenticado
export async function getMyThemeCSS(request, env) {
  try {
    const buildingId = request.user.buildingId;

    if (!buildingId) {
      const css = generateCSS(null, getDefaultTheme());
      return new Response(css, {
        headers: { 'Content-Type': 'text/css' }
      });
    }

    const theme = await env.DB.prepare(
      'SELECT config FROM theme_configs WHERE building_id = ?'
    ).bind(buildingId).first();

    let config;
    if (!theme) {
      config = getDefaultTheme();
    } else {
      config = JSON.parse(theme.config);
    }

    const css = generateCSS(buildingId, config);

    return new Response(css, {
      headers: { 'Content-Type': 'text/css' }
    });
  } catch (error) {
    console.error('Error al generar CSS del usuario:', error);
    return new Response('/* Error al generar CSS */', {
      status: 500,
      headers: { 'Content-Type': 'text/css' }
    });
  }
}

// Obtener todos los temas (solo para super admin)
export async function getAllThemes(request, env) {
  try {
    const user = request.user;

    // Solo super admin puede ver todos los temas
    if (user.role !== 'ADMIN' || user.buildingId) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No tienes permiso para acceder a esta información'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const themes = await env.DB.prepare(
      'SELECT * FROM theme_configs ORDER BY building_id'
    ).all();

    return new Response(JSON.stringify({
      success: true,
      data: themes.results.map(t => ({
        buildingId: t.building_id,
        config: JSON.parse(t.config),
        createdAt: t.created_at,
        updatedAt: t.updated_at
      }))
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al obtener todos los temas:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al obtener temas',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper: Tema por defecto
function getDefaultTheme() {
  return {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    fontSize: '16px',
    fontWeightNormal: '400',
    fontWeightBold: '600',
    primaryColor: '#3498db',
    primaryDark: '#2980b9',
    primaryLight: '#5dade2',
    secondaryColor: '#2c3e50',
    secondaryDark: '#1a252f',
    secondaryLight: '#34495e',
    accentColor: '#e74c3c',
    successColor: '#27ae60',
    warningColor: '#f39c12',
    dangerColor: '#e74c3c',
    infoColor: '#3498db',
    textColor: '#333333',
    textColorLight: '#7f8c8d',
    textColorDark: '#2c3e50',
    backgroundColor: '#f5f7fa',
    backgroundColorLight: '#ffffff',
    backgroundColorDark: '#ecf0f1',
    borderColor: '#dddddd',
    borderRadius: '0.25rem',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    spacingSmall: '0.5rem',
    spacingMedium: '1rem',
    spacingLarge: '1.5rem',
    sidebarBackground: '#2c3e50',
    sidebarTextColor: '#ecf0f1',
    sidebarActiveBackground: '#34495e',
    headerBackground: '#ffffff',
    headerTextColor: '#2c3e50',
    headerHeight: '60px',
    buttonPadding: '0.5rem 1rem',
    buttonBorderRadius: '0.25rem',
    cardBackground: '#ffffff',
    cardBorderRadius: '0.5rem',
    cardShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    transitionSpeed: '0.3s',
    transitionEasing: 'ease-in-out'
  };
}

// Helper: Generar CSS
function generateCSS(buildingId, config) {
  return `
/* Tema personalizado - Building ${buildingId || 'Default'} */
:root {
  /* Tipografía */
  --font-family: ${config.fontFamily};
  --font-size-base: ${config.fontSize};
  --font-weight-normal: ${config.fontWeightNormal};
  --font-weight-bold: ${config.fontWeightBold};
  
  /* Colores principales */
  --primary-color: ${config.primaryColor};
  --primary-dark: ${config.primaryDark};
  --primary-light: ${config.primaryLight};
  
  /* Colores secundarios */
  --secondary-color: ${config.secondaryColor};
  --secondary-dark: ${config.secondaryDark};
  --secondary-light: ${config.secondaryLight};
  
  /* Colores de acento */
  --accent-color: ${config.accentColor};
  --success-color: ${config.successColor};
  --warning-color: ${config.warningColor};
  --danger-color: ${config.dangerColor};
  --info-color: ${config.infoColor};
  
  /* Colores de texto */
  --text-color: ${config.textColor};
  --text-color-light: ${config.textColorLight};
  --text-color-dark: ${config.textColorDark};
  
  /* Colores de fondo */
  --background-color: ${config.backgroundColor};
  --background-color-light: ${config.backgroundColorLight};
  --background-color-dark: ${config.backgroundColorDark};
  
  /* Bordes y sombras */
  --border-color: ${config.borderColor};
  --border-radius: ${config.borderRadius};
  --box-shadow: ${config.boxShadow};
  
  /* Espaciado */
  --spacing-small: ${config.spacingSmall};
  --spacing-medium: ${config.spacingMedium};
  --spacing-large: ${config.spacingLarge};
  
  /* Sidebar */
  --sidebar-background: ${config.sidebarBackground};
  --sidebar-text-color: ${config.sidebarTextColor};
  --sidebar-active-background: ${config.sidebarActiveBackground};
  
  /* Header */
  --header-background: ${config.headerBackground};
  --header-text-color: ${config.headerTextColor};
  --header-height: ${config.headerHeight};
  
  /* Botones */
  --button-padding: ${config.buttonPadding};
  --button-border-radius: ${config.buttonBorderRadius};
  
  /* Tarjetas */
  --card-background: ${config.cardBackground};
  --card-border-radius: ${config.cardBorderRadius};
  --card-shadow: ${config.cardShadow};
  
  /* Transiciones */
  --transition-speed: ${config.transitionSpeed};
  --transition-easing: ${config.transitionEasing};
}

body {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--text-color);
  background-color: var(--background-color);
}

.sidebar {
  background-color: var(--sidebar-background);
  color: var(--sidebar-text-color);
}

.sidebar .nav-item.active {
  background-color: var(--sidebar-active-background);
}

.header {
  background-color: var(--header-background);
  color: var(--header-text-color);
  height: var(--header-height);
}

.btn-primary {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.btn-primary:hover {
  background-color: var(--primary-dark);
  border-color: var(--primary-dark);
}

.card {
  background-color: var(--card-background);
  border-radius: var(--card-border-radius);
  box-shadow: var(--card-shadow);
}
`;
}
