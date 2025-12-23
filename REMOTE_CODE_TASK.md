# 🤖 Tarea Multi-Agente: Testing E2E Completo SmartBuilding SaaS

**Tipo:** Multi-Agent Task  
**Agentes:** Blackbox Pro, Claude Code, Gemini Pro  
**Modo:** Parallel Execution con AI Judge  
**Repositorio:** https://github.com/SebastianVernis/edifnuev  
**Branch:** master

---

## 🎯 Objetivo Principal

Ejecutar **testing E2E completo** del sistema SmartBuilding SaaS con validación de:
- ✅ Todas las APIs funcionando correctamente
- ✅ Flujo de onboarding completo (registro → login → admin panel)
- ✅ CRUD de todos los módulos (Usuarios, Cuotas, Gastos, Fondos, Cierres, Anuncios)
- ✅ Multitenancy correctamente implementado (aislamiento por `building_id`)
- ✅ Seguridad: JWT, RBAC, validaciones

---

## 📋 Descripción de la Tarea

### **Contexto del Proyecto**

Sistema SaaS de administración de edificios desplegado en **Cloudflare Workers + Pages**:
- Backend API: Workers (Node.js compatible runtime)
- Frontend: Cloudflare Pages
- Base de datos: JSON temporal (migración a D1 pendiente)
- Infraestructura anterior: PM2 (detenida)

**Estado actual:**
- ✅ Sistema funcional en producción
- ✅ Multitenancy parcial implementado (JWT con `building_id`)
- ⚠️ Falta validación E2E exhaustiva
- ⚠️ Documentación de testing incompleta

### **Tareas Específicas para los Agentes**

#### **1. Testing Automatizado de APIs (Prioridad Alta)**

Crear suite de tests automatizados que valide **todos los endpoints**:

**Módulos a testear:**
- Auth: Login, JWT validation, refresh token
- Usuarios: CRUD completo + permisos RBAC
- Cuotas: Generar masivo (50 cuotas), CRUD, stats, vencimientos
- Gastos: CRUD + upload de comprobantes
- Fondos: CRUD + transferencias + patrimonio
- Cierres: Generar PDF + ZIP de comprobantes + cron
- Anuncios: CRUD + filtros por prioridad
- Onboarding: Registro → OTP → Checkout → Setup

**Framework sugerido:** Playwright, Jest, o Supertest

**Criterios de validación:**
- ✅ Status codes correctos (200, 201, 400, 401, 403, 404)
- ✅ Response structure: `{ ok: boolean, data?, msg?, error? }`
- ✅ Datos correctos en responses
- ✅ Multitenancy: usuarios solo ven datos de su `building_id`
- ✅ RBAC: ADMIN vs INQUILINO permissions

**Entregables:**
- `tests/e2e/api-complete.test.js` - Suite de tests
- `TEST_RESULTS.md` - Reporte con resultados detallados
- `screenshots/` - Evidencia visual (opcional)

---

#### **2. Validación de Multitenancy (Prioridad Crítica)**

**Problema a validar:**
Los handlers actualmente **NO filtran** por `building_id` correctamente, permitiendo potencial data leakage entre edificios.

**Archivos críticos:**
- `src/handlers/gastos.js`
- `src/handlers/fondos.js`
- `src/handlers/anuncios.js`
- `src/handlers/cierres.js`
- `src/handlers/usuarios.js`
- `src/handlers/presupuestos.js`

**Validaciones requeridas:**
1. Crear 2 buildings de prueba (Building A, Building B)
2. Crear datos en cada uno (gastos, fondos, cuotas)
3. Login como usuario de Building A
4. Validar que NO ve datos de Building B
5. Repetir con Building B

**Test específico:**
```javascript
test('Multitenancy isolation', async () => {
  // Building A
  const tokenA = await loginAs('user-building-a@test.com');
  const gastosA = await fetch('/api/gastos', { headers: { Authorization: `Bearer ${tokenA}` } });
  expect(gastosA.data.every(g => g.building_id === 'building-a-id')).toBe(true);
  
  // Building B
  const tokenB = await loginAs('user-building-b@test.com');
  const gastosB = await fetch('/api/gastos', { headers: { Authorization: `Bearer ${tokenB}` } });
  expect(gastosB.data.every(g => g.building_id === 'building-b-id')).toBe(true);
  
  // Sin data leaks
  expect(gastosA.data.some(g => g.building_id === 'building-b-id')).toBe(false);
});
```

**Entregables:**
- `MULTITENANCY_VALIDATION_REPORT.md` - Resultados de pruebas
- Lista de handlers corregidos (si aplica)
- Proof of isolation: logs o screenshots

---

#### **3. Documentación de Testing Completa**

Actualizar/crear documentación exhaustiva:

**Archivos a generar:**
- `docs/TESTING_GUIDE.md` - Guía completa de testing
- `docs/API_TESTING.md` - Documentación de cada endpoint testeado
- `docs/MULTITENANCY_SECURITY.md` - Validaciones de seguridad
- `docs/E2E_MANUAL.md` - Guía para testing manual UI

**Contenido mínimo:**
- Setup de entorno de testing
- Usuarios demo con credenciales
- Comandos para ejecutar tests (`npm run test:e2e`)
- Casos de prueba con expected results
- Troubleshooting común
- Checklist de validación completa

---

#### **4. Validación de Seguridad**

**Tests de seguridad a ejecutar:**

```javascript
// S1: JWT Validation
test('Reject expired tokens', async () => {
  const expiredToken = 'expired.jwt.token';
  const res = await fetch('/api/cuotas', { headers: { Authorization: `Bearer ${expiredToken}` } });
  expect(res.status).toBe(401);
});

// S2: RBAC Enforcement
test('Inquilino cannot create gastos', async () => {
  const inquilinoToken = await loginAs('inquilino@test.com');
  const res = await fetch('/api/gastos', {
    method: 'POST',
    headers: { Authorization: `Bearer ${inquilinoToken}` },
    body: JSON.stringify({ concepto: 'test', monto: 100 })
  });
  expect(res.status).toBe(403);
});

// S3: SQL Injection Protection
test('Sanitize malicious inputs', async () => {
  const res = await fetch('/api/cuotas?departamento=101\' OR \'1\'=\'1');
  expect(res.status).not.toBe(500);
  expect(res.data).not.toContain('SQL'); // Sin exposición de errores SQL
});
```

**Entregables:**
- `SECURITY_AUDIT_REPORT.md` - Resultados de tests de seguridad
- Lista de vulnerabilidades encontradas (si aplica)
- Recomendaciones de hardening

---

## 📚 Documentación de Referencia

### **Archivos clave del proyecto:**
- `TESTING_E2E.md` - Documentación base de testing (ya existe)
- `data.json` - Base de datos actual con usuarios demo
- `src/handlers/*.js` - Handlers de API a validar
- `src/middleware/auth.js` - Autenticación JWT
- `src/middleware/multitenancy.js` - Helpers de multitenancy

### **Usuarios demo disponibles:**
- Admin: `admin@edificio205.com / Gemelo1`
- Inquilino 101: `maria.garcia@edificio205.com / Gemelo1`
- Inquilino 102: `carlos.lopez@edificio205.com / Gemelo1`
- Inquilino 201: `ana.martinez@edificio205.com / Gemelo1`
- Inquilino 202: `roberto.silva@edificio205.com / Gemelo1`

### **Workers URL (producción):**
```
https://edificio-admin-saas-adapted.sebastianvernis.workers.dev
```

---

## 🔧 Configuración de Agentes

### **Agent 1: Blackbox Pro**
**Fortalezas:** Testing automatizado, scripts Node.js, validación de APIs  
**Tarea asignada:** Testing de APIs + Suite automatizada

### **Agent 2: Claude Code**
**Fortalezas:** Code review, documentación, análisis de seguridad  
**Tarea asignada:** Validación de multitenancy + Documentación

### **Agent 3: Gemini Pro**
**Fortalezas:** Análisis de código, detección de bugs, refactoring  
**Tarea asignada:** Tests de seguridad + Code quality review

---

## ✅ Criterios de Éxito

### **Aceptación de la tarea:**
- [ ] Suite de tests E2E ejecutada exitosamente (>90% passing)
- [ ] Multitenancy validado y documentado
- [ ] 0 vulnerabilidades críticas encontradas
- [ ] Documentación completa generada
- [ ] Reporte consolidado de los 3 agentes

### **Entregables finales:**
1. **Código:**
   - `tests/e2e/` - Suite completa de tests
   - `tests/security/` - Tests de seguridad
   - Fixes aplicados (si se encuentran bugs)

2. **Documentación:**
   - `TESTING_GUIDE.md`
   - `MULTITENANCY_VALIDATION_REPORT.md`
   - `SECURITY_AUDIT_REPORT.md`
   - `TEST_RESULTS.md` (consolidado de los 3 agentes)

3. **Pull Request:**
   - Branch: `feature/complete-e2e-testing`
   - Descripción detallada de cambios
   - Screenshots de evidencia
   - AI Judge selection (mejor implementación)

---

## 🚀 Instrucciones de Ejecución

### **Paso 1: Preparación del entorno**
```bash
cd /home/admin/edifnuev
git checkout master
git pull origin master
npm install
```

### **Paso 2: Configurar variables de entorno**
```bash
# .dev.vars (ya existe)
ENVIRONMENT=development
SKIP_OTP_VALIDATION=true
JWT_SECRET=your-secret-key
```

### **Paso 3: Ejecutar tests localmente (opcional)**
```bash
# Wrangler dev (Workers local)
wrangler dev

# En otra terminal
npm run test:e2e
```

### **Paso 4: Ejecutar en producción**
```bash
# Tests apuntan a Workers URL directamente
API_URL=https://edificio-admin-saas-adapted.sebastianvernis.workers.dev npm run test:e2e
```

---

## 📊 Métricas Esperadas

### **Coverage:**
- API Endpoints: 100% (44 endpoints)
- Handlers: 100% (6 módulos)
- Seguridad: 80% (JWT, RBAC, sanitization)

### **Performance:**
- Response time < 200ms (Workers)
- Suite de tests < 5 minutos
- 0 timeouts

### **Quality:**
- Tests passing: >90%
- Code coverage: >70%
- Security score: A+

---

## 🎯 Notas Importantes

1. **Multitenancy es crítico:** Este es un SaaS multi-tenant, el aislamiento de datos es la prioridad #1
2. **No modificar data.json:** Usar datos de prueba temporales o endpoints de creación
3. **Workers limitations:** Sin filesystem, usar D1 o KV para persistencia (pendiente)
4. **JWT secret:** Usar el del `.dev.vars` para consistencia
5. **Rate limiting:** Workers tienen límites, espaciar requests si es necesario

---

## 📝 Template de Reporte Final

```markdown
# Multi-Agent Testing Report - SmartBuilding SaaS

## Executive Summary
- Total tests executed: X
- Passing: X (X%)
- Failing: X (X%)
- Critical issues found: X
- Recommendations: X

## Agent Performance
### Blackbox Pro
- Tests created: X
- Coverage: X%
- Time: X minutes

### Claude Code
- Documentation quality: A+
- Multitenancy validation: ✅/❌
- Code review notes: ...

### Gemini Pro
- Security tests: X
- Vulnerabilities found: X
- Code quality score: X/10

## AI Judge Decision
**Selected implementation:** [Agent Name]
**Reasoning:** [Why this implementation was chosen]

## Next Steps
- [ ] Fix failing tests
- [ ] Implement recommendations
- [ ] Deploy to production
```

---

**Tiempo estimado:** 45-60 minutos por agente (paralelo)  
**Prioridad:** 🔴 Crítica  
**Bloqueadores:** Ninguno (sistema funcional)  
**Ready to execute:** ✅
