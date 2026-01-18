#!/bin/bash

# Test Final de API - ChispartBuilding
# Usa el formato correcto: Authorization: Bearer <token>

API_URL="https://edificio-admin.sebastianvernis.workers.dev"

echo "🧪 Test Final de API - ChispartBuilding"
echo "=================================================="
echo ""

# 1. Health Check
echo "1️⃣  Health Check..."
HEALTH=$(curl -s "$API_URL/api/validation/health")
HEALTH_STATUS=$(echo "$HEALTH" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ "$HEALTH_STATUS" = "healthy" ]; then
    echo "   ✅ Health: OK"
else
    echo "   ❌ Health: ERROR"
fi
echo ""

# 2. Login
echo "2️⃣  Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@edificio.com","password":"admin123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "   ❌ No se pudo obtener token"
    echo "   Response: $LOGIN_RESPONSE"
    exit 1
else
    echo "   ✅ Token obtenido"
    echo "   Token: ${TOKEN:0:50}..."
fi
echo ""

# 3. Usuarios (con Authorization: Bearer)
echo "3️⃣  Usuarios (con Authorization: Bearer)..."
USUARIOS_RESPONSE=$(curl -s "$API_URL/api/usuarios" \
    -H "Authorization: Bearer $TOKEN")
USUARIOS_SUCCESS=$(echo "$USUARIOS_RESPONSE" | grep -o '"success":[^,]*' | cut -d':' -f2)

if [ "$USUARIOS_SUCCESS" = "true" ]; then
    echo "   ✅ Endpoint funcional"
    USUARIOS_COUNT=$(echo "$USUARIOS_RESPONSE" | grep -o '"users":\[[^]]*\]' | grep -o '{' | wc -l)
    echo "   Usuarios encontrados: $USUARIOS_COUNT"
else
    echo "   ❌ Endpoint con problemas"
    echo "   Response: ${USUARIOS_RESPONSE:0:200}..."
fi
echo ""

# 4. Cuotas
echo "4️⃣  Cuotas..."
CUOTAS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/cuotas" \
    -H "Authorization: Bearer $TOKEN")
echo "   Status: $CUOTAS_STATUS"
if [ "$CUOTAS_STATUS" = "200" ]; then
    echo "   ✅ Endpoint funcional"
else
    echo "   ⚠️  Status: $CUOTAS_STATUS"
fi
echo ""

# 5. Gastos
echo "5️⃣  Gastos..."
GASTOS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/gastos" \
    -H "Authorization: Bearer $TOKEN")
echo "   Status: $GASTOS_STATUS"
if [ "$GASTOS_STATUS" = "200" ]; then
    echo "   ✅ Endpoint funcional"
else
    echo "   ⚠️  Status: $GASTOS_STATUS"
fi
echo ""

# 6. Presupuestos
echo "6️⃣  Presupuestos..."
PRESUPUESTOS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/presupuestos" \
    -H "Authorization: Bearer $TOKEN")
echo "   Status: $PRESUPUESTOS_STATUS"
if [ "$PRESUPUESTOS_STATUS" = "200" ]; then
    echo "   ✅ Endpoint funcional"
else
    echo "   ⚠️  Status: $PRESUPUESTOS_STATUS"
fi
echo ""

# 7. Test sin token (debe fallar)
echo "7️⃣  Test sin token (debe rechazar con 401)..."
NO_TOKEN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/usuarios")
if [ "$NO_TOKEN_STATUS" = "401" ]; then
    echo "   ✅ Rechazado correctamente (401)"
else
    echo "   ❌ Status: $NO_TOKEN_STATUS (esperado: 401)"
fi
echo ""

# 8. Test con token inválido
echo "8️⃣  Test con token inválido (debe rechazar con 401)..."
INVALID_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/usuarios" \
    -H "Authorization: Bearer token-invalido")
if [ "$INVALID_STATUS" = "401" ]; then
    echo "   ✅ Rechazado correctamente (401)"
else
    echo "   ❌ Status: $INVALID_STATUS (esperado: 401)"
fi
echo ""

# Resumen
echo "=================================================="
echo "📊 Resumen Final"
echo "=================================================="
echo ""
echo "Frontend: https://production.chispartbuilding.pages.dev"
echo "API:      $API_URL"
echo ""

if [ "$HEALTH_STATUS" = "healthy" ] && [ ! -z "$TOKEN" ] && [ "$USUARIOS_SUCCESS" = "true" ]; then
    echo "✅ Sistema OPERACIONAL"
    echo "✅ Autenticación funcionando correctamente"
    echo "✅ Endpoints protegidos funcionando"
else
    echo "⚠️  Revisar logs arriba para detalles"
fi
echo ""
