#!/bin/bash

# 🧪 Script de Validación Completa - Bug #2
# Ejecuta todos los tests de validación del Bug #2

echo ""
echo "════════════════════════════════════════════════════════════════════════════════"
echo "🧪 VALIDACIÓN COMPLETA - BUG #2: Timeout en campo password de setup"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""
echo "📋 Información del Bug:"
echo "  - Bug ID: #2"
echo "  - Archivo: setup-edificio.html"
echo "  - Commit Fix: 72f7c03"
echo "  - Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""

# Contador de tests
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test 1: Validación HTML
echo "🔍 TEST 1: Validación HTML Estática"
echo "────────────────────────────────────────────────────────────────────────────────"
node tests/bug2-html-validation.test.js
TEST1_RESULT=$?
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ $TEST1_RESULT -eq 0 ]; then
  PASSED_TESTS=$((PASSED_TESTS + 1))
  echo ""
  echo "✅ TEST 1: PASADO"
else
  FAILED_TESTS=$((FAILED_TESTS + 1))
  echo ""
  echo "❌ TEST 1: FALLADO"
fi
echo ""
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""

# Test 2: Validación de Selectores
echo "🔍 TEST 2: Validación de Selectores CSS"
echo "────────────────────────────────────────────────────────────────────────────────"
node tests/bug2-selector-validation.test.js
TEST2_RESULT=$?
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ $TEST2_RESULT -eq 0 ]; then
  PASSED_TESTS=$((PASSED_TESTS + 1))
  echo ""
  echo "✅ TEST 2: PASADO"
else
  FAILED_TESTS=$((FAILED_TESTS + 1))
  echo ""
  echo "❌ TEST 2: FALLADO"
fi
echo ""
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""

# Resumen Final
echo "📊 RESUMEN DE VALIDACIÓN"
echo "────────────────────────────────────────────────────────────────────────────────"
echo ""
echo "  Total de tests ejecutados: $TOTAL_TESTS"
echo "  ✅ Tests pasados: $PASSED_TESTS"
echo "  ❌ Tests fallados: $FAILED_TESTS"
echo ""
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""

# Resultado final
if [ $FAILED_TESTS -eq 0 ]; then
  echo "🎉 ÉXITO: Bug #2 CORREGIDO Y VALIDADO"
  echo ""
  echo "✅ Todos los campos tienen atributo name"
  echo "✅ Campo password accesible sin timeout"
  echo "✅ Selectores Playwright funcionan correctamente"
  echo "✅ Commit 72f7c03 validado exitosamente"
  echo ""
  echo "📄 Reporte completo: test-reports/BUG2-VALIDATION-REPORT.md"
  echo ""
  exit 0
else
  echo "❌ ERROR: Algunos tests fallaron"
  echo ""
  echo "❌ Bug #2 NO está completamente corregido"
  echo "❌ Revisar los tests fallados arriba"
  echo ""
  exit 1
fi
