# 🤖 Guía para Agentes Remotos - Edificio Admin

**Fecha:** 12 de Diciembre, 2025  
**Proyecto:** Sistema de Administración de Edificios  
**Para:** Agentes remotos y colaboradores externos

---

## 🎯 Bienvenido

Esta guía te ayudará a trabajar eficientemente en el proyecto Edificio Admin usando issues estructurados en GitHub.

---

## 📋 Tipos de Issues

Tenemos 4 tipos de templates para diferentes tareas:

### 1. 🎨 Desarrollo de Módulo Frontend
**Cuándo usar:** Para completar o crear módulos completos del frontend

**Qué incluye:**
- Backend APIs ya disponibles
- Especificaciones técnicas detalladas
- Ejemplos de código
- Checklist completo
- Referencias a módulos existentes

**Estimación típica:** 5-10 horas

### 2. 🔌 Integración Externa
**Cuándo usar:** Para integrar servicios externos (Email, SMS, Storage, etc)

**Qué incluye:**
- Proveedores sugeridos
- Especificación técnica completa
- Configuración de seguridad
- Tests requeridos
- Casos de uso específicos

**Estimación típica:** 4-8 horas

### 3. 🐛 Bug Fix
**Cuándo usar:** Para corregir bugs reportados

**Qué incluye:**
- Descripción del problema
- Pasos para reproducir
- Solución propuesta
- Testing requerido

**Estimación típica:** 1-4 horas

### 4. ♻️ Refactorización
**Cuándo usar:** Para mejorar código existente sin cambiar funcionalidad

**Qué incluye:**
- Análisis del problema
- Solución propuesta
- Plan de mitigación de riesgos
- Métricas antes/después

**Estimación típica:** 3-6 horas

---

## 🚀 Flujo de Trabajo

### Paso 1: Recibir Asignación
1. Se te asignará un issue con template completo
2. **Lee TODO el issue** antes de comenzar
3. Confirma que entiendes los requisitos
4. Pregunta dudas en comentarios del issue

### Paso 2: Setup Local
```bash
# 1. Clonar repositorio (si es primera vez)
git clone https://github.com/SebastianVernisMora/edificio-admin.git
cd edificio-admin

# 2. Instalar dependencias
npm install

# 3. Configurar .env
cp .env.example .env
# Editar .env con valores correctos

# 4. Iniciar servidor
./start-local.sh
# O alternativamente:
npm run dev

# 5. Verificar que funciona
# Abrir: http://localhost:3000
# Login: admin@edificio205.com / Gemelo1
```

### Paso 3: Crear Branch
```bash
# Nomenclatura de branches
git checkout -b feature/[nombre-modulo]     # Para features
git checkout -b fix/[nombre-bug]            # Para bugs
git checkout -b refactor/[nombre-area]      # Para refactors
git checkout -b integration/[nombre-servicio] # Para integraciones

# Ejemplo:
git checkout -b feature/presupuestos-frontend
```

### Paso 4: Desarrollo
1. **Leer estándares obligatorios:**
   - [BLACKBOX.md](../../BLACKBOX.md) - ⭐⭐⭐ CRÍTICO
   - [INTEGRACIONES_PENDIENTES.md](./INTEGRACIONES_PENDIENTES.md) - Para módulos

2. **Seguir el checklist del issue**
   - Marcar cada tarea al completarla
   - Comentar en el issue si hay bloqueos

3. **Commits frecuentes**
   ```bash
   git add .
   git commit -m "feat(modulo): Descripción del cambio"
   git push origin nombre-branch
   ```

### Paso 5: Testing
```bash
# OBLIGATORIO antes de crear PR
npm test                    # Todos los tests
npm run test:frontend       # Frontend específico
npm run test:integration    # Integración

# Testing manual
# 1. Probar en navegador
# 2. Verificar casos edge
# 3. Probar con diferentes roles (admin/inquilino)
```

### Paso 6: Pull Request
1. **Crear PR desde tu branch**
2. **Título del PR:**
   ```
   [TIPO] Descripción concisa
   
   Ejemplos:
   [FRONTEND] Completa módulo de Presupuestos
   [INTEGRATION] Integra SendGrid para emails
   [FIX] Corrige error en cálculo de cuotas
   [REFACTOR] Simplifica lógica de autenticación
   ```

3. **Descripción del PR:**
   - Qué se hizo
   - Cómo probarlo
   - Screenshots/videos
   - Referencia al issue: `Closes #[NUMERO]`

4. **Adjuntar evidencia:**
   - Screenshots del módulo funcionando
   - Video corto (1-2 min) si es feature grande
   - Logs de tests pasando

---

## 📚 Documentación Obligatoria

### Antes de Empezar (LEER)
1. **[BLACKBOX.md](../../BLACKBOX.md)** ⭐⭐⭐
   - Estándares de código
   - Convenciones obligatorias
   - Response format
   - Headers de auth

2. **[CRUSH.md](../../CRUSH.md)** ⭐⭐
   - Setup local rápido
   - Credenciales
   - Comandos útiles

3. **Issue asignado** ⭐⭐⭐
   - Leer completo
   - Seguir checklist
   - Usar ejemplos

### Durante Desarrollo (CONSULTAR)
4. **[INTEGRACIONES_PENDIENTES.md](./INTEGRACIONES_PENDIENTES.md)**
   - Detalles de módulos
   - Funcionalidades específicas
   - APIs disponibles

5. **Módulos de Referencia**
   - `public/js/modules/cuotas/cuotas.js` - CRUD completo
   - `public/js/modules/gastos/gastos.js` - Excelente ejemplo
   - `public/js/modules/usuarios/usuarios.js` - Formularios avanzados

---

## 🔧 Estándares Críticos

### 1. Response Format (OBLIGATORIO)
```javascript
// ✅ CORRECTO - ÚNICO formato permitido
const response = await fetch('/api/recurso');
const data = await response.json();

if (data.ok) {
    // Success
    console.log(data.data);
} else {
    mostrarError(data.msg);
}

// ❌ INCORRECTO - No usar
if (data.success) { ... }      // NO
if (!data.error) { ... }        // NO
if (data.status === 'ok') { ... } // NO
```

### 2. Headers de Autenticación (OBLIGATORIO)
```javascript
// ✅ ÚNICO header permitido
headers: {
    'Content-Type': 'application/json',
    'x-auth-token': token  // ÚNICO formato
}

// ❌ PROHIBIDO usar otros
'Authorization': `Bearer ${token}` // NO
'x-token': token                   // NO
'edificio-token': token            // NO
```

### 3. Naming Conventions (OBLIGATORIO)
```javascript
// ✅ Variables y funciones: camelCase
const usuarioActual = {};
const obtenerDatos = () => {};

// ✅ Clases: PascalCase
class Usuario {}
class CuotaController {}

// ✅ Archivos: camelCase con sufijo
authController.js     ✅
cuotasService.js      ✅
auth.controller.js    ❌ (evitar puntos extras)

// ✅ Rutas API: kebab-case
/api/auth/login           ✅
/api/cuotas-mensuales     ✅
```

### 4. Error Handling (OBLIGATORIO)
```javascript
// ✅ SIEMPRE usar try-catch
try {
    const resultado = await operacion();
    mostrarExito('Operación exitosa');
} catch (error) {
    console.error('Error en operación:', error);
    mostrarError('Error al realizar operación');
}

// ❌ NUNCA dejar sin try-catch
await operacion(); // PELIGROSO - puede romper la app
```

---

## 🧪 Testing Obligatorio

### Antes de Crear PR
```bash
# 1. Ejecutar todos los tests
npm test

# 2. Verificar que no rompiste nada
npm run test:integration

# 3. Testing manual completo
# - Probar CRUD completo
# - Probar casos edge
# - Probar con diferentes roles
# - Probar manejo de errores
```

### Checklist de Testing Manual
- [ ] ✅ Funcionalidad principal funciona
- [ ] ✅ Formularios validan correctamente
- [ ] ✅ Errores se muestran al usuario
- [ ] ✅ Loading states funcionan
- [ ] ✅ Responsive (mobile/tablet/desktop)
- [ ] ✅ Funciona con rol ADMIN
- [ ] ✅ Funciona con rol INQUILINO (si aplica)
- [ ] ✅ No hay console.errors en navegador
- [ ] ✅ No rompe otros módulos

---

## 🚨 Problemas Comunes

### Problema: "Token inválido o expirado"
**Solución:**
```javascript
// Verificar que usas el header correcto
headers: {
    'x-auth-token': localStorage.getItem('token')
}

// Verificar que el token existe
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/login.html';
    return;
}
```

### Problema: "Response format incorrecto"
**Solución:**
```javascript
// Backend debe retornar SIEMPRE
res.json({ ok: true, data: resultado });
// O
res.status(400).json({ ok: false, msg: 'Error' });

// Frontend debe verificar SIEMPRE
if (data.ok) {
    // Success
} else {
    console.error(data.msg);
}
```

### Problema: "CORS error"
**Solución:**
```javascript
// Verificar que el servidor está corriendo
// Verificar que usas http://localhost:3000
// NO uses 127.0.0.1:3000
```

### Problema: "Módulo no se muestra"
**Solución:**
```javascript
// 1. Verificar que el archivo está importado en HTML
<script src="/js/modules/[modulo]/[modulo].js"></script>

// 2. Verificar que inicializas el módulo
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('admin.html')) {
        inicializarModulo();
    }
});

// 3. Verificar permisos
const usuario = obtenerUsuarioActual();
if (usuario.rol !== 'ADMIN') {
    // Ocultar/deshabilitar
}
```

---

## 📊 Ejemplos de Código

### Ejemplo: Listar Datos
```javascript
async function cargarDatos() {
    try {
        const token = localStorage.getItem('token');
        
        // Loading state
        mostrarLoading(true);
        
        const response = await fetch('/api/recurso', {
            headers: {
                'x-auth-token': token
            }
        });
        
        const data = await response.json();
        
        if (data.ok) {
            renderizarTabla(data.data);
        } else {
            mostrarError(data.msg);
        }
        
    } catch (error) {
        console.error('Error al cargar datos:', error);
        mostrarError('Error al cargar datos');
    } finally {
        mostrarLoading(false);
    }
}
```

### Ejemplo: Crear Registro
```javascript
async function crear(datos) {
    try {
        const token = localStorage.getItem('token');
        
        // Validación
        if (!datos.campo) {
            mostrarError('Campo es requerido');
            return;
        }
        
        const response = await fetch('/api/recurso', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify(datos)
        });
        
        const data = await response.json();
        
        if (data.ok) {
            mostrarExito('Creado exitosamente');
            cerrarModal();
            cargarDatos(); // Recargar lista
        } else {
            mostrarError(data.msg);
        }
        
    } catch (error) {
        console.error('Error al crear:', error);
        mostrarError('Error al crear registro');
    }
}
```

---

## 🎯 Checklist Final Antes de PR

### Código
- [ ] Sigue BLACKBOX.md al 100%
- [ ] Sin console.log en código final
- [ ] Sin código comentado
- [ ] Nombres descriptivos
- [ ] Try-catch en todas las operaciones async

### Funcionalidad
- [ ] Feature/fix funciona completamente
- [ ] Tests manuales completos
- [ ] No rompe funcionalidad existente
- [ ] Responsive verificado

### Testing
- [ ] `npm test` pasa
- [ ] Testing manual documentado
- [ ] Screenshots adjuntos
- [ ] Video demo (opcional pero recomendado)

### Documentación
- [ ] Código comentado donde necesario
- [ ] Descripción clara en PR
- [ ] Issue referenciado con `Closes #[NUMERO]`

---

## 📞 Contacto y Soporte

### Si tienes dudas:
1. **Revisa la documentación** primero (BLACKBOX.md, CRUSH.md)
2. **Consulta módulos de referencia** (cuotas.js, gastos.js)
3. **Comenta en el issue** asignado
4. **Busca en issues cerrados** - puede que ya se resolvió

### No Hacer:
- ❌ No crear issues nuevos sin usar templates
- ❌ No commitear credenciales o API keys
- ❌ No hacer push a `main` directamente
- ❌ No ignorar el checklist del issue

---

## 🏆 Buenas Prácticas

### Commits
- Commits frecuentes y pequeños
- Mensajes descriptivos
- Usar prefijos: `feat:`, `fix:`, `refactor:`

### Comunicación
- Actualizar el issue con progreso
- Reportar bloqueos temprano
- Hacer preguntas específicas

### Código
- Menos es más - código simple y claro
- Reutilizar componentes existentes
- Seguir patrones del proyecto

---

## 📈 Sistema de Review

### Tu PR será revisado por:
1. **Estándares:** ¿Sigue BLACKBOX.md?
2. **Funcionalidad:** ¿Funciona correctamente?
3. **Tests:** ¿Pasan todos los tests?
4. **Calidad:** ¿Código limpio y mantenible?

### Aprobación
- ✅ PR aprobado → Merge a main
- 🔄 Cambios solicitados → Ajustar y actualizar
- ❌ PR rechazado → Explicación detallada

---

## 🎓 Recursos Adicionales

### Documentación Interna
- [BLACKBOX.md](../../BLACKBOX.md) - Estándares
- [CRUSH.md](../../CRUSH.md) - Setup
- [CHECKLIST_PRODUCCION.md](./CHECKLIST_PRODUCCION.md) - Estado
- [INTEGRACIONES_PENDIENTES.md](./INTEGRACIONES_PENDIENTES.md) - Detalles

### Herramientas
- Node.js v18+
- Git
- Editor de código (VS Code recomendado)
- Postman/Thunder Client (para testing APIs)

---

**¡Éxito en tu tarea!** 🚀

Si sigues esta guía y el template del issue, tu trabajo será eficiente y de alta calidad.

---

**Mantenido por:** BLACKBOX.AI Assistant  
**Última Actualización:** 12 de Diciembre, 2025  
**Versión:** 1.0
