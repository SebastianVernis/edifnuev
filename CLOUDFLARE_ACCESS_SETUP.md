# 🔓 Configuración de Cloudflare Access para Testing E2E

**Fecha:** 2025-12-16  
**Proyecto:** SmartBuilding SaaS  
**Objetivo:** Permitir ejecución de tests automatizados

---

## 🎯 Paso a Paso

### **Paso 1: Crear Service Token**

1. **Acceder a Cloudflare Dashboard:**
   ```
   https://dash.cloudflare.com/
   ```

2. **Navegar a Zero Trust:**
   ```
   Dashboard → Zero Trust → Access → Service Auth
   ```

3. **Crear Nuevo Service Token:**
   ```
   Click en "Create Service Token"
   
   Configuración:
   - Name: "E2E Testing SmartBuilding"
   - Duration: 1 year (o según política)
   - Click "Generate token"
   ```

4. **⚠️ GUARDAR CREDENCIALES (solo se muestran una vez):**
   ```
   Client ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   Client Secret: yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
   ```

---

### **Paso 2: Configurar Policy en Application**

1. **Acceder a Applications:**
   ```
   Zero Trust → Access → Applications
   ```

2. **Buscar Application:**
   ```
   Buscar: "edificio-admin-saas-adapted"
   Click en "Edit"
   ```

3. **Agregar Service Token Policy:**
   ```
   Ir a sección "Policies"
   Click en "Add a policy"
   
   Configuración:
   - Policy name: "Service Token - E2E Testing"
   - Action: "Service Auth"
   - Configure rules:
     - Rule type: "Include"
     - Selector: "Service Token"
     - Value: Seleccionar "E2E Testing SmartBuilding"
   ```

4. **Configurar Rutas (Opcional - Recomendado):**
   ```
   En "Configure rules", agregar:
   - Path: /api/*
   - Methods: GET, POST, PUT, DELETE, OPTIONS
   
   Esto limita el Service Token solo a rutas API
   ```

5. **Guardar:**
   ```
   Click en "Save policy"
   Click en "Save application"
   ```

---

### **Paso 3: Configurar Variables de Entorno Locales**

1. **Crear archivo .env:**
   ```bash
   cd /home/admin/edifnuev/saas-migration/edificio-admin-saas-adapted
   
   cat > .env << 'EOF'
   # Cloudflare Access Service Token
   CF_ACCESS_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   CF_ACCESS_CLIENT_SECRET=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
   
   # Environment
   NODE_ENV=production
   TEST_ENV=production
   EOF
   ```

2. **Proteger archivo .env:**
   ```bash
   chmod 600 .env
   echo ".env" >> .gitignore
   ```

---

### **Paso 4: Actualizar test-config.js**

Ya está actualizado en el branch `feature/smartbuilding-e2e-testing-suite-t6dop6` para soportar Service Token.

**Verificar que incluye:**
```javascript
// Service Token para Cloudflare Access
serviceToken: {
  clientId: process.env.CF_ACCESS_CLIENT_ID,
  clientSecret: process.env.CF_ACCESS_CLIENT_SECRET
}
```

---

### **Paso 5: Instalar Dependencia dotenv**

```bash
cd /home/admin/edifnuev/saas-migration/edificio-admin-saas-adapted
npm install dotenv --save-dev
```

---

### **Paso 6: Validar Configuración**

1. **Crear script de validación rápida:**
   ```bash
   cat > validate-access.js << 'EOF'
   import dotenv from 'dotenv';
   import fetch from 'node-fetch';
   
   dotenv.config();
   
   const BASE_URL = 'https://edificio-admin-saas-adapted.sebastianvernis.workers.dev';
   
   async function validateAccess() {
     console.log('🔍 Validating Cloudflare Access configuration...\n');
     
     const headers = {
       'Content-Type': 'application/json'
     };
     
     if (process.env.CF_ACCESS_CLIENT_ID && process.env.CF_ACCESS_CLIENT_SECRET) {
       headers['CF-Access-Client-Id'] = process.env.CF_ACCESS_CLIENT_ID;
       headers['CF-Access-Client-Secret'] = process.env.CF_ACCESS_CLIENT_SECRET;
       console.log('✅ Service Token configured\n');
     } else {
       console.log('❌ Service Token NOT configured\n');
       console.log('Set CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET\n');
       process.exit(1);
     }
     
     try {
       const response = await fetch(`${BASE_URL}/api/auth/login`, {
         method: 'POST',
         headers,
         body: JSON.stringify({
           email: 'admin@edificio205.com',
           password: 'Gemelo1'
         })
       });
       
       const contentType = response.headers.get('content-type');
       const data = contentType?.includes('application/json') 
         ? await response.json() 
         : await response.text();
       
       console.log('Status:', response.status);
       console.log('Content-Type:', contentType);
       console.log('Response:', typeof data === 'string' ? data.substring(0, 200) : JSON.stringify(data, null, 2));
       
       if (response.status === 200 && data.ok) {
         console.log('\n✅ SUCCESS: Cloudflare Access bypass working!');
         console.log('✅ Service Token configured correctly');
         console.log('\n🚀 Ready to run E2E tests: npm run test:e2e');
         process.exit(0);
       } else if (typeof data === 'string' && data.includes('Cloudflare Access')) {
         console.log('\n❌ FAILED: Still blocked by Cloudflare Access');
         console.log('❌ Service Token not configured or invalid');
         console.log('\nVerify:');
         console.log('1. Service Token created in Cloudflare Dashboard');
         console.log('2. Policy added to Application');
         console.log('3. Variables in .env are correct');
         process.exit(1);
       } else {
         console.log('\n⚠️  WARNING: Unexpected response');
         console.log('Check configuration and try again');
         process.exit(1);
       }
     } catch (error) {
       console.error('\n💥 ERROR:', error.message);
       process.exit(1);
     }
   }
   
   validateAccess();
   EOF
   ```

2. **Ejecutar validación:**
   ```bash
   node validate-access.js
   ```

**Output esperado:**
```
✅ SUCCESS: Cloudflare Access bypass working!
✅ Service Token configured correctly
🚀 Ready to run E2E tests: npm run test:e2e
```

---

## 🚀 Ejecutar Tests E2E

Una vez validado el acceso:

```bash
# Ejecutar todos los tests
npm run test:e2e

# O tests específicos
npm run test:auth
npm run test:multitenancy
npm run test:security
npm run test:api
```

---

## 📋 Checklist de Configuración

- [ ] Service Token creado en Cloudflare Dashboard
- [ ] Client ID y Secret copiados
- [ ] Policy agregada a Application "edificio-admin-saas-adapted"
- [ ] Rutas `/api/*` configuradas (opcional)
- [ ] Archivo `.env` creado con credenciales
- [ ] `.env` agregado a `.gitignore`
- [ ] `dotenv` instalado (`npm install dotenv --save-dev`)
- [ ] Script de validación ejecutado exitosamente
- [ ] Tests E2E ejecutados sin errores de Cloudflare Access

---

## 🔧 Troubleshooting

### Problema: Service Token No Funciona

**Síntoma:**
```
❌ FAILED: Still blocked by Cloudflare Access
```

**Verificar:**
1. Service Token está "Active" en Dashboard
2. Policy está en la Application correcta
3. Variables de entorno tienen valores correctos:
   ```bash
   echo $CF_ACCESS_CLIENT_ID
   echo $CF_ACCESS_CLIENT_SECRET
   ```
4. Headers se están enviando correctamente (ver `test-config.js`)

### Problema: Variables No Se Cargan

**Síntoma:**
```
❌ Service Token NOT configured
```

**Solución:**
```bash
# Verificar que .env existe
cat .env

# Verificar que dotenv está instalado
npm list dotenv

# Exportar manualmente
export CF_ACCESS_CLIENT_ID=xxx
export CF_ACCESS_CLIENT_SECRET=yyy
node validate-access.js
```

---

## 📞 Siguiente Paso

Después de configurar exitosamente:

1. **Merge del branch de tests:**
   ```bash
   git checkout master
   git pull origin feature/smartbuilding-e2e-testing-suite-t6dop6
   ```

2. **Ejecutar tests completos:**
   ```bash
   npm run test:e2e
   ```

3. **Revisar reportes generados:**
   - `tests/e2e/test-results.json`
   - `tests/e2e/TEST_RESULTS.md`
   - `tests/e2e/SECURITY_AUDIT_REPORT.md`
   - `tests/e2e/MULTITENANCY_VALIDATION_REPORT.md`

---

**Tiempo estimado:** 15-30 minutos  
**Prioridad:** 🔴 Alta  
**Bloqueador actual:** Configuración manual en Cloudflare Dashboard
