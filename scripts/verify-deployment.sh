#!/bin/bash

# Script de Verificación de Deployment
# ChispartBuilding - Cloudflare Pages + Workers

echo "🔍 Verificación de Deployment - ChispartBuilding"
echo "=================================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URLs
FRONTEND_URL="https://production.chispartbuilding.pages.dev"
API_URL="https://edificio-admin.sebastianvernis.workers.dev"
HEALTH_ENDPOINT="${API_URL}/api/validation/health"
LOGIN_ENDPOINT="${API_URL}/api/auth/login"

# 1. Verificar Frontend
echo "1️⃣  Verificando Frontend (Pages)..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "   ${GREEN}✅ Frontend: OK (HTTP $FRONTEND_STATUS)${NC}"
else
    echo -e "   ${RED}❌ Frontend: ERROR (HTTP $FRONTEND_STATUS)${NC}"
fi
echo ""

# 2. Verificar API Health
echo "2️⃣  Verificando API Health Endpoint..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_ENDPOINT")
if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "   ${GREEN}✅ Health Endpoint: OK (HTTP $HEALTH_STATUS)${NC}"
    HEALTH_RESPONSE=$(curl -s "$HEALTH_ENDPOINT")
    echo "   Response: $HEALTH_RESPONSE"
else
    echo -e "   ${RED}❌ Health Endpoint: ERROR (HTTP $HEALTH_STATUS)${NC}"
fi
echo ""

# 3. Verificar CORS
echo "3️⃣  Verificando CORS Headers..."
CORS_HEADER=$(curl -s -I "$API_URL" | grep -i "access-control-allow-origin" | cut -d' ' -f2 | tr -d '\r')
if [ ! -z "$CORS_HEADER" ]; then
    echo -e "   ${GREEN}✅ CORS: Configurado ($CORS_HEADER)${NC}"
else
    echo -e "   ${YELLOW}⚠️  CORS: No detectado${NC}"
fi
echo ""

# 4. Verificar Workers Deployment
echo "4️⃣  Verificando Workers Deployment..."
if command -v wrangler &> /dev/null; then
    echo "   Últimos deployments:"
    wrangler deployments list 2>&1 | head -5
else
    echo -e "   ${YELLOW}⚠️  Wrangler CLI no disponible${NC}"
fi
echo ""

# 5. Verificar Bundle Size
echo "5️⃣  Verificando Bundle Size..."
if [ -f "workers-build/index.js" ]; then
    BUNDLE_SIZE=$(wc -c < workers-build/index.js)
    BUNDLE_SIZE_KB=$((BUNDLE_SIZE / 1024))
    if [ $BUNDLE_SIZE_KB -lt 100 ]; then
        echo -e "   ${GREEN}✅ Bundle Size: ${BUNDLE_SIZE_KB} KB (Excelente)${NC}"
    elif [ $BUNDLE_SIZE_KB -lt 500 ]; then
        echo -e "   ${YELLOW}⚠️  Bundle Size: ${BUNDLE_SIZE_KB} KB (Aceptable)${NC}"
    else
        echo -e "   ${RED}❌ Bundle Size: ${BUNDLE_SIZE_KB} KB (Muy grande)${NC}"
    fi
else
    echo -e "   ${RED}❌ workers-build/index.js no encontrado${NC}"
fi
echo ""

# 6. Verificar Assets Frontend
echo "6️⃣  Verificando Assets Frontend..."
if [ -d "public" ]; then
    ASSET_COUNT=$(find public -type f | wc -l)
    ASSET_SIZE=$(du -sh public | cut -f1)
    echo -e "   ${GREEN}✅ Assets: $ASSET_COUNT archivos ($ASSET_SIZE)${NC}"
else
    echo -e "   ${RED}❌ Directorio public/ no encontrado${NC}"
fi
echo ""

# 7. Test de Login (opcional)
echo "7️⃣  Test de Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$LOGIN_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@edificio.com","password":"admin123"}' \
    -w "\n%{http_code}")

LOGIN_STATUS=$(echo "$LOGIN_RESPONSE" | tail -n1)
if [ "$LOGIN_STATUS" = "200" ]; then
    echo -e "   ${GREEN}✅ Login: OK (HTTP $LOGIN_STATUS)${NC}"
else
    echo -e "   ${RED}❌ Login: ERROR (HTTP $LOGIN_STATUS)${NC}"
fi
echo ""

# Resumen
echo "=================================================="
echo "📊 Resumen de Verificación"
echo "=================================================="
echo ""
echo "Frontend URL: $FRONTEND_URL"
echo "API URL: $API_URL"
echo ""

if [ "$FRONTEND_STATUS" = "200" ] && [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Deployment: OPERACIONAL${NC}"
elif [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "${YELLOW}⚠️  Deployment: PARCIAL (Frontend OK, API con problemas)${NC}"
else
    echo -e "${RED}❌ Deployment: CON PROBLEMAS${NC}"
fi
echo ""
