#!/bin/bash

# Test de API Endpoints - ChispartBuilding
# Verifica todos los endpoints principales

API_URL="https://edificio-admin.sebastianvernis.workers.dev"

echo "🧪 Test de API Endpoints"
echo "=================================================="
echo ""

# 1. Health Check
echo "1️⃣  Health Check..."
HEALTH=$(curl -s "$API_URL/api/validation/health")
echo "   Response: $HEALTH"
echo ""

# 2. Login
echo "2️⃣  Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@edificio.com","password":"admin123"}')

echo "   Response: $LOGIN_RESPONSE" | head -c 200
echo "..."
echo ""

# Extraer token
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "   ❌ No se pudo obtener token"
    exit 1
else
    echo "   ✅ Token obtenido: ${TOKEN:0:50}..."
fi
echo ""

# 3. Usuarios (endpoint protegido)
echo "3️⃣  Usuarios (con token)..."
USUARIOS=$(curl -s "$API_URL/api/usuarios" -H "x-auth-token: $TOKEN")
echo "   Response: $USUARIOS" | head -c 200
echo "..."
echo ""

# 4. Cuotas
echo "4️⃣  Cuotas (con token)..."
CUOTAS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/cuotas" -H "x-auth-token: $TOKEN")
echo "   Status: $CUOTAS_STATUS"
if [ "$CUOTAS_STATUS" = "200" ]; then
    echo "   ✅ Endpoint funcional"
else
    echo "   ❌ Endpoint con problemas"
fi
echo ""

# 5. Gastos
echo "5️⃣  Gastos (con token)..."
GASTOS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/gastos" -H "x-auth-token: $TOKEN")
echo "   Status: $GASTOS_STATUS"
if [ "$GASTOS_STATUS" = "200" ]; then
    echo "   ✅ Endpoint funcional"
else
    echo "   ❌ Endpoint con problemas"
fi
echo ""

# 6. Presupuestos
echo "6️⃣  Presupuestos (con token)..."
PRESUPUESTOS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/presupuestos" -H "x-auth-token: $TOKEN")
echo "   Status: $PRESUPUESTOS_STATUS"
if [ "$PRESUPUESTOS_STATUS" = "200" ]; then
    echo "   ✅ Endpoint funcional"
else
    echo "   ❌ Endpoint con problemas"
fi
echo ""

# 7. Test sin token (debe fallar)
echo "7️⃣  Test sin token (debe rechazar)..."
NO_TOKEN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/usuarios")
echo "   Status: $NO_TOKEN_STATUS"
if [ "$NO_TOKEN_STATUS" = "401" ]; then
    echo "   ✅ Rechazado correctamente"
else
    echo "   ❌ Debería rechazar con 401"
fi
echo ""

# Resumen
echo "=================================================="
echo "📊 Resumen"
echo "=================================================="
echo ""
echo "API URL: $API_URL"
echo "Token: ${TOKEN:0:50}..."
echo ""
echo "✅ Test completado"
