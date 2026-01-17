// Configuración Module
const API_BASE = '/api';
let proyectos = [];
let currentUser = null;

// Cargar proyectos al mostrar la sección
export async function initConfiguracion() {
  console.log('Inicializando módulo de configuración...');
  
  // Obtener usuario actual
  const authModule = window.Auth || localStorage;
  currentUser = authModule.getCurrentUser ? authModule.getCurrentUser() : JSON.parse(localStorage.getItem('usuario'));
  
  await cargarProyectos();
  await cargarInfoGeneral();
  await cargarPerfilUsuario();
  await cargarInfoEdificio();
  await cargarDocumentos();
  setupEventListeners();
  setupTabs();
}

// Cargar proyectos críticos
async function cargarProyectos() {
  try {
    const token = localStorage.getItem('edificio_token') || localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/proyectos`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.ok) {
      proyectos = data.proyectos;
      renderProyectos(data.proyectos, data.resumen);
    } else {
      console.error('Error al cargar proyectos:', data.msg);
    }
  } catch (error) {
    console.error('Error al cargar proyectos:', error);
  }
}

// Renderizar lista de proyectos
function renderProyectos(proyectosData, resumen) {
  const container = document.getElementById('proyectos-list');
  if (!container) return;
  
  if (proyectosData.length === 0) {
    container.innerHTML = '<p class="empty-message">No hay proyectos configurados</p>';
    return;
  }
  
  const totalMonto = resumen?.total || 0;
  const montoPorDepto = resumen?.porDepartamento || 0;
  
  container.innerHTML = `
    <div class="proyectos-summary">
      <p><strong>Total:</strong> $${totalMonto.toLocaleString()} MXN</p>
      <p><strong>Por Departamento:</strong> $${montoPorDepto.toLocaleString()} MXN</p>
    </div>
    <div class="proyectos-items">
      ${proyectosData.map(p => `
        <div class="proyecto-item" data-id="${p.id}">
          <div class="proyecto-info">
            <h4>${p.nombre}</h4>
            <p class="proyecto-monto">$${p.monto.toLocaleString()} MXN</p>
            <span class="badge badge-${p.prioridad.toLowerCase()}">${p.prioridad}</span>
          </div>
          <div class="proyecto-actions">
            <button class="btn btn-sm btn-secondary edit-proyecto" data-id="${p.id}">
              <i class="fas fa-edit"></i> Editar
            </button>
            <button class="btn btn-sm btn-danger delete-proyecto" data-id="${p.id}">
              <i class="fas fa-trash"></i> Eliminar
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  
  // Event listeners para botones de acción
  container.querySelectorAll('.edit-proyecto').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.dataset.id);
      editarProyecto(id);
    });
  });
  
  container.querySelectorAll('.delete-proyecto').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.dataset.id);
      eliminarProyecto(id);
    });
  });
}

// Cargar información general
async function cargarInfoGeneral() {
  try {
    const token = localStorage.getItem('edificio_token') || localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/usuarios`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.ok) {
      const totalDeptos = data.usuarios.filter(u => u.departamento !== 'Admin').length;
      const configTotalDeptos = document.getElementById('config-total-deptos');
      if (configTotalDeptos) configTotalDeptos.textContent = totalDeptos;
    }
  } catch (error) {
    console.error('Error al cargar información general:', error);
  }
}

// Setup tabs
function setupTabs() {
  console.log('🔧 Configurando tabs...');
  const tabBtns = document.querySelectorAll('.tab-btn');
  console.log(`   Botones encontrados: ${tabBtns.length}`);
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      console.log(`   📑 Cambiando a tab: ${tabName}`);
      
      // Remover active de todos los botones
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Remover active de todos los contenidos
      document.querySelectorAll('.config-tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
      });
      
      // Activar el contenido correspondiente
      const tabContent = document.getElementById(`tab-${tabName}`);
      if (tabContent) {
        tabContent.classList.add('active');
        tabContent.style.display = 'block';
        console.log(`   ✅ Tab ${tabName} activado`);
      } else {
        console.error(`   ❌ Tab content #tab-${tabName} no encontrado`);
      }
    });
  });
}

// Setup event listeners
function setupEventListeners() {
  // Botón nuevo proyecto
  const nuevoProyectoBtn = document.getElementById('nuevo-proyecto-btn');
  if (nuevoProyectoBtn) {
    nuevoProyectoBtn.addEventListener('click', () => {
      abrirModalProyecto();
    });
  }
  
  // Modal proyecto
  const proyectoModal = document.getElementById('proyecto-modal');
  const proyectoForm = document.getElementById('proyecto-form');
  
  if (proyectoModal) {
    const closeBtn = proyectoModal.querySelector('.close');
    const closeBtns = proyectoModal.querySelectorAll('.close-modal');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        proyectoModal.style.display = 'none';
      });
    }
    
    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        proyectoModal.style.display = 'none';
      });
    });
    
    window.addEventListener('click', (e) => {
      if (e.target === proyectoModal) {
        proyectoModal.style.display = 'none';
      }
    });
  }
  
  if (proyectoForm) {
    proyectoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await guardarProyecto();
    });
  }
  
  // Form de perfil
  const perfilForm = document.getElementById('perfil-form');
  if (perfilForm) {
    perfilForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await guardarPerfil();
    });
  }
  
  // Form de edificio
  const edificioForm = document.getElementById('edificio-form');
  if (edificioForm) {
    edificioForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await guardarInfoEdificio();
    });
  }
  
  // Botón descargar políticas
  const descargarPoliticasBtn = document.getElementById('descargar-politicas-btn');
  if (descargarPoliticasBtn) {
    descargarPoliticasBtn.addEventListener('click', descargarPoliticas);
  }
  
  // Form de documentos
  const documentoForm = document.getElementById('documento-form');
  if (documentoForm) {
    documentoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await subirDocumento();
    });
  }
}

// Abrir modal para nuevo proyecto
function abrirModalProyecto(proyectoData = null) {
  const modal = document.getElementById('proyecto-modal');
  const modalTitle = document.getElementById('proyecto-modal-title');
  const form = document.getElementById('proyecto-form');
  
  if (!modal || !form) return;
  
  // Resetear form
  form.reset();
  document.getElementById('proyecto-id').value = '';
  
  if (proyectoData) {
    // Editar
    modalTitle.textContent = 'Editar Proyecto';
    document.getElementById('proyecto-id').value = proyectoData.id;
    document.getElementById('proyecto-nombre').value = proyectoData.nombre;
    document.getElementById('proyecto-monto').value = proyectoData.monto;
    document.getElementById('proyecto-prioridad').value = proyectoData.prioridad;
  } else {
    // Nuevo
    modalTitle.textContent = 'Nuevo Proyecto';
  }
  
  modal.style.display = 'block';
}

// Editar proyecto
function editarProyecto(id) {
  const proyecto = proyectos.find(p => p.id === id);
  if (proyecto) {
    abrirModalProyecto(proyecto);
  }
}

// Guardar proyecto (crear o actualizar)
async function guardarProyecto() {
  const id = document.getElementById('proyecto-id').value;
  const nombre = document.getElementById('proyecto-nombre').value;
  const monto = parseFloat(document.getElementById('proyecto-monto').value);
  const prioridad = document.getElementById('proyecto-prioridad').value;
  
  if (!nombre || !monto || !prioridad) {
    alert('Por favor completa todos los campos');
    return;
  }
  
  try {
    const token = localStorage.getItem('edificio_token') || localStorage.getItem('token');
    const url = id ? `${API_BASE}/proyectos/${id}` : `${API_BASE}/proyectos`;
    const method = id ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ nombre, monto, prioridad })
    });
    
    const data = await response.json();
    
    if (data.ok) {
      document.getElementById('proyecto-modal').style.display = 'none';
      await cargarProyectos();
      alert(data.msg);
    } else {
      alert(data.msg);
    }
  } catch (error) {
    console.error('Error al guardar proyecto:', error);
    alert('Error al guardar proyecto');
  }
}

// Eliminar proyecto
async function eliminarProyecto(id) {
  if (!confirm('¿Estás seguro de eliminar este proyecto?')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('edificio_token') || localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/proyectos/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.ok) {
      await cargarProyectos();
      alert(data.msg);
    } else {
      alert(data.msg);
    }
  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
    alert('Error al eliminar proyecto');
  }
}

// Cargar perfil de usuario
async function cargarPerfilUsuario() {
  try {
    // Obtener usuario actual del token
    const authUser = window.Auth?.getCurrentUser();
    if (authUser) {
      currentUser = authUser;
    }
    
    if (!currentUser) {
      console.warn('No hay usuario actual');
      return;
    }
    
    console.log('👤 Cargando perfil:', currentUser.nombre);
    
    document.getElementById('perfil-nombre').value = currentUser.nombre || '';
    document.getElementById('perfil-email').value = currentUser.email || '';
    document.getElementById('perfil-telefono').value = currentUser.telefono || '';
    document.getElementById('perfil-departamento').value = currentUser.departamento || '';
    
    console.log('✅ Perfil cargado');
  } catch (error) {
    console.error('Error al cargar perfil:', error);
  }
}

// Guardar perfil de usuario
async function guardarPerfil() {
  const nombre = document.getElementById('perfil-nombre').value;
  const email = document.getElementById('perfil-email').value;
  const telefono = document.getElementById('perfil-telefono').value;
  const passwordActual = document.getElementById('perfil-password-actual').value;
  const passwordNueva = document.getElementById('perfil-password-nueva').value;
  const passwordConfirmar = document.getElementById('perfil-password-confirmar').value;
  
  // Validar contraseñas si se están cambiando
  if (passwordNueva || passwordConfirmar) {
    if (!passwordActual) {
      alert('Debes ingresar tu contraseña actual');
      return;
    }
    if (passwordNueva !== passwordConfirmar) {
      alert('Las contraseñas no coinciden');
      return;
    }
    if (passwordNueva.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }
  }
  
  try {
    const token = localStorage.getItem('edificio_token') || localStorage.getItem('token');
    
    // 1. Actualizar datos del perfil
    const updateRes = await fetch(`${API_BASE}/usuarios/${currentUser.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ nombre, email, telefono })
    });
    
    if (!updateRes.ok) {
      const error = await updateRes.json();
      alert('❌ ' + (error.message || 'Error al actualizar datos'));
      return;
    }
    
    console.log('✅ Datos actualizados');
    
    // 2. Cambiar contraseña si se proporcionó
    if (passwordNueva) {
      const passwordRes = await fetch(`${API_BASE}/usuarios/cambiar-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          passwordActual,
          passwordNueva
        })
      });
      
      const passwordData = await passwordRes.json();
      
      if (!passwordData.success) {
        alert('⚠️ Datos actualizados pero error al cambiar contraseña: ' + passwordData.message);
        return;
      }
      
      console.log('✅ Contraseña actualizada');
      
      // Limpiar campos de contraseña
      document.getElementById('perfil-password-actual').value = '';
      document.getElementById('perfil-password-nueva').value = '';
      document.getElementById('perfil-password-confirmar').value = '';
      
      alert('✅ Perfil y contraseña actualizados exitosamente');
    } else {
      alert('✅ Datos del perfil actualizados exitosamente');
    }
    
    // Recargar perfil
    await cargarPerfilUsuario();
    
  } catch (error) {
    console.error('Error al guardar perfil:', error);
    alert('❌ Error al guardar perfil');
  }
}

// Cargar información del edificio
async function cargarInfoEdificio() {
  try {
    const token = localStorage.getItem('edificio_token') || localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/onboarding/building-info`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.ok) {
      const info = data.buildingInfo;
      document.getElementById('edificio-nombre').value = info.nombre || '';
      document.getElementById('edificio-direccion').value = info.direccion || '';
      document.getElementById('edificio-total-unidades').value = info.totalUnidades || 20;
      document.getElementById('edificio-cuota-mensual').value = info.cuotaMensual || 1500;
      document.getElementById('edificio-dia-corte').value = info.diaCorte || 1;
      
      // Nuevos campos de configuración de cuotas
      const diasGraciaEl = document.getElementById('edificio-dias-gracia');
      if (diasGraciaEl) diasGraciaEl.value = info.diasGracia || 5;
      
      const porcentajeMoraEl = document.getElementById('edificio-porcentaje-mora');
      if (porcentajeMoraEl) porcentajeMoraEl.value = info.porcentajeMora || 2;
      
      // Políticas separadas
      const reglamentoEl = document.getElementById('edificio-reglamento');
      if (reglamentoEl) reglamentoEl.value = info.reglamento || info.politicas || '';
      
      const privacyPolicyEl = document.getElementById('edificio-privacy-policy');
      if (privacyPolicyEl) privacyPolicyEl.value = info.privacyPolicy || '';
      
      const paymentPoliciesEl = document.getElementById('edificio-payment-policies');
      if (paymentPoliciesEl) paymentPoliciesEl.value = info.paymentPolicies || '';
      
      // Retrocompatibilidad
      const politicasEl = document.getElementById('edificio-politicas');
      if (politicasEl) politicasEl.value = info.politicas || info.reglamento || '';
      
      // Renderizar fondos y poblar selector de fondo de ingresos
      const funds = info.funds || [];
      renderFondos(funds);
      
      // Poblar selector de fondo de ingresos
      const fondoIngresosSelect = document.getElementById('edificio-fondo-ingresos');
      if (fondoIngresosSelect && funds.length > 0) {
        console.log('🔄 Poblando selector de fondo de ingresos...');
        console.log('   Fondos disponibles:', funds.length);
        console.log('   Fondo actual configurado:', info.fondoIngresosId);
        
        fondoIngresosSelect.innerHTML = '<option value="">Sin asignar</option>';
        funds.forEach((fund, index) => {
          const option = document.createElement('option');
          option.value = fund.id || index;
          option.textContent = `${fund.name} ($${parseFloat(fund.amount || 0).toLocaleString('es-MX')})`;
          fondoIngresosSelect.appendChild(option);
          console.log(`   Opción: value=${option.value}, text=${fund.name}`);
        });
        
        // Seleccionar el fondo actual si existe
        if (info.fondoIngresosId) {
          fondoIngresosSelect.value = info.fondoIngresosId;
          console.log(`   ✅ Fondo seleccionado: ${info.fondoIngresosId}`);
        } else {
          console.log('   ℹ️  No hay fondo de ingresos configurado');
        }
      }
    }
  } catch (error) {
    console.error('Error al cargar información del edificio:', error);
  }
}

// Renderizar fondos patrimoniales
function renderFondos(funds) {
  const container = document.getElementById('fondos-list');
  if (!container) return;
  
  if (funds.length === 0) {
    container.innerHTML = '<p class="empty-message">No hay fondos configurados</p>';
    return;
  }
  
  container.innerHTML = `
    <div class="fondos-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
      ${funds.map(fund => `
        <div class="fondo-card" style="padding: 1rem; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9;">
          <h5 style="margin: 0 0 0.5rem 0; color: #333;">${fund.name}</h5>
          <p style="margin: 0; font-size: 1.2rem; font-weight: bold; color: var(--color-primary);">
            $${(fund.amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </p>
        </div>
      `).join('')}
    </div>
  `;
}

// Guardar información del edificio
async function guardarInfoEdificio() {
  const nombre = document.getElementById('edificio-nombre').value;
  const direccion = document.getElementById('edificio-direccion').value;
  const totalUnidades = parseInt(document.getElementById('edificio-total-unidades').value);
  const cuotaMensual = parseFloat(document.getElementById('edificio-cuota-mensual').value);
  const diaCorte = parseInt(document.getElementById('edificio-dia-corte').value);
  
  // Nuevos campos
  const diasGraciaEl = document.getElementById('edificio-dias-gracia');
  const diasGracia = diasGraciaEl ? parseInt(diasGraciaEl.value) : 5;
  
  const porcentajeMoraEl = document.getElementById('edificio-porcentaje-mora');
  const porcentajeMora = porcentajeMoraEl ? parseFloat(porcentajeMoraEl.value) : 2;
  
  // Políticas separadas
  const reglamentoEl = document.getElementById('edificio-reglamento');
  const reglamento = reglamentoEl ? reglamentoEl.value : '';
  
  const privacyPolicyEl = document.getElementById('edificio-privacy-policy');
  const privacyPolicy = privacyPolicyEl ? privacyPolicyEl.value : '';
  
  const paymentPoliciesEl = document.getElementById('edificio-payment-policies');
  const paymentPolicies = paymentPoliciesEl ? paymentPoliciesEl.value : '';
  
  // Retrocompatibilidad
  const politicasEl = document.getElementById('edificio-politicas');
  const politicas = politicasEl ? politicasEl.value : reglamento;
  
  // Fondo de ingresos
  const fondoIngresosEl = document.getElementById('edificio-fondo-ingresos');
  const fondoIngresosId = fondoIngresosEl && fondoIngresosEl.value ? parseInt(fondoIngresosEl.value) : null;
  
  console.log('💾 Guardando configuración...');
  console.log('   Fondo de ingresos seleccionado:', fondoIngresosId);
  
  try {
    const token = localStorage.getItem('edificio_token') || localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/onboarding/building-info`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        nombre,
        direccion,
        totalUnidades,
        cuotaMensual,
        diaCorte,
        diasGracia,
        porcentajeMora,
        fondoIngresosId,
        politicas: reglamento, // Reglamento principal
        politicasPrivacidad: privacyPolicy,
        politicasPago: paymentPolicies
      })
    });
    
    const data = await response.json();
    
    if (data.ok) {
      alert('✅ Información del edificio actualizada exitosamente');
      
      // Recargar información para mostrar los cambios guardados
      await cargarInfoEdificio();
      
      // Actualizar dashboard si está visible
      if (typeof cargarDashboard === 'function') {
        cargarDashboard();
      }
      
      // Actualizar fondos globales si cambió el fondo de ingresos
      if (typeof cargarFondosGlobales === 'function') {
        cargarFondosGlobales();
      }
    } else {
      alert('❌ ' + (data.msg || 'Error al actualizar información'));
    }
  } catch (error) {
    console.error('Error al guardar información del edificio:', error);
    alert('❌ Error al guardar información');
  }
}

// Descargar políticas como PDF
function descargarPoliticas() {
  const reglamentoEl = document.getElementById('edificio-reglamento');
  const privacyPolicyEl = document.getElementById('edificio-privacy-policy');
  const paymentPoliciesEl = document.getElementById('edificio-payment-policies');
  const politicasEl = document.getElementById('edificio-politicas');
  
  const reglamento = reglamentoEl ? reglamentoEl.value : '';
  const privacyPolicy = privacyPolicyEl ? privacyPolicyEl.value : '';
  const paymentPolicies = paymentPoliciesEl ? paymentPoliciesEl.value : '';
  const politicas = politicasEl ? politicasEl.value : '';
  
  // Si no hay ninguna política, usar la retrocompatible
  const hasContent = reglamento || privacyPolicy || paymentPolicies || politicas;
  
  if (!hasContent) {
    alert('No hay políticas para descargar');
    return;
  }
  
  // Crear ventana con HTML imprimible
  const nombre = document.getElementById('edificio-nombre').value || 'Edificio';
  const direccion = document.getElementById('edificio-direccion').value || '';
  
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Políticas - ${nombre}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 2rem; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 3px solid #4F46E5; }
        .header h1 { color: #1F2937; margin-bottom: 0.5rem; }
        .section { margin: 2rem 0; page-break-inside: avoid; }
        .section h2 { color: #4F46E5; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid #E5E7EB; }
        .content { white-space: pre-wrap; color: #374151; }
        .footer { margin-top: 3rem; padding-top: 1rem; border-top: 2px solid #E5E7EB; text-align: center; color: #6B7280; font-size: 0.875rem; }
        .no-print { text-align: center; margin-bottom: 2rem; }
        .btn { padding: 0.75rem 1.5rem; background: #4F46E5; color: white; border: none; border-radius: 0.5rem; cursor: pointer; margin: 0 0.5rem; }
        @media print { 
          .no-print { display: none !important; }
          body { padding: 0; }
          @page { margin: 1cm; }
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <button class="btn" onclick="window.print()">📄 Descargar PDF</button>
        <button class="btn" style="background: #6B7280;" onclick="window.close()">✖ Cerrar</button>
      </div>
      
      <div class="header">
        <h1>Políticas y Reglamentos</h1>
        <p style="color: #6B7280;">${nombre}</p>
        <p style="color: #6B7280; font-size: 0.875rem;">${direccion}</p>
      </div>
      
      ${reglamento ? `
        <div class="section">
          <h2>Reglamento Interno del Condominio</h2>
          <div class="content">${reglamento}</div>
        </div>
      ` : ''}
      
      ${privacyPolicy ? `
        <div class="section">
          <h2>Política de Privacidad y Protección de Datos</h2>
          <div class="content">${privacyPolicy}</div>
        </div>
      ` : ''}
      
      ${paymentPolicies ? `
        <div class="section">
          <h2>Políticas de Vencimiento y Mora en Pagos</h2>
          <div class="content">${paymentPolicies}</div>
        </div>
      ` : ''}
      
      ${!reglamento && !privacyPolicy && !paymentPolicies && politicas ? `
        <div class="section">
          <h2>Políticas del Condominio</h2>
          <div class="content">${politicas}</div>
        </div>
      ` : ''}
      
      <div class="footer">
        <p>ChispartBuilding - Sistema de Administración de Edificios</p>
        <p>Generado el ${new Date().toLocaleDateString('es-MX')} a las ${new Date().toLocaleTimeString('es-MX')}</p>
      </div>
    </body>
    </html>
  `;
  
  // Abrir en nueva ventana
  const ventana = window.open('', '_blank', 'width=1024,height=768');
  ventana.document.write(html);
  ventana.document.close();
}

// Cargar documentos
async function cargarDocumentos() {
  try {
    const token = localStorage.getItem('edificio_token') || localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/onboarding/documents`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.ok) {
      renderDocumentos(data.documents || []);
    }
  } catch (error) {
    console.error('Error al cargar documentos:', error);
  }
}

// Renderizar documentos
function renderDocumentos(documentos) {
  const container = document.getElementById('documentos-container');
  if (!container) return;
  
  if (documentos.length === 0) {
    container.innerHTML = '<p class="empty-message">No hay documentos cargados</p>';
    return;
  }
  
  container.innerHTML = documentos.map(doc => `
    <div class="documento-item">
      <div class="documento-item-header">
        <i class="fas fa-file-${getIconoTipo(doc.tipo)}"></i>
        <div class="documento-info">
          <h4>${doc.nombre}</h4>
          <p>${formatTipo(doc.tipo)}</p>
          <p style="font-size: 0.8rem; color: #999;">${formatFecha(doc.fecha)}</p>
        </div>
      </div>
      <div class="documento-actions">
        <button class="btn btn-sm btn-secondary" onclick="descargarDocumento('${doc.id}', '${doc.nombre}')">
          <i class="fas fa-download"></i> Descargar
        </button>
        <button class="btn btn-sm btn-danger" onclick="eliminarDocumento('${doc.id}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

// Obtener icono según tipo de documento
function getIconoTipo(tipo) {
  const iconos = {
    'acta_constitutiva': 'certificate',
    'escrituras': 'file-contract',
    'reglamento': 'book',
    'planos': 'drafting-compass',
    'contratos': 'file-signature',
    'permisos': 'stamp',
    'otro': 'file'
  };
  return iconos[tipo] || 'file';
}

// Formatear tipo de documento
function formatTipo(tipo) {
  const tipos = {
    'acta_constitutiva': 'Acta Constitutiva',
    'escrituras': 'Escrituras',
    'reglamento': 'Reglamento Interno',
    'planos': 'Planos',
    'contratos': 'Contratos',
    'permisos': 'Permisos',
    'otro': 'Otro'
  };
  return tipos[tipo] || tipo;
}

// Formatear fecha
function formatFecha(fecha) {
  if (!fecha) return '';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Subir documento
async function subirDocumento() {
  const tipo = document.getElementById('documento-tipo').value;
  const nombre = document.getElementById('documento-nombre').value;
  const archivo = document.getElementById('documento-archivo').files[0];
  
  if (!tipo || !nombre || !archivo) {
    alert('Completa todos los campos');
    return;
  }
  
  try {
    const token = localStorage.getItem('edificio_token') || localStorage.getItem('token');
    const formData = new FormData();
    formData.append('tipo', tipo);
    formData.append('nombre', nombre);
    formData.append('archivo', archivo);
    
    const response = await fetch(`${API_BASE}/onboarding/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (data.ok) {
      alert('Documento subido exitosamente');
      document.getElementById('documento-form').reset();
      await cargarDocumentos();
    } else {
      alert(data.msg || 'Error al subir documento');
    }
  } catch (error) {
    console.error('Error al subir documento:', error);
    alert('Error al subir documento');
  }
}

// Funciones globales para los botones de documentos
window.descargarDocumento = async function(id, nombre) {
  try {
    const token = localStorage.getItem('edificio_token') || localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/onboarding/documents/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombre;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else {
      alert('Error al descargar documento');
    }
  } catch (error) {
    console.error('Error al descargar documento:', error);
    alert('Error al descargar documento');
  }
};

window.eliminarDocumento = async function(id) {
  if (!confirm('¿Estás seguro de eliminar este documento?')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('edificio_token') || localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/onboarding/documents/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.ok) {
      alert('Documento eliminado exitosamente');
      await cargarDocumentos();
    } else {
      alert(data.msg || 'Error al eliminar documento');
    }
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    alert('Error al eliminar documento');
  }
};

// Inicializar cuando se muestre la sección
document.addEventListener('DOMContentLoaded', () => {
  const configuracionSection = document.getElementById('configuracion-section');
  
  if (configuracionSection) {
    // Observer para detectar cuando se muestra la sección
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (configuracionSection.classList.contains('active')) {
          initConfiguracion();
        }
      });
    });
    
    observer.observe(configuracionSection, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    // Si ya está activa, inicializar
    if (configuracionSection.classList.contains('active')) {
      initConfiguracion();
    }
  }
});
