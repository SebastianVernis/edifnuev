---
name: ♻️ Refactorización
about: Template para mejoras de código, performance u optimización
title: '[REFACTOR] Área a refactorizar'
labels: refactor, enhancement, agente-remoto
assignees: ''
---

## ♻️ Objetivo de la Refactorización

[Descripción clara de qué se quiere mejorar y por qué]

---

## 📍 Código Actual

**Módulo:** [Nombre del módulo]  
**Archivos afectados:**
- `[ruta/archivo1.js]`
- `[ruta/archivo2.js]`

### Problema Actual
[Qué está mal con el código actual]

- ⚠️ [Problema 1]
- ⚠️ [Problema 2]
- ⚠️ [Problema 3]

<details>
<summary>Código actual (ejemplo)</summary>

```javascript
// Código problemático actual
```

</details>

---

## 🎯 Objetivos

- [ ] Mejorar legibilidad
- [ ] Reducir complejidad
- [ ] Eliminar duplicación
- [ ] Mejorar performance
- [ ] Seguir estándares BLACKBOX.md
- [ ] Otro: [Especificar]

---

## 💡 Solución Propuesta

### Cambios Principales
1. [Cambio 1]
2. [Cambio 2]
3. [Cambio 3]

<details>
<summary>Código propuesto (ejemplo)</summary>

```javascript
// Código mejorado propuesto
```

</details>

### Beneficios
- ✅ [Beneficio 1]
- ✅ [Beneficio 2]
- ✅ [Beneficio 3]

---

## 📋 Plan de Refactorización

### Fase 1: Análisis
- [ ] Identificar todas las dependencias
- [ ] Listar archivos a modificar
- [ ] Identificar riesgos
- [ ] Crear backup del código actual

### Fase 2: Implementación
- [ ] Refactorizar [componente 1]
- [ ] Refactorizar [componente 2]
- [ ] Actualizar imports/exports
- [ ] Actualizar tests

### Fase 3: Validación
- [ ] Tests existentes siguen pasando
- [ ] Tests nuevos si es necesario
- [ ] Testing manual completo
- [ ] Performance benchmark (si aplica)

---

## 🧪 Testing

### Tests de Regresión
```bash
# OBLIGATORIO: Todos los tests deben pasar
npm run test
npm run test:[modulo]
```

### Tests Manuales
- [ ] Verificar que funcionalidad NO cambia
- [ ] Probar casos edge
- [ ] Verificar performance (si aplica)

### Benchmark (si aplica)
```javascript
// Antes del refactor
// Tiempo: [X]ms

// Después del refactor  
// Tiempo: [Y]ms
// Mejora: [Z]%
```

---

## ⚠️ Riesgos

**Impacto:** 🔴 Alto / 🟡 Medio / 🟢 Bajo

### Posibles Problemas
- ⚠️ [Riesgo 1]
- ⚠️ [Riesgo 2]

### Plan de Mitigación
- [Cómo mitigar riesgo 1]
- [Cómo mitigar riesgo 2]

### Rollback Plan
[Cómo revertir si algo sale mal]

---

## 📊 Métricas

### Antes
- Líneas de código: [X]
- Complejidad ciclomática: [Y]
- Duplicación: [Z]%
- Performance: [Métrica]

### Después (Objetivo)
- Líneas de código: [X] → [A] (reducción de [B]%)
- Complejidad ciclomática: [Y] → [C]
- Duplicación: [Z]% → [D]%
- Performance: [Métrica] → [Mejora]

---

## ✅ Definition of Done

### Código
- [ ] Refactor completado según plan
- [ ] Código sigue estándares BLACKBOX.md
- [ ] Sin código duplicado
- [ ] Nombres descriptivos
- [ ] Comentarios donde necesario

### Testing
- [ ] Todos los tests existentes pasan
- [ ] Tests nuevos agregados (si aplica)
- [ ] Testing manual completo
- [ ] No hay regresiones

### Documentación
- [ ] Comentarios de código actualizados
- [ ] README actualizado (si aplica)
- [ ] CHANGELOG actualizado

### Performance
- [ ] Performance igual o mejor
- [ ] Sin memory leaks
- [ ] Bundle size igual o menor (frontend)

---

## 📦 Entregables

1. **Código refactorizado**
2. **Tests actualizados** (si aplica)
3. **Documentación** de cambios importantes
4. **Comparativa** antes/después (métricas)

### Formato de Commit
```
refactor([modulo]): [Descripción del refactor]

- Extrae lógica duplicada a [función/componente]
- Simplifica [componente] reduciendo complejidad
- Mejora naming de variables/funciones
- Optimiza [operación] en [X]%

Closes #[ISSUE_NUMBER]
```

---

## 🔗 Referencias

- Documentación relacionada: [Links]
- Issues relacionados: #[NUMERO]
- PRs relacionados: #[NUMERO]

---

## 💬 Notas

[Consideraciones adicionales, contexto histórico, o justificación detallada]

---

**Prioridad:** [Alta/Media/Baja]  
**Agente asignado:** [Nombre]  
**Estimación:** [X-Y] horas  
**Puede esperar a siguiente sprint:** [SI/NO]
