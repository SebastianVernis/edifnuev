#!/bin/bash

# Test manual de endpoints
echo "=== Test Manual de Endpoints ==="
echo ""

# 1. Login
echo "1. Login..."
LOGIN_RESPONSE=$(curl -s http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@edificio205.com","password":"Gemelo1"}')

echo "Login response: $LOGIN_RESPONSE"
echo ""

# Extraer token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Token: $TOKEN"
echo ""

# 2. Test GET /api/fondos
echo "2. GET /api/fondos"
curl -s http://localhost:3001/api/fondos -H "x-auth-token: $TOKEN"
echo ""
echo ""

# 3. Test GET /api/fondos/patrimonio
echo "3. GET /api/fondos/patrimonio"
curl -s http://localhost:3001/api/fondos/patrimonio -H "x-auth-token: $TOKEN"
echo ""
echo ""

# 4. Test GET /api/cuotas/stats
echo "4. GET /api/cuotas/stats"
curl -s http://localhost:3001/api/cuotas/stats -H "x-auth-token: $TOKEN"
echo ""
echo ""

# 5. Test GET /api/cuotas/pendientes
echo "5. GET /api/cuotas/pendientes"
curl -s http://localhost:3001/api/cuotas/pendientes -H "x-auth-token: $TOKEN"
echo ""
echo ""

# 6. Test POST /api/cuotas/verificar-vencimientos
echo "6. POST /api/cuotas/verificar-vencimientos"
curl -s -X POST http://localhost:3001/api/cuotas/verificar-vencimientos -H "x-auth-token: $TOKEN"
echo ""
echo ""

# 7. Test GET /api/gastos/stats
echo "7. GET /api/gastos/stats"
curl -s http://localhost:3001/api/gastos/stats -H "x-auth-token: $TOKEN"
echo ""
echo ""

# 8. Test GET /api/parcialidades/pagos
echo "8. GET /api/parcialidades/pagos"
curl -s http://localhost:3001/api/parcialidades/pagos -H "x-auth-token: $TOKEN"
echo ""
echo ""

# 9. Test GET /api/parcialidades/estado
echo "9. GET /api/parcialidades/estado"
curl -s http://localhost:3001/api/parcialidades/estado -H "x-auth-token: $TOKEN"
echo ""
