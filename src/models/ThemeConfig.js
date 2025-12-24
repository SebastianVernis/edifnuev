import { readData, addItem, updateItem, deleteItem } from '../data.js';

class ThemeConfig {
  constructor(buildingId, config) {
    this.buildingId = buildingId;
    this.config = {
      // Tipografía
      fontFamily: config.fontFamily || "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      fontSize: config.fontSize || '16px',
      fontWeightNormal: config.fontWeightNormal || '400',
      fontWeightBold: config.fontWeightBold || '600',
      
      // Colores principales
      primaryColor: config.primaryColor || '#3498db',
      primaryDark: config.primaryDark || '#2980b9',
      primaryLight: config.primaryLight || '#5dade2',
      
      // Colores secundarios
      secondaryColor: config.secondaryColor || '#2c3e50',
      secondaryDark: config.secondaryDark || '#1a252f',
      secondaryLight: config.secondaryLight || '#34495e',
      
      // Colores de acento
      accentColor: config.accentColor || '#e74c3c',
      successColor: config.successColor || '#27ae60',
      warningColor: config.warningColor || '#f39c12',
      dangerColor: config.dangerColor || '#e74c3c',
      infoColor: config.infoColor || '#3498db',
      
      // Colores de texto
      textColor: config.textColor || '#333333',
      textColorLight: config.textColorLight || '#7f8c8d',
      textColorDark: config.textColorDark || '#2c3e50',
      
      // Colores de fondo
      backgroundColor: config.backgroundColor || '#f5f7fa',
      backgroundColorLight: config.backgroundColorLight || '#ffffff',
      backgroundColorDark: config.backgroundColorDark || '#ecf0f1',
      
      // Bordes y sombras
      borderColor: config.borderColor || '#dddddd',
      borderRadius: config.borderRadius || '0.25rem',
      boxShadow: config.boxShadow || '0 2px 10px rgba(0, 0, 0, 0.1)',
      
      // Espaciado
      spacingSmall: config.spacingSmall || '0.5rem',
      spacingMedium: config.spacingMedium || '1rem',
      spacingLarge: config.spacingLarge || '1.5rem',
      
      // Sidebar
      sidebarBackground: config.sidebarBackground || '#2c3e50',
      sidebarTextColor: config.sidebarTextColor || '#ecf0f1',
      sidebarActiveBackground: config.sidebarActiveBackground || '#34495e',
      
      // Header
      headerBackground: config.headerBackground || '#ffffff',
      headerTextColor: config.headerTextColor || '#2c3e50',
      headerHeight: config.headerHeight || '60px',
      
      // Botones
      buttonPadding: config.buttonPadding || '0.5rem 1rem',
      buttonBorderRadius: config.buttonBorderRadius || '0.25rem',
      
      // Tarjetas
      cardBackground: config.cardBackground || '#ffffff',
      cardBorderRadius: config.cardBorderRadius || '0.5rem',
      cardShadow: config.cardShadow || '0 2px 8px rgba(0, 0, 0, 0.08)',
      
      // Transiciones
      transitionSpeed: config.transitionSpeed || '0.3s',
      transitionEasing: config.transitionEasing || 'ease-in-out',
    };
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  // Crear o actualizar configuración de tema para un building
  static async createOrUpdate(buildingId, themeConfig) {
    try {
      const data = readData();
      
      // Inicializar array de temas si no existe
      if (!data.themeConfigs) {
        data.themeConfigs = [];
      }

      // Buscar configuración existente
      const existingIndex = data.themeConfigs.findIndex(t => t.buildingId === buildingId);

      const newTheme = new ThemeConfig(buildingId, themeConfig);

      if (existingIndex !== -1) {
        // Actualizar existente
        newTheme.createdAt = data.themeConfigs[existingIndex].createdAt;
        data.themeConfigs[existingIndex] = newTheme;
      } else {
        // Crear nuevo
        data.themeConfigs.push(newTheme);
      }

      // Guardar cambios
      const fs = await import('fs/promises');
      await fs.writeFile('./data.json', JSON.stringify(data, null, 2), 'utf-8');

      return newTheme;
    } catch (error) {
      console.error('Error al crear/actualizar configuración de tema:', error);
      throw error;
    }
  }

  // Obtener configuración de tema por buildingId
  static getByBuildingId(buildingId) {
    try {
      const data = readData();
      
      if (!data.themeConfigs) {
        return null;
      }

      const theme = data.themeConfigs.find(t => t.buildingId === buildingId);
      return theme || null;
    } catch (error) {
      console.error('Error al obtener configuración de tema:', error);
      throw error;
    }
  }

  // Obtener todas las configuraciones de tema
  static getAll() {
    try {
      const data = readData();
      return data.themeConfigs || [];
    } catch (error) {
      console.error('Error al obtener todas las configuraciones:', error);
      throw error;
    }
  }

  // Eliminar configuración de tema
  static async delete(buildingId) {
    try {
      const data = readData();
      
      if (!data.themeConfigs) {
        return false;
      }

      const initialLength = data.themeConfigs.length;
      data.themeConfigs = data.themeConfigs.filter(t => t.buildingId !== buildingId);

      if (data.themeConfigs.length === initialLength) {
        return false; // No se encontró el tema
      }

      // Guardar cambios
      const fs = await import('fs/promises');
      await fs.writeFile('./data.json', JSON.stringify(data, null, 2), 'utf-8');

      return true;
    } catch (error) {
      console.error('Error al eliminar configuración de tema:', error);
      throw error;
    }
  }

  // Obtener tema por defecto
  static getDefault() {
    return new ThemeConfig(null, {}).config;
  }

  // Generar CSS a partir de la configuración
  static generateCSS(themeConfig) {
    const config = themeConfig.config;
    
    return `
/* Tema personalizado - Building ${themeConfig.buildingId} */
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

/* Aplicar variables CSS a elementos específicos */
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
}

export default ThemeConfig;
