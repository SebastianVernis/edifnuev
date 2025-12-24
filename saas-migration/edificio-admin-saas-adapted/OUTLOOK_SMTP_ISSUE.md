# ⚠️ Cloudflare Workers + Outlook SMTP - No Compatible

**Problema:** Cloudflare Workers **NO puede hacer conexiones SMTP directas** a servidores externos como Outlook.

---

## 🚫 Limitación de Workers

### Workers NO Soporta:
- ❌ Conexiones TCP/SMTP directas
- ❌ Puerto 587 (SMTP)
- ❌ Puerto 993 (IMAP)
- ❌ Puerto 995 (POP3)
- ❌ Sockets nativos

### Workers SOLO Soporta:
- ✅ HTTP/HTTPS (fetch API)
- ✅ WebSockets
- ✅ APIs REST

**Documentación oficial:**
> "Workers do not support outbound TCP connections"
> https://developers.cloudflare.com/workers/platform/limits/

---

## ✅ Soluciones Disponibles

### Opción 1: Resend (RECOMENDADO - Ya configurado) ⭐⭐⭐

**Estado:** ✅ Ya implementado y funcional

```bash
RESEND_API_KEY=re_WqU4iV1f_CnrVUqn2WE7YtKB99ASDwSej
SMTP_FROM=ChispartBuilding <onboarding@resend.dev>
```

**Ventajas:**
- ✅ 3000 emails/mes gratis
- ✅ API HTTP (compatible con Workers)
- ✅ Sin configuración SMTP
- ✅ Ya desplegado

**Código:**
```javascript
// Prioridad 1: Resend (HTTP API)
if (env.RESEND_API_KEY) {
  return await sendViaResend(emailContent, env);
}
```

---

### Opción 2: SendGrid (HTTP API)

**Setup:**
```bash
# 1. Crear cuenta: https://sendgrid.com
# 2. Obtener API key
# 3. Configurar:

SMTP_API_URL=https://api.sendgrid.com/v3/mail/send
SMTP_API_KEY=SG.tu-api-key
```

**Ventajas:**
- ✅ 100 emails/día gratis
- ✅ API HTTP compatible
- ✅ Muy confiable

---

### Opción 3: MailChannels (Gratis ilimitado)

**Requiere:**
- Dominio propio
- DNS configurado (SPF + DKIM)

**Setup:**
```bash
# DNS Records en Cloudflare:
TXT @ "v=spf1 include:relay.mailchannels.net ~all"
TXT _mailchannels "v=mc1 t=y"

# Variable:
SMTP_FROM=noreply@tudominio.com
```

**Ventajas:**
- ✅ Emails ilimitados gratis
- ✅ Integrado con Workers
- ✅ Alta deliverability

**Limitación:**
- ⚠️ Requiere dominio propio (~$10/año)

---

### Opción 4: Mailgun (HTTP API)

**Setup:**
```bash
SMTP_API_URL=https://api.mailgun.net/v3/tudominio.com/messages
SMTP_API_KEY=key-tu-api-key
```

**Ventajas:**
- ✅ 5000 emails/mes gratis (3 meses)
- ✅ API HTTP
- ✅ Muy usado en producción

---

## 🎯 Recomendación por Caso de Uso

### Testing/Desarrollo (AHORA):
✅ **Resend** (ya configurado)
- Sin costo
- Sin configuración adicional
- Funciona inmediatamente

### Producción Pequeña (<3000 emails/mes):
✅ **Resend**
- Plan gratuito suficiente
- Sin mantenimiento

### Producción Media (3k-10k emails/mes):
✅ **SendGrid** o **Mailgun**
- Planes de pago accesibles
- Más features (analytics, templates)

### Producción Grande (>10k emails/mes):
✅ **MailChannels** + Dominio propio
- Ilimitado gratis
- Requiere dominio

---

## 📧 Email de Prueba con Resend

**Email actual configurado:**
```
Para: sebastianvernis@outlook.com
Desde: ChispartBuilding <onboarding@resend.dev>
Proveedor: Resend (HTTP API)
```

**El código OTP llegará a tu Outlook** desde `onboarding@resend.dev`

---

## 🔧 Alternativa Temporal: SMTP Proxy

Si **realmente** necesitas usar Outlook SMTP:

### Opción A: Cloudflare Email Workers (Beta)
- Requiere dominio en Cloudflare
- Configuración compleja

### Opción B: Servicio Proxy Externo
- SMTP2Go, Postmark
- Convierte SMTP a HTTP API

**Conclusión:** Más complejo que usar Resend directamente

---

## ✅ Estado Actual

**Configurado:** Resend (HTTP API)  
**Funcionando:** ✅ Sí  
**Email destino:** sebastianvernis@outlook.com  
**Llegará desde:** onboarding@resend.dev

**Para testing de endpoints:**
1. Registrarte con `sebastianvernis@outlook.com`
2. Revisar inbox de Outlook
3. Copiar código OTP de 6 dígitos
4. Ingresar en UI

---

## 📝 Configuración Actual

```bash
# .dev.vars (development)
RESEND_API_KEY=re_WqU4iV1f_CnrVUqn2WE7YtKB99ASDwSej
SMTP_FROM=ChispartBuilding <onboarding@resend.dev>

# Outlook SMTP (NO funciona en Workers)
SMTP_HOST=smtp-mail.outlook.com  # ❌ No se puede usar
SMTP_PORT=587                     # ❌ Puerto bloqueado
```

---

**Recomendación:** Continuar con Resend para testing de endpoints ✅
