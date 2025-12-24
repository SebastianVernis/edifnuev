/**
 * Módulo para invitar usuarios por email
 */

const API_URL = window.location.origin;

// Función para mostrar modal de invitación
function mostrarModalInvitacion() {
    const modal = document.createElement('div');
    modal.id = 'modalInvitacion';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;';
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 10px; padding: 2rem; max-width: 500px; width: 90%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="margin: 0;">Invitar Usuario</h2>
                <button onclick="cerrarModalInvitacion()" style="border: none; background: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
            </div>

            <div id="alertInvitacion" style="display: none; padding: 1rem; border-radius: 5px; margin-bottom: 1rem;"></div>

            <form id="formInvitacion">
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Email *</label>
                    <input type="email" id="invEmail" required style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px;">
                </div>

                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Nombre completo *</label>
                    <input type="text" id="invNombre" required style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px;">
                </div>

                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Rol *</label>
                    <select id="invRol" required style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px;">
                        <option value="">Seleccionar rol</option>
                        <option value="ADMIN">Administrador</option>
                        <option value="COMITE">Comité</option>
                        <option value="INQUILINO">Inquilino</option>
                    </select>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Departamento/Unidad</label>
                    <input type="text" id="invDepartamento" placeholder="Ej: 101" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 5px;">
                </div>

                <div style="display: flex; gap: 1rem;">
                    <button type="button" onclick="cerrarModalInvitacion()" style="flex: 1; padding: 0.75rem; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">Cancelar</button>
                    <button type="submit" style="flex: 1; padding: 0.75rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 5px; cursor: pointer;">Enviar Invitación</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Event listener del formulario
    document.getElementById('formInvitacion').addEventListener('submit', enviarInvitacion);
}

// Función para cerrar modal
window.cerrarModalInvitacion = function() {
    const modal = document.getElementById('modalInvitacion');
    if (modal) {
        modal.remove();
    }
};

// Función para mostrar alerta en el modal
function mostrarAlertaInvitacion(mensaje, tipo = 'error') {
    const alert = document.getElementById('alertInvitacion');
    alert.style.display = 'block';
    alert.style.background = tipo === 'error' ? '#f8d7da' : '#d4edda';
    alert.style.color = tipo === 'error' ? '#721c24' : '#155724';
    alert.textContent = mensaje;

    setTimeout(() => {
        alert.style.display = 'none';
    }, 5000);
}

// Función para enviar invitación
async function enviarInvitacion(e) {
    e.preventDefault();

    const email = document.getElementById('invEmail').value.trim();
    const name = document.getElementById('invNombre').value.trim();
    const role = document.getElementById('invRol').value;
    const departamento = document.getElementById('invDepartamento').value.trim();

    if (!email || !name || !role) {
        mostrarAlertaInvitacion('Por favor completa todos los campos requeridos');
        return;
    }

    if (!email.includes('@')) {
        mostrarAlertaInvitacion('Por favor ingresa un email válido');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        mostrarAlertaInvitacion('No estás autenticado. Por favor inicia sesión.');
        return;
    }

    // Deshabilitar botón
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    try {
        const response = await fetch(`${API_URL}/api/invitations/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email, name, role, departamento })
        });

        const data = await response.json();

        if (data.ok) {
            mostrarAlertaInvitacion('Invitación enviada correctamente', 'success');
            
            // Cerrar modal después de 1.5 segundos
            setTimeout(() => {
                cerrarModalInvitacion();
                // Recargar lista de usuarios si existe la función
                if (typeof cargarUsuarios === 'function') {
                    cargarUsuarios();
                }
            }, 1500);
        } else {
            mostrarAlertaInvitacion(data.msg || 'Error al enviar la invitación');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enviar Invitación';
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlertaInvitacion('Error de conexión. Por favor intenta nuevamente.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar Invitación';
    }
}

// Exponer función globalmente
window.mostrarModalInvitacion = mostrarModalInvitacion;
