# 📋 Issues para Sprint 1 - Módulos Críticos

**Sprint:** Sprint 1 - Funcionalidades Contables  
**Duración:** 2 semanas  
**Objetivo:** Completar Presupuestos y Cierres Contables  
**Estado:** 🔴 Pendiente de creación de issues

---

## 🎯 Issues a Crear en GitHub

### 1. Issue: Presupuestos Frontend 🔴 CRÍTICO

**Template:** `1-modulo-frontend.md`  
**Título:** `[FRONTEND] Módulo: Presupuestos`  
**Labels:** `frontend`, `enhancement`, `agente-remoto`, `sprint-1`, `prioridad-alta`  
**Estimación:** 8-10 horas  
**Milestone:** Sprint 1 - Funcionalidades Contables

**Descripción breve:**
Completar frontend del módulo de presupuestos. Backend está 100% completo. Necesita:
- Interfaz de lista con filtros
- Formulario crear/editar
- Vista de ejecución presupuestaria
- Gráficos (Chart.js)
- Alertas de límites
- Exportación PDF/Excel

**Backend Ready:**
- ✅ `src/controllers/presupuestos.controller.js`
- ✅ `src/routes/presupuestos.routes.js`
- ✅ `src/models/Presupuesto.js`

**Archivo a completar:**
- ⚠️ `public/js/modules/presupuestos/presupuestos.js` (existe pero básico)

**Referencia:** Módulo de Gastos (`public/js/modules/gastos/gastos.js`)

---

### 2. Issue: Cierres Contables Frontend 🔴 CRÍTICO

**Template:** `1-modulo-frontend.md`  
**Título:** `[FRONTEND] Módulo: Cierres Contables`  
**Labels:** `frontend`, `enhancement`, `agente-remoto`, `sprint-1`, `prioridad-alta`  
**Estimación:** 6-8 horas  
**Milestone:** Sprint 1 - Funcionalidades Contables

**Descripción breve:**
Completar frontend del módulo de cierres contables. Backend robusto implementado. Necesita:
- Interfaz de lista de cierres
- Formulario generar cierre con validaciones
- Resumen financiero del período
- Gráficos comparativos
- Exportación a PDF
- Vista detallada de cierre

**Backend Ready:**
- ✅ `src/controllers/cierres.controller.js`
- ✅ `src/routes/cierres.routes.js`
- ✅ `src/models/Cierre.js`

**Archivos a completar:**
- ⚠️ `public/js/modules/cierres/cierres-init.js` (estructura básica)
- ⚠️ `public/js/modules/cierres/cierres-enhanced.js` (parcial)

**Referencia:** Módulo de Cuotas (`public/js/modules/cuotas/cuotas.js`)

---

### 3. Issue: Integración SendGrid (Email) 🔴 CRÍTICO

**Template:** `2-integracion-externa.md`  
**Título:** `[INTEGRATION] Servicio: SendGrid Email`  
**Labels:** `integration`, `enhancement`, `agente-remoto`, `sprint-1`, `prioridad-alta`  
**Estimación:** 4-6 horas  
**Milestone:** Sprint 1 - Funcionalidades Contables

**Descripción breve:**
Integrar SendGrid para envío de emails transaccionales:
- Recordatorios de pago (7 días antes, día vencimiento)
- Notificaciones de anuncios importantes
- Confirmación de solicitudes
- Email de bienvenida

**Tareas:**
- Crear servicio `src/services/emailService.js`
- Templates de emails
- Integración en controllers relevantes
- Testing

**Proveedor:** SendGrid (Free tier: 100 emails/día)

---

## 🟡 Issues Opcionales (Si hay tiempo)

### 4. Issue: Anuncios Frontend 🟡 MEDIA

**Template:** `1-modulo-frontend.md`  
**Título:** `[FRONTEND] Módulo: Anuncios`  
**Labels:** `frontend`, `enhancement`, `agente-remoto`, `sprint-1`, `prioridad-media`  
**Estimación:** 5-7 horas  
**Milestone:** Sprint 1 - Funcionalidades Contables (Opcional)

**Descripción breve:**
Completar módulo de anuncios. Backend completo + upload de imágenes. Necesita:
- Interfaz de lista (admin)
- Formulario crear/editar con WYSIWYG
- Vista inquilino con notificaciones
- Sistema de "no leídos"

---

### 5. Issue: Migrar Storage a Cloudflare R2 🟡 MEDIA

**Template:** `2-integracion-externa.md`  
**Título:** `[INTEGRATION] Servicio: Cloudflare R2 Storage`  
**Labels:** `integration`, `enhancement`, `agente-remoto`, `sprint-1`, `prioridad-media`  
**Estimación:** 4-6 horas  
**Milestone:** Sprint 1 - Funcionalidades Contables (Opcional)

**Descripción breve:**
Migrar upload de archivos desde local storage a Cloudflare R2.
Actualmente funciona con Multer local, necesita migración a cloud.

---

## 📊 Comando para Crear Issues

```bash
# Usar GitHub CLI para crear issues rápidamente
gh issue create --template 1-modulo-frontend.md \
  --title "[FRONTEND] Módulo: Presupuestos" \
  --label "frontend,enhancement,agente-remoto,sprint-1,prioridad-alta" \
  --milestone "Sprint 1"

gh issue create --template 1-modulo-frontend.md \
  --title "[FRONTEND] Módulo: Cierres Contables" \
  --label "frontend,enhancement,agente-remoto,sprint-1,prioridad-alta" \
  --milestone "Sprint 1"

gh issue create --template 2-integracion-externa.md \
  --title "[INTEGRATION] Servicio: SendGrid Email" \
  --label "integration,enhancement,agente-remoto,sprint-1,prioridad-alta" \
  --milestone "Sprint 1"
```

---

## 🎯 Sprint Goals

**Mínimo Viable (MUST):**
- ✅ Presupuestos frontend completo
- ✅ Cierres contables frontend completo

**Deseado (SHOULD):**
- ✅ Integración email SendGrid
- ✅ Anuncios frontend completo

**Opcional (COULD):**
- ⚠️ Migración storage a R2

**Criterio de Éxito:**
- 2 módulos críticos funcionando al 100%
- Sistema contable robusto
- Tests pasando
- Documentación actualizada

---

**Fecha de Creación:** 12/12/2025  
**Sprint Start:** [Por definir]  
**Sprint End:** [Por definir]
