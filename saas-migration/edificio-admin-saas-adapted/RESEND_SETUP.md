# 📧 Configuración de Resend para OTP

**Proveedor:** Resend  
**Plan:** Free (3000 emails/mes)  
**Ventaja:** Sin necesidad de dominio propio o configuración DNS  
**Documentación:** https://resend.com/docs/send-with-cloudflare-workers

---

## 🚀 Setup Rápido (5 minutos)

### Paso 1: Obtener API Key

1. Ir a: https://resend.com/api-keys
2. Crear cuenta (gratis)
3. Click "Create API Key"
4. Nombre: `Edificio Admin SaaS`
5. Permisos: `Sending access`
6. Copiar la key (empieza con `re_`)

---

### Paso 2: Configurar Variables de Entorno

#### Para Desarrollo Local (.dev.vars)
```bash
cd /home/admin/edifnuev/saas-migration/edificio-admin-saas-adapted

# Crear archivo .dev.vars
cat > .dev.vars << 'EOF'
JWT_SECRET=tu-secret-jwt-key
ENVIRONMENT=development
APP_URL=http://localhost:8787

# Resend Configuration
RESEND_API_KEY=re_TU_API_KEY_AQUI
SMTP_FROM=Edificio Admin <onboarding@resend.dev>
EOF
```

#### Para Producción (Cloudflare Workers)
```bash
# Agregar secrets a Cloudflare
npx wrangler secret put RESEND_API_KEY
# Pegar tu API key cuando te lo pida

# Agregar variable normal
npx wrangler secret put SMTP_FROM
# Pegar: Edificio Admin <onboarding@resend.dev>
```

**Alternativa con wrangler.toml:**
```toml
[vars]
SMTP_FROM = "Edificio Admin <onboarding@resend.dev>"
ENVIRONMENT = "production"
APP_URL = "https://edificio-admin-saas-adapted.sebastianvernis.workers.dev"

# RESEND_API_KEY se configura como secret (no en wrangler.toml)
```

---

### Paso 3: Verificar Implementación

El código ya está listo en `src/utils/smtp.js`:

**Flujo de envío:**
```javascript
// 1. Intenta Resend (si RESEND_API_KEY existe)
if (env.RESEND_API_KEY) {
  response = await sendViaResend(emailContent, env);
}
// 2. Fallback a MailChannels (si Resend falla)
else {
  response = await sendViaMailChannels(emailContent, env);
}
// 3. Fallback a SMTP API (si todo falla)
else {
  response = await sendViaSmtp(emailContent, env);
}
```

---

## 🧪 Testing

### Opción 1: Test Local con wrangler dev
```bash
cd /home/admin/edifnuev/saas-migration/edificio-admin-saas-adapted

# Crear .dev.vars con tu API key
echo "RESEND_API_KEY=re_tu_key" > .dev.vars

# Iniciar dev server
npx wrangler dev

# En otro terminal, probar endpoint
curl -X POST http://localhost:8787/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"email":"tu-email@gmail.com"}'

# Deberías recibir email con código OTP
```

### Opción 2: Test en Producción
```bash
# Deploy con secret configurado
npx wrangler deploy

# Probar endpoint
curl -X POST https://edificio-admin-saas-adapted.sebastianvernis.workers.dev/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"email":"tu-email@gmail.com"}'
```

### Opción 3: Test desde UI
1. Ir a: https://edificio-admin-saas-adapted.sebastianvernis.workers.dev/registro.html
2. Completar registro con tu email real
3. Verificar que recibes email con código OTP
4. Ingresar código en UI
5. ✅ Si funciona, Resend configurado correctamente

---

## 📊 Validación de Funcionamiento

### Email Recibido Debe Contener:
```
De: Edificio Admin <onboarding@resend.dev>
Para: tu-email@gmail.com
Asunto: Código de verificación - Edificio Admin

Cuerpo:
Tu código de verificación es: 123456
Este código expira en 10 minutos.
```

### Console Logs (Cloudflare)
```bash
# Ver logs en tiempo real
npx wrangler tail

# Deberías ver:
# "Enviando email vía Resend..."
# "Email enviado vía Resend: <email-id>"
```

### Base de Datos (email_logs)
```sql
SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 5;
```

Debe mostrar:
- recipient: tu-email@gmail.com
- email_type: otp
- status: sent
- error_message: null

---

## 🔧 Troubleshooting

### Error: "RESEND_API_KEY no configurado"
**Solución:**
```bash
# Verificar que la variable existe
npx wrangler secret list

# Si no existe, agregarla
npx wrangler secret put RESEND_API_KEY
```

### Error: "Invalid API key"
**Solución:**
- Verificar que la key empieza con `re_`
- Regenerar key en https://resend.com/api-keys
- Volver a configurar secret

### Error: "Domain not verified"
**Solución:**
- Usar dominio gratuito de Resend: `onboarding@resend.dev`
- O verificar tu dominio en: https://resend.com/domains

### No llega el email
**Solución:**
1. Verificar spam/junk
2. Verificar logs: `npx wrangler tail`
3. Verificar tabla `email_logs` en DB
4. Probar con otro email

---

## 📋 Checklist de Configuración

### Desarrollo
- [ ] Cuenta Resend creada
- [ ] API key obtenida
- [ ] `.dev.vars` creado con RESEND_API_KEY
- [ ] `npx wrangler dev` funciona
- [ ] Test con curl exitoso
- [ ] Email recibido

### Producción
- [ ] Secret RESEND_API_KEY agregado
- [ ] Variable SMTP_FROM configurada
- [ ] Deploy ejecutado
- [ ] Test en URL de producción
- [ ] Email recibido
- [ ] Logs verificados

---

## 🎯 Ventajas de Resend

✅ **3000 emails/mes gratis** (suficiente para testing y producción inicial)  
✅ **Sin configuración DNS** (funciona con workers.dev)  
✅ **API simple** (1 endpoint, respuesta clara)  
✅ **Logs y analytics** en dashboard  
✅ **99.9% deliverability**  
✅ **Compatible con Workers** (solo fetch, sin dependencias)  
✅ **Dominio gratuito** (resend.dev)

---

## 📞 Soporte

**Docs:** https://resend.com/docs  
**API Reference:** https://resend.com/docs/api-reference/emails/send-email  
**Dashboard:** https://resend.com/emails  
**Status:** https://resend.com/status

---

## 🔄 Migración Futura a MailChannels

Cuando tengas dominio propio:

1. Configurar DNS records
2. Comentar línea de Resend
3. Descomentar MailChannels
4. Deploy

El código ya tiene fallback automático.

---

**Preparado:** 2025-12-14  
**Estado:** ✅ Listo para configurar  
**Siguiente:** Proporcionar API key de Resend
