# ⚡ Instrucciones de Setup Rápido - Edificio Admin

## 🎯 Configuración Inicial (5 minutos)

### 1. Configurar SMTP para Emails

**Opción A: Gmail (Desarrollo)**

1. Ve a tu cuenta de Gmail → Seguridad
2. Activa verificación en 2 pasos
3. Genera una "Contraseña de aplicación"
4. Copia `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
5. Edita `.env` con tus datos:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=tu-email@gmail.com
   SMTP_PASS=tu-app-password-generado
   SMTP_FROM=noreply@edificio-admin.com
   APP_URL=http://ec2-18-223-32-141.us-east-2.compute.amazonaws.com
   ```

**Opción B: SendGrid (Producción - Recomendado)**

1. Crea cuenta gratuita en SendGrid (100 emails/día gratis)
2. Genera API Key
3. Configura en `.env`:
   ```bash
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=apikey
   SMTP_PASS=SG.tu-api-key-aqui
   SMTP_FROM=noreply@edificio-admin.com
   APP_URL=http://ec2-18-223-32-141.us-east-2.compute.amazonaws.com
   ```

### 2. Reiniciar el Servidor

```bash
pm2 restart edificio-admin
pm2 logs edificio-admin
```

Deberías ver: `✅ SMTP configurado correctamente`

---

## 🚀 Probar el Flujo Completo

### Flujo de Registro Nuevo Usuario

1. **Accede al Landing:**
   ```
   http://ec2-18-223-32-141.us-east-2.compute.amazonaws.com/landing
   ```

2. **Selecciona un Plan:**
   - Básico ($499/mes)
   - Profesional ($999/mes) ← Recomendado
   - Empresarial ($1,999/mes)

3. **Completa el Registro:**
   - Email (usa uno real para recibir códigos)
   - Nombre completo
   - Teléfono (opcional)
   - Nombre del edificio

4. **Verifica tu Email:**
   - Clic en "Solicitar Código"
   - Revisa tu email (puede tardar 10-30 segundos)
   - Ingresa el código de 6 dígitos
   - Código válido por 10 minutos

5. **Checkout (Mockup):**
   - Ingresa cualquier número de tarjeta (ej: 4242 4242 4242 4242)
   - Fecha: cualquier fecha futura (ej: 12/26)
   - CVC: cualquier 3 dígitos (ej: 123)
   - **NO se hace cargo real**

6. **Configuración Inicial:**
   - Datos del edificio (dirección, unidades, etc.)
   - Crea tu contraseña de administrador
   - Clic en "Completar Configuración"
   - Recibirás email de bienvenida

7. **¡Listo!**
   - Serás redirigido automáticamente al dashboard
   - Ya puedes empezar a usar el sistema

---

## 👥 Invitar Usuarios

### Desde el Dashboard de Admin

1. **Login como Admin:**
   ```
   http://ec2-18-223-32-141.us-east-2.compute.amazonaws.com/admin
   ```

2. **Ir a Usuarios:**
   - Menú lateral → "Usuarios"

3. **Agregar Script de Invitación:**
   En el archivo `public/admin.html`, antes del cierre de `</body>`, agrega:
   ```html
   <script src="/js/modules/usuarios/invitar-usuario.js"></script>
   ```

4. **Agregar Botón de Invitar:**
   Busca en el módulo de usuarios y agrega un botón:
   ```html
   <button onclick="mostrarModalInvitacion()" class="btn btn-primary">
       <i class="bi bi-envelope"></i> Invitar Usuario
   </button>
   ```

5. **Enviar Invitación:**
   - Clic en "Invitar Usuario"
   - Completa el formulario:
     - Email del usuario
     - Nombre completo
     - Rol (Admin, Comité, Inquilino)
     - Departamento/Unidad
   - El usuario recibirá email con link de activación

6. **Usuario Activa su Cuenta:**
   - Usuario hace clic en link del email
   - Crea su contraseña
   - Accede automáticamente al sistema

---

## 🔍 Verificar que Todo Funciona

### Checklist Rápido

- [ ] SMTP configurado correctamente (ver logs del PM2)
- [ ] Landing page accesible (`/landing`)
- [ ] Registro funcional (`/register`)
- [ ] Emails llegando correctamente
- [ ] Verificación OTP funcional
- [ ] Checkout completándose
- [ ] Setup creando usuario correctamente
- [ ] Dashboard accesible después de setup
- [ ] Invitaciones enviándose por email

### Ver Logs

```bash
pm2 logs edificio-admin --lines 100
```

Busca estos mensajes:
- ✅ `SMTP configurado correctamente`
- ✅ `Email enviado: <messageId>`
- ✅ `Sistema inicializado correctamente`

---

## ⚠️ Solución de Problemas

### Email no llega

1. **Revisa spam/correo no deseado**

2. **Verifica configuración SMTP en .env:**
   ```bash
   cat .env | grep SMTP
   ```

3. **Revisa logs:**
   ```bash
   pm2 logs edificio-admin | grep -i smtp
   pm2 logs edificio-admin | grep -i email
   ```

4. **Verifica credenciales:**
   - Gmail: ¿Usaste App Password?
   - SendGrid: ¿API Key es correcta?
   - ¿El email FROM está verificado?

### Error de autenticación SMTP

```bash
# Prueba de conexión SMTP manual
node -e "
const nodemailer = require('nodemailer');
require('dotenv').config();
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
transporter.verify().then(() => console.log('✅ SMTP OK')).catch(e => console.error('❌', e));
"
```

### Código OTP no válido

- El código expira en 10 minutos
- Máximo 5 intentos por código
- Si expira, solicita uno nuevo

---

## 📧 Configuraciones SMTP Alternativas

### Outlook/Hotmail
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@outlook.com
SMTP_PASS=tu-contraseña
```

### Yahoo
```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=tu-email@yahoo.com
SMTP_PASS=tu-contraseña
```

### Mailgun
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@tu-dominio.mailgun.org
SMTP_PASS=tu-mailgun-password
```

---

## 🎨 Personalización de Emails

Los templates están en: `src/utils/emailTemplates.js`

Puedes personalizar:
- Colores del gradiente
- Logo/icono
- Textos
- Estilos CSS

Después de modificar, reinicia el servidor:
```bash
pm2 restart edificio-admin
```

---

## 📊 Monitoreo

### Ver actividad de emails

```bash
# Ver logs en tiempo real
pm2 logs edificio-admin --lines 50

# Filtrar solo emails
pm2 logs edificio-admin | grep -i "email\|otp\|invitation"
```

### Estadísticas
- OTPs enviados: Ver logs con "OTP enviado"
- Invitaciones: Ver logs con "Invitación enviada"
- Registros completados: Ver logs con "Configuración completada"

---

## 🔐 Seguridad

### Límites Implementados

- **OTP:** Máx 5 emails/hora por dirección
- **Intentos:** Máx 5 intentos por código OTP
- **Expiración OTP:** 10 minutos
- **Expiración Invitaciones:** 7 días
- **Rate limiting:** En memoria (considerarbr Redis para producción)

### Recomendaciones

1. **Cambiar JWT_SECRET** en producción:
   ```bash
   JWT_SECRET=$(openssl rand -base64 32)
   ```

2. **Usar HTTPS** en producción

3. **Configurar firewall** para proteger puerto 3001

4. **Monitorear logs** regularmente

---

## 📱 URLs Importantes

| Página | URL |
|--------|-----|
| Landing | `/landing` |
| Registro | `/register` |
| Verificación OTP | `/verify-otp` |
| Checkout | `/checkout` |
| Setup | `/setup` |
| Activación | `/activate?token=...` |
| Login Existente | `/` |
| Admin Dashboard | `/admin` |
| Inquilino Dashboard | `/inquilino` |

---

## ✅ Siguiente Paso

Una vez configurado el SMTP, el flujo completo estará funcionando:

1. Usuario puede registrarse desde `/landing`
2. Recibe código OTP por email
3. Completa pago (mockup)
4. Configura su edificio
5. Admin puede invitar usuarios por email
6. Usuarios invitados pueden activar su cuenta

**Todo el flujo está implementado y listo para usar** 🎉

---

Para más detalles técnicos, ver: `FLUJO_ONBOARDING_COMPLETO.md`
