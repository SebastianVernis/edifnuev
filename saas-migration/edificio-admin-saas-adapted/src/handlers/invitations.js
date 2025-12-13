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
    await request.db.prepare(`
      INSERT INTO invitations (token, email, name, role, building_id, department, invited_by, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(token, email, name, role, buildingId, department || null, invitedBy, expiresAt.toISOString()).run();
    const building = await request.db.prepare(`SELECT name FROM buildings WHERE id = ?`).bind(buildingId).first();
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
    const invitation = await request.db.prepare(`
      SELECT * FROM invitations WHERE token = ? AND status = 'pending'
    `).bind(token).first();
    if (!invitation) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false, msg: 'Invitación no encontrada o ya utilizada'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } }), request);
    }
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (now > expiresAt) {
      await request.db.prepare(`UPDATE invitations SET status = 'expired' WHERE token = ?`).bind(token).run();
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
    const invitation = await request.db.prepare(`
      SELECT * FROM invitations WHERE token = ? AND status = 'pending'
    `).bind(token).first();
    if (!invitation) {
      return addCorsHeaders(new Response(JSON.stringify({
        ok: false, msg: 'Invitación no válida'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } }), request);
    }
    const userResult = await Usuario.create(request.db, {
      name: invitation.name, email: invitation.email, password,
      role: invitation.role, unit: invitation.department, building_id: invitation.building_id,
    });
    await request.db.prepare(`UPDATE invitations SET status = 'accepted', accepted_at = datetime('now') WHERE token = ?`).bind(token).run();
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
