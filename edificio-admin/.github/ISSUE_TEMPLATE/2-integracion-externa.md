---
name: 🔌 Integración Externa
about: Template para integrar servicios externos (Email, SMS, Storage, etc)
title: '[INTEGRATION] Servicio: [NOMBRE]'
labels: integration, enhancement, agente-remoto
assignees: ''
---

## 📋 Información de la Integración

**Servicio:** [Nombre del servicio - ej: SendGrid, AWS S3, Stripe]  
**Prioridad:** 🔴 Alta / 🟡 Media / 🟢 Baja  
**Estimación:** [X-Y] horas  
**Agente Asignado:** [Nombre del agente]  
**Tipo:** Email / SMS / Storage / Payment / Other

---

## 🎯 Objetivo

[Descripción clara de qué debe lograr esta integración y por qué es necesaria]

**Casos de uso:**
- [Caso de uso 1]
- [Caso de uso 2]
- [Caso de uso 3]

---

## 🔧 Proveedor Sugerido

### Opción Recomendada: [Proveedor]

**Razones:**
- ✅ [Ventaja 1]
- ✅ [Ventaja 2]
- ✅ [Ventaja 3]

**Limitaciones:**
- ⚠️ [Limitación 1]
- ⚠️ [Limitación 2]

**Pricing:**
- Free tier: [Detalles]
- Paid: [Detalles si aplica]

### Alternativas Consideradas
1. **[Alternativa 1]**
   - Pros: [...]
   - Contras: [...]

2. **[Alternativa 2]**
   - Pros: [...]
   - Contras: [...]

---

## 📁 Archivos a Crear/Modificar

### Backend
```
📄 src/services/[servicio]Service.js          # Nuevo servicio
📄 src/config/[servicio].js                   # Configuración
📄 src/middleware/[servicio]Middleware.js     # Si aplica
📄 .env                                        # Agregar variables
```

### Frontend (si aplica)
```
📄 public/js/utils/[servicio]Client.js        # Cliente frontend
```

### Documentación
```
📄 docs/integrations/[SERVICIO].md            # Guía de integración
```

---

## 🔨 Tareas de Implementación

### Fase 1: Setup y Configuración
- [ ] Crear cuenta en [proveedor]
- [ ] Obtener API keys / credentials
- [ ] Agregar variables a `.env.example`
- [ ] Agregar variables a `.env` (local)
- [ ] Documentar credenciales en issue privado

### Fase 2: Desarrollo Backend
- [ ] Crear servicio base en `src/services/[servicio]Service.js`
- [ ] Implementar métodos principales
- [ ] Agregar validaciones de entrada
- [ ] Implementar error handling robusto
- [ ] Agregar logs de auditoría
- [ ] Testing básico con Postman/curl

### Fase 3: Integración con Sistema
- [ ] Integrar en controllers existentes
- [ ] Agregar middleware si necesario
- [ ] Crear endpoints nuevos si aplica
- [ ] Actualizar modelos de datos (si necesario)

### Fase 4: Frontend (si aplica)
- [ ] Crear cliente frontend
- [ ] Integrar en componentes existentes
- [ ] Agregar UI para configuración (si aplica)
- [ ] Feedback visual al usuario

### Fase 5: Testing
- [ ] Tests unitarios del servicio
- [ ] Tests de integración
- [ ] Testing manual de casos de uso
- [ ] Testing de manejo de errores
- [ ] Testing con rate limits

### Fase 6: Documentación
- [ ] Documentar API keys requeridas
- [ ] Documentar configuración
- [ ] Ejemplos de uso
- [ ] Troubleshooting común

---

## 📊 Especificación Técnica

### Variables de Entorno Requeridas
```bash
# .env.example
[SERVICIO]_API_KEY=your_api_key_here
[SERVICIO]_API_SECRET=your_secret_here
[SERVICIO]_ENDPOINT=https://api.[servicio].com
[SERVICIO]_ENABLED=true
```

### Estructura del Servicio
```javascript
// src/services/[servicio]Service.js

import { config } from '../config/[servicio].js';

class [Servicio]Service {
    constructor() {
        this.apiKey = process.env.[SERVICIO]_API_KEY;
        this.enabled = process.env.[SERVICIO]_ENABLED === 'true';
        
        if (!this.apiKey && this.enabled) {
            console.warn('[Servicio] no configurado correctamente');
        }
    }
    
    /**
     * [Método principal]
     * @param {Object} params - Parámetros
     * @returns {Promise<Object>} Resultado
     */
    async [metodo](params) {
        try {
            if (!this.enabled) {
                console.log('[Servicio] deshabilitado - modo desarrollo');
                return { ok: true, mock: true };
            }
            
            // Validaciones
            if (!params.campo) {
                throw new Error('Campo requerido');
            }
            
            // Llamada al servicio
            const resultado = await this._llamadaAPI(params);
            
            // Log de auditoría
            await this._logAuditoria(params, resultado);
            
            return { ok: true, data: resultado };
            
        } catch (error) {
            console.error(`Error en [Servicio].[metodo]:`, error);
            throw error;
        }
    }
    
    async _llamadaAPI(params) {
        // Implementación específica
    }
    
    async _logAuditoria(params, resultado) {
        // Log para auditoría
    }
}

export default new [Servicio]Service();
```

### Integración en Controller
```javascript
// src/controllers/[existente].controller.js

import [servicio]Service from '../services/[servicio]Service.js';

export const [accion] = async (req, res) => {
    try {
        const { campo1, campo2 } = req.body;
        
        // Lógica de negocio existente
        // ...
        
        // Llamar al servicio externo
        const resultado = await [servicio]Service.[metodo]({
            campo1,
            campo2
        });
        
        if (!resultado.ok && !resultado.mock) {
            return res.status(500).json({
                ok: false,
                msg: 'Error al integrar con [servicio]'
            });
        }
        
        res.json({ ok: true, data: resultado });
        
    } catch (error) {
        console.error('Error en [accion]:', error);
        res.status(500).json({ ok: false, msg: 'Error interno del servidor' });
    }
};
```

---

## 🔒 Seguridad

### Checklist de Seguridad
- [ ] API keys en variables de entorno (NO en código)
- [ ] Validación de inputs antes de enviar
- [ ] Rate limiting implementado
- [ ] Timeout configurado en requests
- [ ] Manejo de errores sin exponer detalles internos
- [ ] Logs no contienen datos sensibles
- [ ] HTTPS en todas las llamadas
- [ ] Rotación de keys documentada

### Variables Sensibles
```bash
# NUNCA commitear estas en .env
# Solo en .env.example como placeholder
```

---

## 🧪 Testing

### Tests Unitarios
```javascript
// tests/services/[servicio].test.js

describe('[Servicio]Service', () => {
    test('debe [acción exitosa]', async () => {
        const resultado = await [servicio]Service.[metodo]({...});
        expect(resultado.ok).toBe(true);
    });
    
    test('debe manejar error cuando [caso error]', async () => {
        await expect(
            [servicio]Service.[metodo]({})
        ).rejects.toThrow();
    });
    
    test('debe funcionar en modo mock cuando disabled', async () => {
        process.env.[SERVICIO]_ENABLED = 'false';
        const resultado = await [servicio]Service.[metodo]({...});
        expect(resultado.mock).toBe(true);
    });
});
```

### Tests Manuales
```bash
# 1. Test básico de conexión
curl -X POST http://localhost:3000/api/test/[servicio] \
  -H "x-auth-token: [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# 2. Test con datos reales
[Comando específico]

# 3. Test de error handling
[Comando que debe fallar]
```

---

## 📚 Casos de Uso Específicos

### Caso de Uso 1: [Nombre]
**Trigger:** [Cuándo se ejecuta]  
**Acción:** [Qué hace el servicio]  
**Resultado esperado:** [Qué debe pasar]

**Flujo:**
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

**Código de ejemplo:**
```javascript
// Ejemplo de uso
```

### Caso de Uso 2: [Nombre]
[Repetir estructura]

---

## 📊 Monitoreo y Logs

### Logs Requeridos
- ✅ Cada llamada al servicio (sin datos sensibles)
- ✅ Errores con contexto
- ✅ Rate limits alcanzados
- ✅ Tiempos de respuesta

### Métricas a Trackear
- Número de llamadas por día
- Tasa de éxito/fallo
- Tiempo promedio de respuesta
- Errores más comunes

---

## ✅ Definition of Done

### Código
- [ ] Servicio implementado en `src/services/`
- [ ] Variables de entorno documentadas
- [ ] Error handling robusto
- [ ] Modo mock para desarrollo
- [ ] Sin hardcoded credentials

### Integración
- [ ] Integrado en controllers relevantes
- [ ] No rompe funcionalidad existente
- [ ] Funciona en local y producción
- [ ] Rate limiting considerado

### Testing
- [ ] Tests unitarios escritos
- [ ] Tests de integración exitosos
- [ ] Testing manual completo
- [ ] Testing de error cases

### Documentación
- [ ] Variables .env documentadas
- [ ] Guía de setup creada
- [ ] Casos de uso documentados
- [ ] Troubleshooting documentado

### Seguridad
- [ ] No hay credentials en código
- [ ] Inputs validados
- [ ] Outputs sanitizados
- [ ] HTTPS verificado

---

## 📦 Entregables

1. **Código del servicio** (`src/services/[servicio]Service.js`)
2. **Variables de entorno** (actualizar `.env.example`)
3. **Tests** (`tests/services/[servicio].test.js`)
4. **Documentación** (`docs/integrations/[SERVICIO].md`)
5. **Screenshots/logs** de testing exitoso

### Formato de Commit
```
feat(integration): Integra [SERVICIO] para [propósito]

- Implementa servicio base con [métodos]
- Agrega integración en [controllers]
- Añade tests unitarios
- Documenta setup y uso
- Modo mock para desarrollo

Closes #[ISSUE_NUMBER]
```

---

## 🔗 Referencias

### Documentación del Proveedor
- API Docs: [URL]
- Getting Started: [URL]
- SDKs: [URL]

### Documentación Interna
- [BLACKBOX.md](../../BLACKBOX.md) - Estándares
- [CRUSH.md](../../CRUSH.md) - Setup local

---

## 💬 Notas Adicionales

[Consideraciones especiales, limitaciones conocidas, o contexto importante]

---

## 🚨 Bloqueos o Dudas

Si encuentras bloqueos:
1. Verificar API keys son correctas
2. Revisar logs del proveedor
3. Consultar docs del proveedor
4. Probar con curl/Postman primero
5. Comentar en este issue

---

**Agente:** Confirma que tienes acceso a las credenciales necesarias antes de comenzar.  
**Tiempo esperado:** [X-Y] horas  
**Deadline sugerido:** [Fecha]
