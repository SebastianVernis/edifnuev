#!/bin/bash

# Script para crear archivos del sistema de onboarding
# Edificio Admin SAAS

echo "Creando archivos del sistema de onboarding..."

# Crear handler de onboarding
cat > src/handlers/onboarding.js << 'EOF'
import { addCorsHeaders } from '../middleware/cors.js';
import { generateToken } from '../middleware/auth.js';
import { sendWelcomeEmail } from '../utils/smtp.js';
import Usuario from '../models/Usuario.js';

const PLANS = {
  basico: { name: 'Básico', price: 499, maxUnits: 20 },
  profesional: { name: 'Profesional', price: 999, maxUnits: 50 },
  empresarial: { name: 'Empresarial', price: 1999, maxUnits: 200 },
  personalizado: { name: 'Personalizado', price: 0, maxUnits: -1 },
};

export async function register(request, env) {
  try {
    const data = await request.json();
    const { email, fullName, phone, buildingName, selectedPlan } = data;
    if (!email || !email.includes('@')) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false, msg: 'Email inválido'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } }), request);
    }
    const existingUser = await Usuario.getByEmail(request.db, email);
    if (existingUser) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false, msg: 'Este email ya está registrado'
      }), { status: 409, headers: { 'Content-Type': 'application/json' } }), request);
    }
    await request.db.prepare(\`
      INSERT OR REPLACE INTO pending_users (email, full_name, phone, building_name, selected_plan)
      VALUES (?, ?, ?, ?, ?)
    \`).bind(email, fullName, phone || null, buildingName, selectedPlan).run();
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true, msg: 'Registro iniciado correctamente'
    }), { status: 201, headers: { 'Content-Type': 'application/json' } }), request);
  } catch (error) {
    console.error('Error en register:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false, msg: 'Error interno del servidor'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } }), request);
  }
}

export async function checkout(request, env) {
  try {
    const data = await request.json();
    const { email, cardNumber } = data;
    const pendingUser = await request.db.prepare(\`
      SELECT * FROM pending_users WHERE email = ? AND otp_verified = 1
    \`).bind(email).first();
    if (!pendingUser) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false, msg: 'Debes verificar tu email primero'
      }), { status: 403, headers: { 'Content-Type': 'application/json' } }), request);
    }
    const transactionId = \`TXN-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
    const plan = PLANS[pendingUser.selected_plan];
    await request.db.prepare(\`
      INSERT INTO mockup_payments (pending_user_id, plan, amount, card_last_four, transaction_id)
      VALUES (?, ?, ?, ?, ?)
    \`).bind(pendingUser.id, pendingUser.selected_plan, plan.price, cardNumber.slice(-4), transactionId).run();
    await request.db.prepare(\`UPDATE pending_users SET checkout_completed = 1 WHERE email = ?\`).bind(email).run();
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true, msg: 'Pago procesado correctamente', data: { transactionId }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }), request);
  } catch (error) {
    console.error('Error en checkout:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false, msg: 'Error procesando el pago'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } }), request);
  }
}

export async function setupBuilding(request, env) {
  try {
    const data = await request.json();
    const { email, buildingData, adminPassword } = data;
    const pendingUser = await request.db.prepare(\`
      SELECT * FROM pending_users WHERE email = ? AND checkout_completed = 1
    \`).bind(email).first();
    if (!pendingUser) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false, msg: 'Completa los pasos anteriores primero'
      }), { status: 403, headers: { 'Content-Type': 'application/json' } }), request);
    }
    const buildingResult = await request.db.prepare(\`
      INSERT INTO buildings (name, address, total_units, building_type, monthly_fee, cutoff_day, setup_completed)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    \`).bind(
      buildingData.name, buildingData.address, buildingData.totalUnits,
      buildingData.type || 'edificio', buildingData.monthlyFee || 0, buildingData.cutoffDay || 1
    ).run();
    const buildingId = buildingResult.meta.last_row_id;
    const userResult = await Usuario.create(request.db, {
      name: pendingUser.full_name, email: pendingUser.email, password: adminPassword,
      role: 'ADMIN', phone: pendingUser.phone, building_id: buildingId,
    });
    await request.db.prepare(\`UPDATE pending_users SET setup_completed = 1 WHERE email = ?\`).bind(email).run();
    const token = await generateToken({ id: userResult.id, rol: 'ADMIN' }, env);
    await sendWelcomeEmail({ email: pendingUser.email, name: pendingUser.full_name, buildingName: buildingData.name }, env);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true, msg: 'Configuración completada', token, usuario: userResult
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }), request);
  } catch (error) {
    console.error('Error en setupBuilding:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false, msg: 'Error en la configuración'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } }), request);
  }
}
EOF

echo "✓ Handler onboarding creado"

# Crear handler de invitaciones
cat > src/handlers/invitations.js << 'EOF'
import { addCorsHeaders } from '../middleware/cors.js';
import { sendInvitationEmail } from '../utils/smtp.js';
import Usuario from '../models/Usuario.js';

function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function sendInvitation(request, env) {
  try {
    const data = await request.json();
    const { email, name, role, department, buildingId } = data;
    const invitedBy = request.usuario.id;
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await request.db.prepare(\`
      INSERT INTO invitations (token, email, name, role, building_id, department, invited_by, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    \`).bind(token, email, name, role, buildingId, department || null, invitedBy, expiresAt.toISOString()).run();
    const building = await request.db.prepare(\`SELECT name FROM buildings WHERE id = ?\`).bind(buildingId).first();
    await sendInvitationEmail({
      token, email, name, role, buildingName: building.name,
      invitedByName: request.usuario.nombre, expiresAt: expiresAt.toISOString()
    }, env);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true, msg: 'Invitación enviada correctamente'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }), request);
  } catch (error) {
    console.error('Error en sendInvitation:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false, msg: 'Error enviando invitación'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } }), request);
  }
}

export async function validateToken(request, env) {
  try {
    const url = new URL(request.url);
    const token = url.pathname.split('/').pop();
    const invitation = await request.db.prepare(\`
      SELECT * FROM invitations WHERE token = ? AND status = 'pending'
    \`).bind(token).first();
    if (!invitation) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false, msg: 'Invitación no encontrada o ya utilizada'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } }), request);
    }
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (now > expiresAt) {
      await request.db.prepare(\`UPDATE invitations SET status = 'expired' WHERE token = ?\`).bind(token).run();
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false, msg: 'Invitación expirada'
      }), { status: 410, headers: { 'Content-Type': 'application/json' } }), request);
    }
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true, invitation: { email: invitation.email, name: invitation.name, role: invitation.role }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }), request);
  } catch (error) {
    console.error('Error en validateToken:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false, msg: 'Error validando invitación'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } }), request);
  }
}

export async function activateInvitation(request, env) {
  try {
    const data = await request.json();
    const { token, password } = data;
    const invitation = await request.db.prepare(\`
      SELECT * FROM invitations WHERE token = ? AND status = 'pending'
    \`).bind(token).first();
    if (!invitation) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false, msg: 'Invitación no válida'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } }), request);
    }
    const userResult = await Usuario.create(request.db, {
      name: invitation.name, email: invitation.email, password,
      role: invitation.role, unit: invitation.department, building_id: invitation.building_id,
    });
    await request.db.prepare(\`UPDATE invitations SET status = 'accepted', accepted_at = datetime('now') WHERE token = ?\`).bind(token).run();
    return addCorsHeaders(new Response(JSON.stringify({
      ok: true, msg: 'Cuenta activada correctamente', usuario: userResult
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }), request);
  } catch (error) {
    console.error('Error en activateInvitation:', error);
    return addCorsHeaders(new Response(JSON.stringify({
      ok: false, msg: 'Error activando cuenta'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } }), request);
  }
}
EOF

echo "✓ Handler invitations creado"

echo ""
echo "Archivos backend creados exitosamente!"
echo "Ahora ejecuta: chmod +x create_onboarding_files.sh"

