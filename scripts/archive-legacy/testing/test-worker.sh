#!/bin/bash
URL="https://edificio-admin.sebastianvernis.workers.dev"

echo "🧪 Testing Cloudflare Worker..."
echo ""

# Test 1: Health check
echo "1. Health Check:"
node -e "
fetch('$URL/api/validation/health')
  .then(r => r.json())
  .then(d => console.log(JSON.stringify(d, null, 2)))
  .catch(e => console.log('Error:', e.message))
"
echo ""

# Test 2: Login
echo "2. Login Test:"
node -e "
fetch('$URL/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({email: 'admin@edificio.com', password: 'admin123'})
})
  .then(r => r.json())
  .then(d => console.log(JSON.stringify(d, null, 2)))
  .catch(e => console.log('Error:', e.message))
"
echo ""

# Test 3: Frontend
echo "3. Frontend Test:"
node -e "
fetch('$URL/')
  .then(r => r.text())
  .then(d => console.log(d.includes('Edificio Admin') ? '✅ Frontend loaded' : '❌ Frontend error'))
  .catch(e => console.log('Error:', e.message))
"
