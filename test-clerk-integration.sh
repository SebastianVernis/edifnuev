#!/bin/bash

# Script de prueba para la integración de Clerk
# Este script verifica que los endpoints estén funcionando correctamente

echo "🧪 Testing Clerk Integration"
echo "=============================="
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URL base (cambiar según el entorno)
BASE_URL="http://localhost:3001"

# Función para hacer requests
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local expected_status=$4
    
    echo -n "Testing $description... "
    
    response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint")
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status: $status_code)"
        echo "   Response: $body" | head -c 100
        echo ""
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status_code)"
        echo "   Response: $body"
    fi
    echo ""
}

# 1. Test Health Check
echo "1️⃣  Health Check"
test_endpoint "GET" "/api/validation/health" "Health endpoint" 200

# 2. Test Clerk Webhook Test Endpoint
echo "2️⃣  Clerk Webhook Test"
test_endpoint "GET" "/api/webhooks/clerk/test" "Webhook test endpoint" 200

# 3. Test Clerk Auth /me endpoint (sin token - debe fallar)
echo "3️⃣  Clerk Auth /me (sin token)"
test_endpoint "GET" "/api/auth/me" "Auth /me without token" 401

# 4. Test Login tradicional (debe seguir funcionando)
echo "4️⃣  Traditional Login"
echo -n "Testing traditional login... "
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@edificio205.com","password":"Admin2025!"}')
status_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$status_code" -eq "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Status: $status_code)"
    echo "   Login successful"
else
    echo -e "${YELLOW}⚠ WARNING${NC} (Status: $status_code)"
    echo "   Response: $body"
fi
echo ""

# Resumen
echo "=============================="
echo "✅ Testing Complete"
echo ""
echo "📝 Next Steps:"
echo "   1. Configure webhook in Clerk Dashboard"
echo "   2. Test with real Clerk users"
echo "   3. Deploy to production"
echo ""
echo "📚 See CLERK_INTEGRATION_GUIDE.md for more details"
