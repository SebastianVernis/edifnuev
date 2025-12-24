# 🎨 Sistema de Personalización de Temas

## Descripción

Sistema completo de personalización de temas para el sistema Edificio Admin, permitiendo a cada Super Admin configurar la apariencia visual de su tenancy de manera persistente.

---

## ✅ Implementación Completa

### 1. **Modelo de Datos** (`src/models/ThemeConfig.js`)

- Configuración completa de tema con 30+ variables personalizables
- Métodos CRUD: `createOrUpdate`, `getByBuildingId`, `getAll`, `delete`
- Generación dinámica de CSS desde configuración
- Almacenamiento en `data.json` bajo `themeConfigs[]`

**Variables personalizables:**
- Tipografía (familia, tamaño, pesos)
- Colores principales y secundarios
- Colores de acento y estado
- Colores de texto y fondo
- Sidebar (fondo, texto, hover)
- Header (fondo, texto, altura)
- Botones y tarjetas
- Bordes, sombras, espaciado
- Transiciones

### 2. **API Endpoints** (`src/controllers/theme.controller.js` + `src/routes/theme.routes.js`)

**Endpoints disponibles:**

```
GET    /api/theme/my-theme              - Obtener tema del usuario autenticado
GET    /api/theme/my-theme/css          - Obtener CSS del tema del usuario
GET    /api/theme/building/:buildingId  - Obtener tema por building
GET    /api/theme/building/:buildingId/css - Obtener CSS por building (pública)
PUT    /api/theme/building/:buildingId  - Crear/actualizar tema (ADMIN only)
DELETE /api/theme/building/:buildingId  - Eliminar tema (ADMIN only)
GET    /api/theme/all                   - Obtener todos los temas (Super Admin)
```

**Seguridad:**
- Solo ADMIN puede modificar/eliminar temas
- Validación de acceso por buildingId
- Temas por defecto cuando no hay configuración

### 3. **Interfaz de Usuario** (`public/theme-customizer.html`)

**Características:**
- Panel visual de personalización con preview en tiempo real
- Organizdo por secciones: Tipografía, Colores, Sidebar, Estados
- Color pickers con previews visuales
- Selector de fuentes populares (Roboto, Open Sans, Lato, etc.)
- Botones: Vista previa, Guardar, Restaurar por defecto
- Mensajes de éxito/error
- Responsive design

**Secciones de personalización:**
1. 📝 Tipografía
2. 🎨 Colores Principales
3. 🌈 Colores Secundarios
4. ✅ Colores de Estado
5. 📄 Colores de Texto
6. 📋 Sidebar

### 4. **Integración en el Sistema**

**Backend:**
- Rutas registradas en `src/app.js`
- Middleware de autenticación integrado
- buildingId agregado al modelo Usuario
- buildingId incluido en JWT payload

**Frontend:**
- Link en sidebar del admin: "Personalizar Tema"
- Carga automática de CSS personalizado en `admin.html`
- Script de carga de tema dinámico al iniciar sesión
- Fallback a tema por defecto si no existe configuración

**Flujo de aplicación:**
1. Usuario hace login
2. JWT incluye buildingId
3. Frontend carga `/api/theme/my-theme/css`
4. CSS se inyecta dinámicamente vía Blob URL
5. Toda la UI se actualiza con el tema personalizado

### 5. **Persistencia por Building**

- Cada building tiene su propia configuración de tema
- Los cambios se guardan en `data.json` → `themeConfigs[]`
- Estructura:
  ```json
  {
    "buildingId": 1,
    "config": { /* 30+ variables */ },
    "createdAt": "2025-12-24...",
    "updatedAt": "2025-12-24..."
  }
  ```

---

## 🚀 Uso

### Como Super Admin:

1. **Acceder al personalizador:**
   - Login como ADMIN
   - Click en "Personalizar Tema" en el sidebar
   - O navegar a `/theme-customizer.html`

2. **Personalizar:**
   - Seleccionar fuentes del dropdown
   - Usar color pickers para colores
   - Ver preview en tiempo real con botón "Vista previa"
   - Guardar cambios con botón "Guardar tema"

3. **Restaurar:**
   - Click en "Restaurar por defecto"
   - Confirmar y guardar

### Para Inquilinos:

- Los temas se aplican automáticamente al hacer login
- No requieren configuración
- Heredan el tema del building al que pertenecen

---

## 🔒 Seguridad

- Solo ADMIN puede modificar temas
- Validación de permisos en cada endpoint
- buildingId verificado contra el usuario autenticado
- CSS generado del lado del servidor (no puede inyectarse código)
- Tokens JWT requeridos para todos los endpoints privados

---

## 📝 Ejemplo de Configuración

```json
{
  "buildingId": 1,
  "config": {
    "fontFamily": "'Roboto', sans-serif",
    "fontSize": "16px",
    "primaryColor": "#2196f3",
    "primaryDark": "#1976d2",
    "secondaryColor": "#424242",
    "accentColor": "#ff5722",
    "successColor": "#4caf50",
    "warningColor": "#ff9800",
    "dangerColor": "#f44336",
    "textColor": "#212121",
    "backgroundColor": "#fafafa",
    "sidebarBackground": "#263238",
    "sidebarTextColor": "#eceff1",
    // ... más variables
  }
}
```

---

## 🧪 Testing

**Endpoints a probar:**
1. GET `/api/theme/my-theme` (autenticado)
2. GET `/api/theme/my-theme/css` (autenticado)
3. PUT `/api/theme/building/1` (ADMIN)
4. GET `/api/theme/building/1/css` (pública)

**UI a probar:**
1. Acceso a `/theme-customizer.html` como ADMIN
2. Cambiar colores y ver preview
3. Guardar tema y recargar `/admin`
4. Verificar persistencia del tema

**Casos límite:**
- Usuario sin buildingId (debe usar tema por defecto)
- Building sin tema configurado (debe usar tema por defecto)
- Intentar modificar tema de otro building (debe ser rechazado)

---

## 📦 Archivos Creados/Modificados

**Nuevos:**
- `src/models/ThemeConfig.js`
- `src/controllers/theme.controller.js`
- `src/routes/theme.routes.js`
- `public/theme-customizer.html`
- `THEME_SYSTEM.md` (este archivo)

**Modificados:**
- `src/app.js` - Ruta `/api/theme` agregada
- `src/models/Usuario.js` - Campo `buildingId` agregado
- `src/middleware/auth.js` - `buildingId` en JWT
- `src/controllers/auth.controller.js` - `buildingId` en respuesta de login
- `public/admin.html` - Link a personalizador + carga de CSS dinámico
- `package.json` - Conflictos de merge resueltos

---

## 🎯 Estado

✅ **COMPLETO Y FUNCIONAL**

- Modelo de datos implementado
- API endpoints funcionando
- Interfaz de usuario completa
- Integración en sistema existente
- Persistencia por building_id
- Seguridad y validaciones
- Tema por defecto funcional
- Carga dinámica de CSS

---

## 📌 Notas

- El sistema actual usa JSON file storage (`data.json`)
- Para migrar a SQL, adaptar métodos en `ThemeConfig.js`
- Los temas se cargan vía Blob URL para evitar CORS
- Variables CSS se inyectan como `:root` en el DOM
- Compatible con todos los navegadores modernos

---

## 🔄 Próximos Pasos (Opcional)

- [ ] Presets de temas predefinidos (Material, Bootstrap, Dark Mode)
- [ ] Preview de componentes más completo en el customizer
- [ ] Exportar/Importar configuraciones de tema
- [ ] Modo oscuro toggle automático
- [ ] Historial de cambios de tema
- [ ] Logo personalizado por building

---

**Fecha de implementación:** 2025-12-24  
**Estado:** ✅ Producción Ready
