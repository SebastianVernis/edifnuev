---
name: 🐛 Bug Fix
about: Template para reportar y asignar corrección de bugs
title: '[BUG] Breve descripción del bug'
labels: bug, agente-remoto
assignees: ''
---

## 🐛 Descripción del Bug

[Descripción clara y concisa del problema]

---

## 📍 Ubicación

**Módulo afectado:** [Nombre del módulo]  
**Archivo(s):** `[ruta/al/archivo.js]`  
**Función/Método:** `[nombreFuncion()]`  
**Línea aproximada:** [Número de línea]

---

## 🔄 Pasos para Reproducir

1. [Primer paso]
2. [Segundo paso]
3. [Tercer paso]
4. [Ver error]

---

## 🎯 Comportamiento Esperado

[Qué debería pasar]

---

## 💥 Comportamiento Actual

[Qué está pasando]

---

## 📸 Screenshots/Logs

<details>
<summary>Screenshot del error</summary>

[Adjuntar imagen o video]

</details>

<details>
<summary>Logs de consola</summary>

```
[Pegar logs aquí]
```

</details>

<details>
<summary>Error del servidor</summary>

```
[Pegar error del servidor si aplica]
```

</details>

---

## 🔍 Análisis Inicial

### Posible Causa
[Hipótesis de qué está causando el bug]

### Archivos Relacionados
- `[archivo1.js]` - [Razón]
- `[archivo2.js]` - [Razón]

---

## ✅ Solución Propuesta

[Descripción de cómo se debería arreglar]

### Cambios Necesarios
- [ ] Modificar `[archivo.js]` línea [X]
- [ ] Actualizar validación en `[otro.js]`
- [ ] Agregar tests para este caso

---

## 🧪 Testing del Fix

### Tests Manuales Requeridos
- [ ] Reproducir bug original (debe fallar antes del fix)
- [ ] Aplicar fix
- [ ] Verificar que bug está resuelto
- [ ] Verificar que no se rompió nada más
- [ ] Probar casos edge relacionados

### Tests Automatizados (si aplica)
```javascript
// tests/[modulo].test.js
test('debe [comportamiento correcto]', async () => {
    // Test que falla antes del fix y pasa después
});
```

---

## 🔒 Impacto y Severidad

**Severidad:** 🔴 Crítica / 🟡 Media / 🟢 Baja  
**Impacto:** [Qué funcionalidad está afectada]  
**Usuarios afectados:** [Todos / Solo ADMIN / Solo INQUILINOS / etc]  
**Workaround disponible:** [SI/NO] - [Descripción si existe]

---

## 📋 Environment

- **Browser:** [Chrome/Firefox/Safari] [Versión]
- **OS:** [Windows/Mac/Linux]
- **Node Version:** [Versión]
- **Branch:** [Nombre del branch]
- **Commit:** [Hash del commit si relevante]

---

## ✅ Definition of Done

- [ ] Bug reproducido y entendido
- [ ] Fix implementado
- [ ] Código sigue estándares BLACKBOX.md
- [ ] Tests manuales completados
- [ ] No se rompió funcionalidad existente
- [ ] Logs/console.error removidos
- [ ] Commit message descriptivo

---

## 📦 Entregables

1. **Fix aplicado** con código limpio
2. **Screenshots** de antes/después
3. **Descripción** de qué se cambió y por qué

### Formato de Commit
```
fix([modulo]): [Descripción del fix]

- Corrige [problema específico]
- Agrega validación para [caso]
- Actualiza [componente afectado]

Fixes #[ISSUE_NUMBER]
```

---

## 🔗 Issues Relacionados

- Relacionado con #[NUMERO]
- Duplicado de #[NUMERO] (si aplica)
- Bloqueado por #[NUMERO] (si aplica)

---

**Prioridad:** [Alta/Media/Baja]  
**Agente asignado:** [Nombre]  
**Estimación:** [X] horas
