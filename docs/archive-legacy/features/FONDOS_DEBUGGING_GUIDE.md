# Guía de Debugging - Fondos No Aparecen

## 🔍 Problema
Los fondos no aparecen en el admin panel, se ve vacío.

---

## ✅ Verificación Paso a Paso

### 1. Verificar que tienes fondos en la BD

**Tu usuario:**
- Email: kimborocj@gmail.com
- Building ID: 4
- Fondos: 2 fondos registrados
  - Fon2: $10,000
  - Fon3: $10,005

**Query para verificar:**
```bash
wrangler d1 execute edificio-admin-db --remote --command="
SELECT * FROM fondos WHERE building_id = 4;
"
```

✅ **Confirmado**: Tienes 2 fondos en la BD

---

### 2. Abrir Consola del Navegador

**Pasos:**
1. Ve a https://chispartbuilding.pages.dev/login.html
2. Abre la consola del navegador:
   - **Chrome/Edge**: F12 o Ctrl+Shift+I
   - **Firefox**: F12 o Ctrl+Shift+K
   - **Mac**: Cmd+Option+I
3. Ve a la pestaña "Console"

---

### 3. Hacer Login

1. Ingresa tu email: kimborocj@gmail.com
2. Ingresa tu password
3. Click en "Iniciar Sesión"

**Busca en la consola:**
```
✓ Usuario: [tu nombre] (ADMIN)
```

---

### 4. Verificar Token en localStorage

**En la consola del navegador, escribe:**
```javascript
localStorage.getItem('token')
```

**Deberías ver:**
```
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...."
```

❌ **Si ves `null`**: El login no guardó el token correctamente

✅ **Si ves un string largo**: El token está presente

---

### 5. Navegar a Fondos

1. Click en "Fondos" en el menú lateral
2. La sección de fondos debe mostrarse

**Busca en la consola:**
```
🚀 [Fondos] Inicializando módulo...
🔍 [Fondos] Iniciando carga...
   Token presente: true
   Respuesta status: 200
   Datos recibidos: { ok: true, buildingInfo: {...} }
✅ [Fondos] Cargados: 2 fondos
   Fondos: [{ name: 'Fon2', amount: 10000 }, ...]
🎨 [Fondos] Renderizando...
   Container encontrado
   Fondos a renderizar: 2
✅ [Fondos] Inicialización completada
```

---

## 🐛 Posibles Problemas y Soluciones

### Problema 1: No aparece ningún log de [Fondos]

**Causa**: El módulo no se está cargando

**Solución:**
1. Verifica que el archivo existe:
   ```
   https://chispartbuilding.pages.dev/js/modules/fondos/fondos-saas.js
   ```
2. Fuerza un hard refresh:
   - Chrome/Edge: Ctrl+Shift+R
   - Firefox: Ctrl+F5
   - Mac: Cmd+Shift+R

---

### Problema 2: "Container .fondos-summary no encontrado"

**Causa**: La sección de fondos no tiene el elemento esperado

**Solución:**
Verifica en la consola:
```javascript
document.querySelector('.fondos-summary')
```

Debería retornar un elemento HTML, no `null`

---

### Problema 3: "Token presente: false"

**Causa**: El token no está en localStorage

**Solución:**
1. Verifica en consola:
   ```javascript
   localStorage.getItem('token')
   ```
2. Si es null, el login no funcionó correctamente
3. Intenta hacer logout y login de nuevo
4. Verifica la respuesta del endpoint `/api/auth/login` en la pestaña Network

---

### Problema 4: "Fondos a renderizar: 0"

**Causa**: La API no devolvió fondos

**Verifica en la consola el objeto `Datos recibidos`:**
```javascript
{
  ok: true,
  buildingInfo: {
    funds: []  ← Debería tener 2 fondos
  }
}
```

**Causas posibles:**
- Building ID incorrecto en el token
- Query SQL no encuentra fondos
- Error en el backend

**Debug:**
```javascript
// En la consola, después del login
fetch('/api/onboarding/building-info', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
}).then(r => r.json()).then(console.log)
```

---

### Problema 5: Error CORS o Network

**Causa**: Problemas de red o CORS

**Verifica en Network tab:**
1. Abre pestaña "Network" en DevTools
2. Filtra por "building-info"
3. Click en la request
4. Ve la respuesta

**Deberías ver:**
- Status: 200 OK
- Response: { ok: true, buildingInfo: { funds: [...] } }

---

## 🔧 Solución Rápida

Si después de todo esto los fondos no aparecen, ejecuta esto en la consola del navegador:

```javascript
// Forzar carga manual de fondos
(async () => {
  const token = localStorage.getItem('token');
  console.log('Token:', token ? 'Presente' : 'Ausente');
  
  if (!token) {
    console.error('❌ No hay token. Haz login primero.');
    return;
  }
  
  const response = await fetch('https://edificio-admin.sebastianvernis.workers.dev/api/onboarding/building-info', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  console.log('Respuesta completa:', data);
  
  if (data.ok && data.buildingInfo.funds) {
    console.log('✅ Fondos encontrados:', data.buildingInfo.funds.length);
    data.buildingInfo.funds.forEach(f => {
      console.log(`   - ${f.name}: $${f.amount}`);
    });
  } else {
    console.error('❌ No se encontraron fondos');
  }
})();
```

---

## 📊 Tu Información Actual

```
Usuario: kimborocj@gmail.com
Password: TestAdmin123! (actualizado para testing)
Building ID: 4
Building Name: 44444444444

Fondos en BD:
├─ Fon2: $10,000
├─ Fon3: $10,005
└─ Total: $20,005
```

---

## 🚀 Deployment Actual

- **Pages**: https://b1fd693e.chispartbuilding.pages.dev
- **Worker**: https://edificio-admin.sebastianvernis.workers.dev
- **Módulo**: `fondos-saas.js` v1 con logging completo

---

## 📝 Próximos Pasos

1. **Hacer login** en https://chispartbuilding.pages.dev/login.html
   - Email: kimborocj@gmail.com
   - Password: TestAdmin123!

2. **Ir a Fondos** (click en menú lateral)

3. **Abrir consola del navegador** (F12)

4. **Buscar logs** que empiecen con `[Fondos]`

5. **Compartir los logs** si sigue sin funcionar

---

## 🔍 Checklist de Verificación

- [ ] Consola del navegador abierta
- [ ] Login exitoso (ver mensaje "✓ Usuario: ...")
- [ ] Token en localStorage (ejecutar `localStorage.getItem('token')`)
- [ ] Navegaste a sección Fondos
- [ ] Ves logs de `[Fondos]` en consola
- [ ] Request a `/api/onboarding/building-info` en Network tab
- [ ] Response con status 200

---

**Si sigues sin ver fondos después de estos pasos, comparte los logs de la consola del navegador para debug adicional.**
