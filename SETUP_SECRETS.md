# 🔐 Configuración de Secrets - Cloudflare Workers

Este documento contiene las instrucciones para configurar los secrets necesarios en Cloudflare Workers.

---

## ⚠️ Secrets Requeridos

### 1. JWT_SECRET (CRÍTICO)

**Propósito**: Firma y verificación de tokens JWT para autenticación

**Comando**:
```bash
wrangler secret put JWT_SECRET
```

**Cuando pregunte, pegar este valor**:
```
bHLZD/nxHDJ3pQ6G+vQcxbKlPOXgi12RaJgRp66LWj0=
```

**Nota**: Este secret ya fue generado con `openssl rand -base64 32`

---

### 2. APILAYER_API_KEY (Verificación de Email)

**Propósito**: Validación de emails en tiempo real para prevenir registros con emails inválidos o desechables

**Pasos**:

#### A. Obtener API Key de APILayer (GRATIS)
1. Ir a https://apilayer.com/
2. Crear cuenta (Free tier incluido)
3. Suscribirse a **Email Verification API** (Free Plan: 100 requests/mes)
4. Ir a **Dashboard** → **API Keys**
5. Copiar tu API Key

#### B. Configurar en Wrangler
```bash
wrangler secret put APILAYER_API_KEY
```

**Cuando pregunte, pegar**: Tu API key de APILayer

#### C. Para desarrollo local
Agregar a `.env`:
```bash
APILAYER_API_KEY=tu-apilayer-api-key
```

**Servicios disponibles con esta key**:
- ✅ Email Verification (validación de emails)
- ✅ Whois API (información de dominios)
- ✅ Currency Data API (conversión de monedas)
- ✅ Exchange Rates Data API (tasas de cambio)

---

### 3. SENDGRID_API_KEY (Para Issue #13 - Email OTP)

**Propósito**: Envío de emails con códigos OTP

**Pasos**:

#### A. Crear cuenta SendGrid (GRATIS)
1. Ir a https://signup.sendgrid.com/
2. Completar registro (Free tier: 100 emails/día)
3. Verificar email

#### B. Obtener API Key
1. Login en SendGrid Dashboard
2. Ir a **Settings** → **API Keys**
3. Click **Create API Key**
4. Nombre: `edificio-admin-otp`
5. Permisos: **Full Access** (o solo Mail Send)
6. **Copiar la API Key** (solo se muestra una vez)

#### C. Configurar en Wrangler
```bash
wrangler secret put SENDGRID_API_KEY
```

**Cuando pregunte, pegar**: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxx` (tu API key)

#### D. Verificar dominio (OPCIONAL pero recomendado)
1. En SendGrid: **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Completar formulario con email válido
4. Verificar email recibido

**Alternativa**: Si no verificas dominio, puedes usar email personal como remitente

---

### 4. Verificar secrets configurados

```bash
# Listar secrets (no muestra valores, solo nombres)
wrangler secret list
```

**Debe mostrar**:
```
JWT_SECRET
APILAYER_API_KEY
SENDGRID_API_KEY (si ya configuraste email)
```

---

## 🚀 Deploy después de configurar

```bash
# Deploy Worker con nuevos secrets
wrangler deploy

# Ver logs en tiempo real
wrangler tail
```

---

## 🧪 Testing

### Test JWT (debe funcionar inmediatamente después de configurar JWT_SECRET)

```bash
curl -X POST https://edificio-admin.sebastianvernis.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@edificio.com","password":"admin123"}'
```

**Esperado**: Respuesta con `token` válido

---

### Test Email OTP (requiere SENDGRID_API_KEY)

```bash
curl -X POST https://edificio-admin.sebastianvernis.workers.dev/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"email":"tu-email-real@gmail.com"}'
```

**Esperado**: 
- Respuesta: `{"ok":true,"msg":"Código OTP enviado a tu email"}`
- Email recibido con código OTP

---

## 📋 Checklist

- [ ] JWT_SECRET configurado (`wrangler secret put JWT_SECRET`)
- [ ] Cuenta SendGrid creada
- [ ] SENDGRID_API_KEY configurado (`wrangler secret put SENDGRID_API_KEY`)
- [ ] Worker desplegado (`wrangler deploy`)
- [ ] Test de login pasado (JWT funciona)
- [ ] Test de OTP pasado (email recibido)

---

## 🔄 Actualizar un secret

```bash
# Actualizar valor existente
wrangler secret put JWT_SECRET

# Eliminar secret (si es necesario)
wrangler secret delete JWT_SECRET
```

---

## 🆘 Troubleshooting

### Error: "Invalid JWT"
- Verificar que JWT_SECRET está configurado
- Redeploy: `wrangler deploy`

### Error: "Error enviando email"
- Verificar SENDGRID_API_KEY correcto
- Verificar que API Key tiene permisos "Mail Send"
- Verificar sender verificado en SendGrid

### Error: "Secret not found"
- Ejecutar `wrangler secret list` para verificar
- Reconfigurar con `wrangler secret put NOMBRE_SECRET`

---

## 📚 Referencias

- **Wrangler Secrets**: https://developers.cloudflare.com/workers/configuration/secrets/
- **SendGrid API**: https://docs.sendgrid.com/api-reference/mail-send/mail-send
- **SendGrid Free Tier**: https://sendgrid.com/pricing/

---

**Última actualización**: 2026-01-13
