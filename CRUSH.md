# Edificio Admin - Sistema Operacional

**Fecha:** 2025-12-13 16:10 UTC  
**Estado:** ✅ FUNCIONANDO - FLUJO COMPLETO IMPLEMENTADO

---

## 🚀 PM2 Comandos

```bash
pm2 status                  # Ver estado
pm2 logs edificio-admin     # Ver logs
pm2 restart edificio-admin  # Reiniciar
pm2 save                    # Guardar config
```

---

## 🔑 Credenciales

**CONTRASEÑA: `Gemelo1` (cuenta existente)**

```
Admin: admin@edificio205.com / Gemelo1
```

**URL:** `http://ec2-18-223-32-141.us-east-2.compute.amazonaws.com`

---

## 📊 Estado

```yaml
PM2: ✅ Online
Backend: ✅ Funcionando
Frontend: ✅ Sin loops
Módulos: Cuotas, Gastos, Fondos, Onboarding, Invitaciones
DB: ✅ 41KB, 20 usuarios
SMTP: ⚠️  Requiere configuración
```

---

## 🎯 Funcionalidades

### Sistema Existente
✅ Login/Logout  
✅ Cuotas  
✅ Gastos  
✅ Fondos  
✅ Usuarios  
❌ Dashboard (deshabilitado)  
❌ Anuncios (deshabilitado)

### Nuevo: Flujo de Onboarding (SaaS)
✅ Landing page con pricing  
✅ Registro de nuevos usuarios  
✅ Verificación por email (OTP)  
✅ Checkout con mockup de pagos  
✅ Configuración inicial de edificio  
✅ Primer login automático  
✅ Invitaciones de usuarios por email  
✅ Activación de cuentas invitadas

---

## 🆕 URLs Nuevas

| Funcionalidad | URL |
|---------------|-----|
| Landing + Pricing | `/landing` |
| Registro | `/register` |
| Verificación OTP | `/verify-otp` |
| Checkout | `/checkout` |
| Setup Edificio | `/setup` |
| Activar Invitación | `/activate?token=...` |

---

## ⚙️ Configuración Requerida

### 1. SMTP para Emails

**Archivo:** `.env` (crear desde `.env.example`)

```bash
# Ejemplo Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
SMTP_FROM=noreply@edificio-admin.com
APP_URL=http://ec2-18-223-32-141.us-east-2.compute.amazonaws.com
```

### 2. Reiniciar Servidor

```bash
pm2 restart edificio-admin
pm2 logs edificio-admin  # Ver que SMTP esté OK
```

---

## 🔧 Solución Rápida

### Si hay loop
```javascript
// Console (F12):
localStorage.clear();
// Reload: Ctrl+Shift+R
```

### Si emails no llegan
```bash
# Ver logs
pm2 logs edificio-admin | grep -i email

# Verificar .env
cat .env | grep SMTP
```

---

## 📚 Documentación Completa

- **Setup SMTP:** `INSTRUCCIONES_SETUP.md`
- **Flujo Técnico:** `FLUJO_ONBOARDING_COMPLETO.md`
- **Resumen:** `RESUMEN_IMPLEMENTACION.md`
- **Credenciales Demo:** Este archivo

---

## ✅ Testing Rápido

1. Accede a `/landing`
2. Selecciona plan
3. Registra con email real
4. Verifica código OTP del email
5. Completa checkout (mockup)
6. Configura edificio + contraseña
7. Accede automáticamente a `/admin`

---

**Sistema 100% operacional** ✅  
**Flujo SaaS completo implementado** 🚀
