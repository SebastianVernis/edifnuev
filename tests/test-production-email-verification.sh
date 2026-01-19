#!/bin/bash

# Test de Verificación de Email en Producción
# Prueba la API desplegada en Cloudflare Workers

API_URL="https://edificio-admin.sebastianvernis.workers.dev"

echo "🧪 Testing Email Verification en Producción"
echo "=============================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Email válido
echo -e "${YELLOW}Test 1: Email válido (test@gmail.com)${NC}"
response=$(curl -s -X POST "$API_URL/api/onboarding/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gmail.com",
    "fullName": "Test User",
    "buildingName": "Test Building",
    "selectedPlan": "basico"
  }')

if echo "$response" | grep -q '"ok":true'; then
  echo -e "${GREEN}✅ PASS - Email válido aceptado${NC}"
else
  echo -e "${RED}❌ FAIL - Email válido rechazado${NC}"
  echo "Response: $response"
fi
echo ""

# Test 2: Email desechable
echo -e "${YELLOW}Test 2: Email desechable (fake@mailinator.com)${NC}"
response=$(curl -s -X POST "$API_URL/api/onboarding/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "fake@mailinator.com",
    "fullName": "Fake User",
    "buildingName": "Test Building",
    "selectedPlan": "basico"
  }')

if echo "$response" | grep -q '"reason":"disposable_email"'; then
  echo -e "${GREEN}✅ PASS - Email desechable rechazado${NC}"
else
  echo -e "${RED}❌ FAIL - Email desechable no detectado${NC}"
  echo "Response: $response"
fi
echo ""

# Test 3: Email con typo
echo -e "${YELLOW}Test 3: Email con typo (test@gmial.com)${NC}"
response=$(curl -s -X POST "$API_URL/api/onboarding/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gmial.com",
    "fullName": "Typo User",
    "buildingName": "Test Building",
    "selectedPlan": "basico"
  }')

if echo "$response" | grep -q '"suggestion":"test@gmail.com"'; then
  echo -e "${GREEN}✅ PASS - Typo detectado con sugerencia${NC}"
else
  echo -e "${YELLOW}⚠️  WARN - Sugerencia no encontrada (puede ser válido)${NC}"
  echo "Response: $response"
fi
echo ""

# Test 4: Email inválido
echo -e "${YELLOW}Test 4: Email inválido (invalid-email)${NC}"
response=$(curl -s -X POST "$API_URL/api/onboarding/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "fullName": "Invalid User",
    "buildingName": "Test Building",
    "selectedPlan": "basico"
  }')

if echo "$response" | grep -q '"ok":false'; then
  echo -e "${GREEN}✅ PASS - Email inválido rechazado${NC}"
else
  echo -e "${RED}❌ FAIL - Email inválido aceptado${NC}"
  echo "Response: $response"
fi
echo ""

echo "=============================================="
echo "✨ Tests completados"
