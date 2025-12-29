---
name: 🎨 Desarrollo de Módulo Frontend
about: Template para completar/crear módulos frontend
title: '[FRONTEND] Módulo: [NOMBRE]'
labels: frontend, enhancement, agente-remoto
assignees: ''
---

## 📋 Información del Módulo

**Módulo:** [Nombre del módulo]  
**Estado Actual:** [Porcentaje]% completo  
**Prioridad:** 🔴 Alta / 🟡 Media / 🟢 Baja  
**Estimación:** [X-Y] horas  
**Agente Asignado:** [Nombre del agente]

---

## 🎯 Objetivo

[Descripción clara del objetivo del módulo y qué funcionalidad debe proporcionar]

---

## ✅ Backend Disponible

### APIs Ready
```
✅ GET    /api/[recurso]
✅ POST   /api/[recurso]
✅ GET    /api/[recurso]/:id
✅ PUT    /api/[recurso]/:id
✅ DELETE /api/[recurso]/:id
```

### Modelos
- ✅ `src/models/[Modelo].js`
- ✅ `src/controllers/[recurso].controller.js`
- ✅ `src/routes/[recurso].routes.js`

---

## 📁 Archivos a Crear/Modificar

### Frontend
```
📄 public/js/modules/[modulo]/[modulo].js
📄 public/js/modules/[modulo]/[modulo]-form.js (si aplica)
📄 public/css/modules/[modulo].css (si necesita estilos específicos)
```

### HTML (si aplica)
```
📄 Sección en public/admin.html
📄 Sección en public/inquilino.html (si aplica)
```

---

## 🔨 Funcionalidades Requeridas

### 1. Interfaz de Lista
- [ ] Tabla/cards responsive con datos
- [ ] Paginación (si >20 items)
- [ ] Ordenamiento por columnas
- [ ] Búsqueda/filtro básico
- [ ] Acciones rápidas (ver, editar, eliminar)
- [ ] Loading state mientras carga
- [ ] Empty state (cuando no hay datos)

### 2. Formulario Crear/Editar
- [ ] Campos según modelo backend
- [ ] Validación en tiempo real
- [ ] Manejo de errores
- [ ] Feedback visual (success/error)
- [ ] Botones: Guardar, Cancelar
- [ ] Modal o vista dedicada
- [ ] Pre-llenado en modo edición

### 3. Vista Detallada (si aplica)
- [ ] Modal o página con detalles completos
- [ ] Información formateada
- [ ] Acciones disponibles

### 4. Funcionalidades Específicas
[Listar funcionalidades específicas del módulo]
- [ ] [Funcionalidad 1]
- [ ] [Funcionalidad 2]
- [ ] [Funcionalidad 3]

---

## 📊 Requisitos Técnicos Obligatorios

### Response Handling
```javascript
// ✅ CORRECTO - Usar formato estándar
const response = await fetch('/api/recurso');
const data = await response.json();
if (data.ok) {
    // Success
} else {
    mostrarError(data.msg);
}
```

### Headers de Autenticación
```javascript
// ✅ ÚNICO header permitido
headers: {
    'Content-Type': 'application/json',
    'x-auth-token': token
}
```

### Error Handling
```javascript
// ✅ OBLIGATORIO try-catch en todas las operaciones
try {
    // Operación
} catch (error) {
    console.error('Error en [operación]:', error);
    mostrarError('Error al [operación]');
}
```

### Permisos
```javascript
// ✅ Verificar permisos antes de mostrar acciones
const usuario = obtenerUsuarioActual();
if (usuario.rol === 'ADMIN' || usuario.rol === 'COMITE') {
    // Mostrar acciones admin
}
```

---

## 🎨 Guía de Diseño

### Componentes a Usar
- Bootstrap 5 (clases utility)
- Iconos: Font Awesome / Bootstrap Icons
- Colores: Ver `public/css/dashboard.css`
- Espaciado: Bootstrap spacing (m-*, p-*)

### Estructura HTML Sugerida
```html
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>[Título del Módulo]</h2>
        <button class="btn btn-primary" id="btn-nuevo-[recurso]">
            <i class="fas fa-plus"></i> Nuevo
        </button>
    </div>
    
    <!-- Filtros -->
    <div class="row mb-3">
        <div class="col-md-6">
            <input type="text" class="form-control" placeholder="Buscar...">
        </div>
    </div>
    
    <!-- Tabla/Cards -->
    <div id="[recurso]-container">
        <!-- Contenido dinámico -->
    </div>
</div>
```

---

## 📚 Referencias y Ejemplos

### Módulos Completos como Referencia
- ✅ `public/js/modules/cuotas/cuotas.js` - Excelente ejemplo
- ✅ `public/js/modules/gastos/gastos.js` - CRUD completo
- ✅ `public/js/modules/usuarios/usuarios.js` - Formularios avanzados

### Documentación Obligatoria
- ⭐⭐⭐ [BLACKBOX.md](../../BLACKBOX.md) - Estándares de código
- ⭐⭐ [INTEGRACIONES_PENDIENTES.md](../../docs/production/INTEGRACIONES_PENDIENTES.md) - Detalles del módulo
- ⭐ [CRUSH.md](../../CRUSH.md) - Setup local

---

## ✅ Definition of Done

### Código
- [ ] Código sigue estándares BLACKBOX.md
- [ ] Sin console.log en código final
- [ ] Nombres de variables en camelCase
- [ ] Funciones documentadas con comentarios
- [ ] Sin código duplicado

### Funcionalidad
- [ ] CRUD completo funcionando
- [ ] Validaciones frontend implementadas
- [ ] Manejo de errores robusto
- [ ] Loading states implementados
- [ ] Responsive design verificado

### Testing
- [ ] Probado en navegador (Chrome/Firefox)
- [ ] Probado responsive (mobile/tablet/desktop)
- [ ] Probado con datos reales
- [ ] Probado manejo de errores
- [ ] Verificado con rol ADMIN
- [ ] Verificado con rol INQUILINO (si aplica)

### Integración
- [ ] Integrado en navegación principal
- [ ] Permisos verificados
- [ ] No rompe otros módulos
- [ ] Backend responde correctamente

### Documentación
- [ ] Código comentado
- [ ] README actualizado (si aplica)
- [ ] Capturas de pantalla adjuntas

---

## 🧪 Testing Checklist

### Tests Manuales Obligatorios
```bash
# 1. Listar datos
- [ ] Carga inicial exitosa
- [ ] Datos se muestran correctamente
- [ ] Paginación funciona (si aplica)
- [ ] Filtros funcionan

# 2. Crear nuevo registro
- [ ] Formulario se abre
- [ ] Validaciones funcionan
- [ ] Creación exitosa
- [ ] Lista se actualiza
- [ ] Mensaje de éxito se muestra

# 3. Editar registro
- [ ] Formulario se pre-llena
- [ ] Actualización exitosa
- [ ] Cambios se reflejan

# 4. Eliminar registro
- [ ] Confirmación aparece
- [ ] Eliminación exitosa
- [ ] Lista se actualiza

# 5. Manejo de errores
- [ ] Error de red se maneja
- [ ] Error 400/500 se muestra
- [ ] Token inválido redirige a login
```

---

## 📦 Entregables

### Al completar, adjuntar:
1. **Screenshot del módulo funcionando**
2. **Video corto (1-2 min) demostrando CRUD** (opcional pero recomendado)
3. **Lista de archivos modificados/creados**
4. **Descripción de cambios realizados**

### Formato de Commit
```
feat(frontend): Completa módulo [NOMBRE]

- Implementa interfaz de lista con filtros
- Agrega formulario crear/editar con validaciones
- Integra con API backend
- Añade manejo de errores robusto
- Tests manuales completos

Closes #[ISSUE_NUMBER]
```

---

## 🔗 Enlaces Útiles

- [API Backend Documentation](../../docs/technical/PROJECT_SUMMARY.md)
- [Estándares de Código](../../BLACKBOX.md)
- [Setup Local](../../CRUSH.md)
- [Guía de Despliegue](../../docs/GUIA_DESPLIEGUE.md)

---

## 💬 Notas Adicionales

[Cualquier nota adicional, consideración especial, o contexto importante]

---

## 🚨 Bloqueos o Dudas

Si encuentras bloqueos:
1. Verificar que backend funciona: `curl http://localhost:3000/api/[recurso]`
2. Revisar logs: `npm run dev`
3. Consultar módulos de referencia
4. Comentar en este issue

---

**Agente:** Por favor confirma que has leído y entendido los requisitos antes de comenzar.  
**Tiempo esperado:** [X-Y] horas  
**Deadline sugerido:** [Fecha]
