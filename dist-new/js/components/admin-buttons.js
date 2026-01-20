// Admin Buttons Handler - Funcionalidad completa para todos los botones
// Variable global para almacenar fondos
let fondosGlobales = [];

// Función para actualizar todas las fechas dinámicamente
function actualizarFechasDinamicas() {
  const ahora = new Date();
  const mesActual = ahora.toLocaleString('es-MX', { month: 'long', year: 'numeric' });
  const mesActualCapitalizado = mesActual.charAt(0).toUpperCase() + mesActual.slice(1);
  const fechaActual = ahora.toLocaleDateString('es-MX');
  
  console.log('📅 Actualizando fechas dinámicas...');
  console.log('   Fecha actual:', mesActualCapitalizado);
  
  // Header principal
  const currentDateEl = document.getElementById('current-date');
  if (currentDateEl) {
    currentDateEl.textContent = mesActualCapitalizado;
  }
  
  // Dashboard - Cuotas Pendientes
  const cuotasPendientesMes = document.getElementById('cuotas-pendientes-mes');
  if (cuotasPendientesMes) {
    cuotasPendientesMes.textContent = mesActualCapitalizado;
  }
  
  // Dashboard - Gastos del Mes
  const gastosMesFecha = document.getElementById('gastos-mes-fecha');
  if (gastosMesFecha) {
    gastosMesFecha.textContent = mesActualCapitalizado;
  }
  
  // Fondos - Actualizado
  const fondosActualizacion = document.getElementById('fondos-actualizacion');
  if (fondosActualizacion) {
    fondosActualizacion.textContent = fechaActual;
  }
  
  // Actualizar campos de año en formularios (inputs type="number")
  const anioActual = ahora.getFullYear();
  const camposAnio = [
    'cuota-año',
    'cierre-año',
    'cierre-anual-año'
  ];
  
  camposAnio.forEach(campoId => {
    const campo = document.getElementById(campoId);
    if (campo) {
      campo.value = anioActual;
      campo.min = anioActual - 1; // Permitir año anterior
      campo.max = anioActual + 5;  // Permitir 5 años futuros
    }
  });
  
  // Actualizar selectores de año (select con options)
  const selectoresAnio = [
    'cuotas-año',
    'gastos-año',
    'anuncios-año'
  ];
  
  selectoresAnio.forEach(selectorId => {
    const select = document.getElementById(selectorId);
    if (select) {
      select.innerHTML = ''; // Limpiar opciones
      
      // Agregar opciones dinámicas: año anterior, actual, y 3 años futuros
      for (let i = -1; i <= 3; i++) {
        const anio = anioActual + i;
        const option = document.createElement('option');
        option.value = anio;
        option.textContent = anio;
        if (i === 0) option.selected = true; // Año actual seleccionado
        select.appendChild(option);
      }
    }
  });
  
  // Actualizar selectores de mes
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  const mesActualIndex = ahora.getMonth(); // 0-11
  const selectoresMes = [
    'cuotas-mes',
    'gastos-mes'
  ];
  
  selectoresMes.forEach(selectorId => {
    const select = document.getElementById(selectorId);
    if (select) {
      select.innerHTML = ''; // Limpiar opciones
      
      // Agregar todos los meses
      meses.forEach((mes, index) => {
        const option = document.createElement('option');
        option.value = mes;
        option.textContent = mes;
        if (index === mesActualIndex) option.selected = true; // Mes actual seleccionado
        select.appendChild(option);
      });
      
      console.log(`   ✓ Selector ${selectorId} poblado con ${meses.length} meses`);
    } else {
      console.warn(`   ⚠️  Selector ${selectorId} no encontrado`);
    }
  });
  
  console.log('✅ Fechas actualizadas a:', mesActualCapitalizado);
  console.log('✅ Campos de año actualizados a:', anioActual);
  console.log('✅ Selectores de mes actualizados - Mes actual:', meses[mesActualIndex]);
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('🔧 Admin Buttons Handler cargado');
  
  // Actualizar fechas al inicio
  actualizarFechasDinamicas();
  
  // Cargar fondos al inicio para tenerlos disponibles en selectores
  cargarFondosGlobales();
  
  // ========== USUARIOS ==========
  const nuevoUsuarioBtn = document.getElementById('nuevo-usuario-btn');
  if (nuevoUsuarioBtn) {
    nuevoUsuarioBtn.addEventListener('click', () => {
      console.log('👤 Nuevo Usuario');
      showNuevoUsuarioModal();
    });
  }
  
  // Filtros usuarios
  const usuariosRol = document.getElementById('usuarios-rol');
  const usuariosEstado = document.getElementById('usuarios-estado');
  
  if (usuariosRol) {
    usuariosRol.addEventListener('change', () => {
      console.log('🔍 Filtrando usuarios por rol:', usuariosRol.value);
      filtrarUsuarios();
    });
  }
  
  if (usuariosEstado) {
    usuariosEstado.addEventListener('change', () => {
      console.log('🔍 Filtrando usuarios por estado:', usuariosEstado.value);
      filtrarUsuarios();
    });
  }
  
  // ========== CUOTAS ==========
  
  // Cargar cuotas al inicio si estamos en la sección
  const cuotasSection = document.getElementById('cuotas-section');
  if (cuotasSection && cuotasSection.classList.contains('active')) {
    filtrarCuotas();
  }
  
  const nuevaCuotaBtn = document.getElementById('nueva-cuota-btn');
  if (nuevaCuotaBtn) {
    nuevaCuotaBtn.addEventListener('click', () => {
      console.log('💰 Nueva Cuota');
      showModal('cuota-modal');
      resetCuotaForm();
    });
  }

  const generarMasivoBtn = document.getElementById('generar-masivo-btn');
  if (generarMasivoBtn) {
    generarMasivoBtn.addEventListener('click', async () => {
      console.log('⚡ Generar Cuotas Masivas');
      await cargarInfoEdificio(); // Cargar info para mostrar total de unidades
      showModal('generar-masivo-modal');
      resetGenerarMasivoForm();
    });
  }

  const calcularMoraBtn = document.getElementById('calcular-mora-btn');
  if (calcularMoraBtn) {
    calcularMoraBtn.addEventListener('click', async () => {
      console.log('🧮 Calcular Mora');
      await calcularMoraAutomatica();
    });
  }

  const reporteCuotasBtn = document.getElementById('reporte-cuotas-btn');
  if (reporteCuotasBtn) {
    reporteCuotasBtn.addEventListener('click', () => {
      console.log('📄 Generar Reporte de Cuotas');
      generarReporteCuotas();
    });
  }

  const reporteBalanceBtn = document.getElementById('reporte-balance-btn');
  if (reporteBalanceBtn) {
    reporteBalanceBtn.addEventListener('click', () => {
      console.log('📊 Generar Reporte de Balance');
      generarReporteBalance();
    });
  }
  
  const verificarVencimientosBtn = document.getElementById('verificar-vencimientos-btn');
  if (verificarVencimientosBtn) {
    verificarVencimientosBtn.addEventListener('click', async () => {
      console.log('⏰ Verificando vencimientos...');
      await verificarVencimientos();
    });
  }
  
  // Filtros cuotas
  const cuotasMes = document.getElementById('cuotas-mes');
  const cuotasAnio = document.getElementById('cuotas-año');
  const cuotasEstado = document.getElementById('cuotas-estado');
  const cuotasTipo = document.getElementById('cuotas-tipo');
  
  if (cuotasMes) {
    cuotasMes.addEventListener('change', () => {
      console.log('🔍 Filtrando cuotas por mes:', cuotasMes.value);
      filtrarCuotas();
    });
  }
  
  if (cuotasAnio) {
    cuotasAnio.addEventListener('change', () => {
      console.log('🔍 Filtrando cuotas por año:', cuotasAnio.value);
      filtrarCuotas();
    });
  }

  if (cuotasTipo) {
    cuotasTipo.addEventListener('change', () => {
      console.log('🔍 Filtrando cuotas por tipo:', cuotasTipo.value);
      filtrarCuotas();
    });
  }
  
  if (cuotasEstado) {
    cuotasEstado.addEventListener('change', () => {
      console.log('🔍 Filtrando cuotas por estado:', cuotasEstado.value);
      filtrarCuotas();
    });
  }
  
  // ========== GASTOS ==========
  const nuevoGastoBtn = document.getElementById('nuevo-gasto-btn');
  if (nuevoGastoBtn) {
    nuevoGastoBtn.addEventListener('click', () => {
      console.log('💸 Nuevo Gasto');
      // Actualizar selectores de fondos antes de mostrar modal
      actualizarSelectoresFondos();
      showModal('gasto-modal');
      resetGastoForm();
    });
  }
  
  // Filtros gastos
  const gastosMes = document.getElementById('gastos-mes');
  const gastosAnio = document.getElementById('gastos-año');
  const gastosCategoria = document.getElementById('gastos-categoria');
  
  if (gastosMes) {
    gastosMes.addEventListener('change', () => {
      console.log('🔍 Filtrando gastos por mes:', gastosMes.value);
      filtrarGastos();
    });
  }
  
  if (gastosAnio) {
    gastosAnio.addEventListener('change', () => {
      console.log('🔍 Filtrando gastos por año:', gastosAnio.value);
      filtrarGastos();
    });
  }
  
  if (gastosCategoria) {
    gastosCategoria.addEventListener('change', () => {
      console.log('🔍 Filtrando gastos por categoría:', gastosCategoria.value);
      filtrarGastos();
    });
  }
  
  // ========== FONDOS ==========
  const transferirFondosBtn = document.getElementById('transferir-fondos-btn');
  if (transferirFondosBtn) {
    transferirFondosBtn.addEventListener('click', () => {
      console.log('💸 Transferir Fondos');
      // Actualizar selectores antes de mostrar modal
      actualizarSelectoresFondos();
      showModal('transferir-modal');
    });
  }
  
  // ========== ANUNCIOS ==========
  const nuevoAnuncioBtn = document.getElementById('nuevo-anuncio-btn');
  if (nuevoAnuncioBtn) {
    nuevoAnuncioBtn.addEventListener('click', () => {
      console.log('📢 Nuevo Anuncio');
      showModal('anuncio-modal');
      resetAnuncioForm();
    });
  }
  
  // Filtros anuncios
  const anunciosTipo = document.getElementById('anuncios-tipo');
  if (anunciosTipo) {
    anunciosTipo.addEventListener('change', () => {
      console.log('🔍 Filtrando anuncios por tipo:', anunciosTipo.value);
      filtrarAnuncios();
    });
  }
  
  // ========== PARCIALIDADES ==========
  const nuevoPagoBtn = document.getElementById('nuevo-pago-btn');
  if (nuevoPagoBtn) {
    nuevoPagoBtn.addEventListener('click', () => {
      console.log('💰 Registrar Pago Parcialidad');
      showModal('parcialidad-modal');
      resetParcialidadForm();
    });
  }
  
  // ========== CIERRES ==========
  const cierreMensualBtn = document.getElementById('cierre-mensual-btn');
  if (cierreMensualBtn) {
    cierreMensualBtn.addEventListener('click', () => {
      console.log('📊 Cierre Mensual');
      showModal('cierre-mensual-modal');
      resetCierreMensualForm();
    });
  }
  
  const cierreAnualBtn = document.getElementById('cierre-anual-btn');
  if (cierreAnualBtn) {
    cierreAnualBtn.addEventListener('click', () => {
      console.log('📅 Cierre Anual');
      showModal('cierre-anual-modal');
      resetCierreAnualForm();
    });
  }
  
  // Filtros cierres
  const cierresAnio = document.getElementById('cierres-año');
  if (cierresAnio) {
    cierresAnio.addEventListener('change', () => {
      console.log('🔍 Filtrando cierres por año:', cierresAnio.value);
      cargarCierres();
    });
  }
  
  const cierrePrintBtn = document.getElementById('cierre-print-btn');
  if (cierrePrintBtn) {
    cierrePrintBtn.addEventListener('click', () => {
      console.log('🖨️ Imprimiendo cierre...');
      window.print();
    });
  }
  
  // ========== FORMS SUBMIT ==========
  setupFormHandlers();
  setupModalClosers();
  
  // ========== EVENT DELEGATION ==========
  document.addEventListener('click', handleDynamicButtons);
});

function handleDynamicButtons(e) {
  const target = e.target.closest('button');
  if (!target) return;
  
  const action = target.dataset.action;
  const id = target.dataset.id;
  
  if (action === 'validar-cuota') {
    e.preventDefault();
    console.log('🎯 Click en validar cuota:', id);
    abrirModalValidarPago(id);
  }
  else if (action === 'editar-usuario') {
    e.preventDefault();
    console.log('✏️ Editar usuario:', id);
    editarUsuario(id);
  }
  else if (action === 'eliminar-usuario') {
    e.preventDefault();
    console.log('🗑️ Eliminar usuario:', id);
    eliminarUsuario(id);
  }
  else if (action === 'editar-gasto') {
    e.preventDefault();
    console.log('✏️ Editar gasto:', id);
    editarGasto(id);
  }
  else if (action === 'eliminar-gasto') {
    e.preventDefault();
    console.log('🗑️ Eliminar gasto:', id);
    eliminarGasto(id);
  }
  else if (action === 'editar-anuncio') {
    e.preventDefault();
    console.log('✏️ Editar anuncio:', id);
    editarAnuncio(id);
  }
  else if (action === 'eliminar-anuncio') {
    e.preventDefault();
    console.log('🗑️ Eliminar anuncio:', id);
    eliminarAnuncio(id);
  }
  else if (action === 'ver-detalle-cierre') {
    e.preventDefault();
    console.log('👁️ Ver detalle cierre:', id);
    verDetalleCierre(id);
  }
  else if (action === 'validar-parcialidad') {
    e.preventDefault();
    console.log('✅ Validar parcialidad:', id);
    validarParcialidad(id);
  }
  else if (action === 'rechazar-parcialidad') {
    e.preventDefault();
    console.log('❌ Rechazar parcialidad:', id);
    rechazarParcialidad(id);
  }
}

function abrirModalValidarPago(cuotaId) {
  console.log('📝 Abriendo modal validar pago para cuota:', cuotaId);
  
  const modal = document.getElementById('validar-pago-modal');
  if (!modal) {
    console.error('❌ Modal validar-pago-modal no encontrado');
    return;
  }
  
  // Guardar ID de cuota
  document.getElementById('validar-cuota-id').value = cuotaId;
  
  // Reset form con valores por defecto
  document.getElementById('validar-estado').value = 'PAGADO';
  document.getElementById('validar-fecha-pago').value = new Date().toISOString().split('T')[0];
  document.getElementById('validar-comprobante').value = '';
  
  modal.style.display = 'block';
  console.log('✓ Modal abierto');
}

// ========== FUNCIONES AUXILIARES ==========

function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'block';
    console.log('✓ Modal abierto:', modalId);
  } else {
    console.error('❌ Modal no encontrado:', modalId);
  }
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    console.log('✓ Modal cerrado:', modalId);
  }
}

function resetCuotaForm() {
  const form = document.getElementById('cuota-form');
  if (form) {
    form.reset();
    document.getElementById('cuota-id').value = '';
    document.getElementById('cuota-modal-title').textContent = 'Nueva Cuota';
    
    // Fecha vencimiento por defecto (final del mes actual)
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    document.getElementById('cuota-vencimiento').value = lastDay.toISOString().split('T')[0];
    
    // Seleccionar mes y año actual
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const mesActual = meses[today.getMonth()];
    const anioActual = today.getFullYear();
    
    const cuotaMesSelect = document.getElementById('cuota-mes');
    const cuotaAnioInput = document.getElementById('cuota-año');
    
    if (cuotaMesSelect) cuotaMesSelect.value = mesActual;
    if (cuotaAnioInput) cuotaAnioInput.value = anioActual;
  }
}

function resetGastoForm() {
  const form = document.getElementById('gasto-form');
  if (form) {
    form.reset();
    document.getElementById('gasto-id').value = '';
    document.getElementById('gasto-modal-title').textContent = 'Nuevo Gasto';
    
    // Fecha actual
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('gasto-fecha').value = today;
  }
}

function resetAnuncioForm() {
  const form = document.getElementById('anuncio-form');
  if (form) {
    form.reset();
    document.getElementById('anuncio-id').value = '';
    document.getElementById('anuncio-modal-title').textContent = 'Nuevo Anuncio';
  }
}

function resetCierreMensualForm() {
  const form = document.getElementById('cierre-mensual-form');
  if (form) {
    form.reset();
    const fecha = new Date();
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    document.getElementById('cierre-mes').value = meses[fecha.getMonth()];
    document.getElementById('cierre-año').value = fecha.getFullYear();
  }
}

function resetCierreAnualForm() {
  const form = document.getElementById('cierre-anual-form');
  if (form) {
    form.reset();
    document.getElementById('cierre-anual-año').value = new Date().getFullYear();
  }
}

async function resetParcialidadForm() {
  const form = document.getElementById('parcialidad-form');
  if (form) {
    form.reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('parcialidad-fecha').value = today;
    
    // Cargar departamentos
    await cargarDepartamentosSelect('parcialidad-departamento');
  }
}

async function cargarDepartamentosSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  
  try {
    const token = localStorage.getItem('edificio_token');
    const response = await fetch('/api/usuarios', {
      headers: { 'x-auth-token': token }
    });
    
    if (response.ok) {
      const data = await response.json();
      const inquilinos = data.usuarios.filter(u => u.rol === 'INQUILINO' && u.departamento);
      
      // Limpiar opciones existentes excepto la primera
      select.innerHTML = '<option value="">Seleccionar...</option>';
      
      // Añadir departamentos
      inquilinos.forEach(inquilino => {
        const option = document.createElement('option');
        option.value = inquilino.departamento;
        option.textContent = `${inquilino.departamento} - ${inquilino.nombre}`;
        select.appendChild(option);
      });
      
      console.log(`✅ ${inquilinos.length} departamentos cargados`);
    }
  } catch (error) {
    console.error('Error cargando departamentos:', error);
  }
}

async function verificarVencimientos() {
  try {
    const token = localStorage.getItem('edificio_token');
    const response = await fetch('/api/cuotas/verificar-vencimientos', {
      method: 'POST',
      headers: {
        'x-auth-token': token
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      alert(`Vencimientos verificados:\n${data.actualizadas} cuotas actualizadas`);
      // Recargar cuotas
      if (window.location.hash === '#cuotas') {
        location.reload();
      }
    } else {
      throw new Error('Error al verificar vencimientos');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al verificar vencimientos');
  }
}

async function showNuevoUsuarioModal() {
  const modalHTML = `
    <div id="usuario-modal" class="modal" style="display: block;">
      <div class="modal-content">
        <span class="close" onclick="document.getElementById('usuario-modal').remove()">&times;</span>
        <h2>Nuevo Usuario</h2>
        
        <form id="usuario-form">
          <div class="form-group">
            <label for="usuario-nombre">Nombre:</label>
            <input type="text" id="usuario-nombre" required>
          </div>
          
          <div class="form-group">
            <label for="usuario-email">Email:</label>
            <input type="email" id="usuario-email" required>
          </div>
          
          <div class="form-group">
            <label for="usuario-password">Contraseña:</label>
            <input type="password" id="usuario-password" required minlength="6">
          </div>
          
          <div class="form-group">
            <label for="usuario-rol">Rol:</label>
            <select id="usuario-rol" required>
              <option value="INQUILINO">Inquilino</option>
              <option value="ADMIN">Administrador</option>
              <option value="COMITE">Comité</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="usuario-departamento">Departamento:</label>
            <input type="text" id="usuario-departamento" placeholder="101-504" required>
          </div>
          
          <div class="form-group">
            <label for="usuario-telefono">Teléfono:</label>
            <input type="tel" id="usuario-telefono" placeholder="Opcional">
          </div>
          
          <div class="form-group">
            <button type="submit" class="btn btn-primary">Crear Usuario</button>
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('usuario-modal').remove()">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  const form = document.getElementById('usuario-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await crearNuevoUsuario(form);
  });
}

async function crearNuevoUsuario(form) {
  const formData = {
    nombre: document.getElementById('usuario-nombre').value,
    email: document.getElementById('usuario-email').value,
    password: document.getElementById('usuario-password').value,
    rol: document.getElementById('usuario-rol').value,
    departamento: document.getElementById('usuario-departamento').value,
    telefono: document.getElementById('usuario-telefono').value || null
  };
  
  try {
    const token = localStorage.getItem('edificio_token');
    const response = await fetch('/api/usuarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      alert('Usuario creado exitosamente');
      document.getElementById('usuario-modal').remove();
      location.reload();
    } else {
      const error = await response.json();
      alert(`Error: ${error.msg || 'No se pudo crear el usuario'}`);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al crear usuario');
  }
}

async function filtrarUsuarios() {
  console.log('🔄 Filtrando usuarios...');
  
  const rol = document.getElementById('usuarios-rol')?.value;
  const estado = document.getElementById('usuarios-estado')?.value;
  
  try {
    const token = localStorage.getItem('edificio_token');
    let url = '/api/usuarios';
    const params = new URLSearchParams();
    
    if (rol && rol !== 'todos') params.append('rol', rol);
    if (estado && estado !== 'todos') params.append('estado', estado);
    
    if (params.toString()) url += '?' + params.toString();
    
    const response = await fetch(url, {
      headers: { 'x-auth-token': token }
    });
    
    if (response.ok) {
      const data = await response.json();
      renderUsuariosTable(data.usuarios);
    }
  } catch (error) {
    console.error('Error filtrando usuarios:', error);
  }
}

function renderUsuariosTable(usuarios) {
  const tbody = document.getElementById('usuarios-table-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (!usuarios || usuarios.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay usuarios</td></tr>';
    return;
  }
  
  usuarios.forEach(user => {
    const tr = document.createElement('tr');
    
    const estadoClass = user.estatus_validacion === 'validado' ? 'text-success' : 'text-warning';
    const editor = user.esEditor ? 'Sí' : 'No';
    
    tr.innerHTML = `
      <td>${user.nombre}</td>
      <td>${user.email}</td>
      <td>${user.departamento || '-'}</td>
      <td><span class="badge badge-${user.rol.toLowerCase()}">${user.rol}</span></td>
      <td>${editor}</td>
      <td class="${estadoClass}">${user.estatus_validacion}</td>
      <td>
        <button class="btn btn-sm btn-secondary" data-action="editar-usuario" data-id="${user.id}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-danger" data-action="eliminar-usuario" data-id="${user.id}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    
    tbody.appendChild(tr);
  });
}

async function filtrarCuotas() {
  console.log('🔄 Filtrando cuotas...');
  
  const mes = document.getElementById('cuotas-mes')?.value;
  const anio = document.getElementById('cuotas-año')?.value;
  const estado = document.getElementById('cuotas-estado')?.value;
  const tipo = document.getElementById('cuotas-tipo')?.value;
  
  try {
    const token = localStorage.getItem('edificio_token');
    let url = '/api/cuotas';
    const params = new URLSearchParams();
    
    if (mes) params.append('mes', mes);
    if (anio) params.append('anio', anio);
    if (estado && estado !== 'TODOS') params.append('estado', estado);
    if (tipo && tipo !== 'TODOS') params.append('tipo', tipo);
    
    if (params.toString()) url += '?' + params.toString();
    
    const response = await fetch(url, {
      headers: { 'x-auth-token': token }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   📊 Cuotas encontradas: ${data.cuotas.length}`);
      if (tipo === 'EXTRAORDINARIA') {
        console.log('   🎯 Mostrando solo cuotas extraordinarias');
      }
      renderCuotasTable(data.cuotas);
    }
  } catch (error) {
    console.error('Error filtrando cuotas:', error);
  }
}

function renderCuotasTable(cuotas) {
  const tbody = document.querySelector('#cuotas-table tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (!cuotas || cuotas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay cuotas</td></tr>';
    return;
  }
  
  cuotas.forEach(cuota => {
    const tr = document.createElement('tr');
    
    // Determinar estado
    let estadoClass = '';
    let estadoTexto = cuota.estado || (cuota.pagado ? 'PAGADO' : (cuota.vencida ? 'VENCIDO' : 'PENDIENTE'));
    
    if (estadoTexto === 'PAGADO' || cuota.pagado) estadoClass = 'text-success';
    else if (estadoTexto === 'VENCIDO' || cuota.vencida) estadoClass = 'text-danger';
    else estadoClass = 'text-warning';
    
    // Evitar problema de timezone usando split en lugar de Date
    const vencimiento = cuota.fecha_vencimiento ? 
      cuota.fecha_vencimiento.split('T')[0].split('-').reverse().join('/') : '-';
    const fechaPago = cuota.fecha_pago ? 
      cuota.fecha_pago.split('T')[0].split('-').reverse().join('/') : '-';
    
    // Calcular total con mora y extraordinario
    const montoBase = parseFloat(cuota.monto || 0);
    const montoExtra = parseFloat(cuota.monto_extraordinario || 0);
    const mora = parseFloat(cuota.monto_mora || 0);
    const total = montoBase + montoExtra + mora;
    
    tr.innerHTML = `
      <td>${cuota.departamento}</td>
      <td>
        <div>${cuota.mes} ${cuota.anio}</div>
        ${cuota.concepto_extraordinario ? `<small style="color: #F59E0B; display: block; margin-top: 0.25rem;"><i class="fas fa-star"></i> ${cuota.concepto_extraordinario}</small>` : ''}
      </td>
      <td>
        <div>$${montoBase.toLocaleString('es-MX')}</div>
        ${montoExtra > 0 ? `<small style="color: #F59E0B;">+ $${montoExtra.toLocaleString('es-MX')} extra</small>` : ''}
        ${mora > 0 ? `<small style="color: #EF4444; display: block;">+ $${mora.toLocaleString('es-MX')} mora</small>` : ''}
      </td>
      <td>
        <strong>$${total.toLocaleString('es-MX')}</strong>
      </td>
      <td class="${estadoClass}">${estadoTexto}</td>
      <td>${vencimiento}</td>
      <td>${fechaPago}</td>
      <td>
        ${!cuota.pagado ? `
          <button class="btn btn-sm btn-primary" data-action="validar-cuota" data-id="${cuota.id}">
            Validar
          </button>
        ` : '<span style="color: #10B981;">✓ Pagado</span>'}
      </td>
    `;
    
    tbody.appendChild(tr);
  });
}

async function filtrarGastos() {
  console.log('🔄 Filtrando gastos...');
  
  const mesNombre = document.getElementById('gastos-mes')?.value;
  const anio = document.getElementById('gastos-año')?.value;
  const categoria = document.getElementById('gastos-categoria')?.value;
  
  try {
    const token = localStorage.getItem('edificio_token');
    let url = '/api/gastos';
    const params = new URLSearchParams();
    
    // Convertir nombre del mes a número (01, 02, 03...)
    if (mesNombre) {
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const mesIndex = meses.indexOf(mesNombre);
      if (mesIndex !== -1) {
        params.append('mes', (mesIndex + 1).toString());
      }
    }
    
    if (anio) params.append('anio', anio);
    if (categoria && categoria !== 'TODOS') params.append('categoria', categoria);
    
    if (params.toString()) url += '?' + params.toString();
    
    const response = await fetch(url, {
      headers: { 'x-auth-token': token }
    });
    
    if (response.ok) {
      const data = await response.json();
      renderGastosTable(data.gastos);
    }
  } catch (error) {
    console.error('Error filtrando gastos:', error);
  }
}

function renderGastosTable(gastos) {
  const tbody = document.querySelector('#gastos-table tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (!gastos || gastos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay gastos</td></tr>';
    return;
  }
  
  gastos.forEach(gasto => {
    const tr = document.createElement('tr');
    
    const fecha = new Date(gasto.fecha).toLocaleDateString('es-MX');
    
    tr.innerHTML = `
      <td>${fecha}</td>
      <td>${gasto.concepto}</td>
      <td>$${gasto.monto.toLocaleString()}</td>
      <td><span class="badge badge-${gasto.categoria.toLowerCase()}">${gasto.categoria}</span></td>
      <td>${gasto.proveedor || '-'}</td>
      <td>
        <button class="btn btn-sm btn-secondary" data-action="editar-gasto" data-id="${gasto.id}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-danger" data-action="eliminar-gasto" data-id="${gasto.id}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    
    tbody.appendChild(tr);
  });
}

async function filtrarAnuncios() {
  console.log('🔄 Filtrando anuncios...');
  
  const tipo = document.getElementById('anuncios-tipo')?.value;
  console.log('Tipo seleccionado:', tipo);
  
  try {
    const token = localStorage.getItem('edificio_token');
    let url = '/api/anuncios';
    
    if (tipo && tipo !== 'TODOS') {
      url += '?tipo=' + tipo;
    }
    
    console.log('📡 URL:', url);
    
    const response = await fetch(url, {
      headers: { 'x-auth-token': token }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('📊 Anuncios recibidos:', data.anuncios?.length, 'anuncios');
      console.log('📋 Tipos:', data.anuncios?.map(a => a.tipo));
      renderAnunciosContainer(data.anuncios);
    }
  } catch (error) {
    console.error('Error filtrando anuncios:', error);
  }
}

function renderAnunciosContainer(anuncios) {
  const container = document.getElementById('anuncios-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!anuncios || anuncios.length === 0) {
    container.innerHTML = '<p class="text-center">No hay anuncios disponibles</p>';
    return;
  }
  
  anuncios.forEach(anuncio => {
    const div = document.createElement('div');
    div.className = 'anuncio-card';
    
    // Usar 'prioridad' de la BD
    const prioridad = anuncio.prioridad || anuncio.tipo || 'NORMAL';
    let tipoClass = 'bg-secondary';
    if (prioridad === 'ALTA') tipoClass = 'bg-danger';
    else if (prioridad === 'NORMAL') tipoClass = 'bg-warning';
    else if (prioridad === 'BAJA') tipoClass = 'bg-secondary';
    
    const fecha = new Date(anuncio.created_at || anuncio.createdAt).toLocaleDateString('es-MX');
    
    // Usar 'archivo' de la BD o 'imagen' del frontend
    const archivoUrl = anuncio.archivo || anuncio.imagen;
    
    div.innerHTML = `
      <div class="anuncio-header">
        <div>
          <h4>${anuncio.titulo}</h4>
          <span class="badge ${tipoClass}">${prioridad}</span>
        </div>
        <div class="anuncio-actions">
          <button class="btn btn-sm btn-secondary" data-action="editar-anuncio" data-id="${anuncio.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger" data-action="eliminar-anuncio" data-id="${anuncio.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="anuncio-body">
        <p>${anuncio.contenido}</p>
        ${archivoUrl ? `
          <div class="anuncio-imagen">
            ${archivoUrl.endsWith('.pdf') ? 
              `<a href="${archivoUrl}" target="_blank" class="btn btn-sm btn-outline-primary">
                <i class="fas fa-file-pdf"></i> Ver PDF
              </a>` :
              `<img 
                src="${archivoUrl}" 
                alt="${anuncio.titulo.replace(/"/g, '&quot;')}" 
                loading="lazy"
                class="anuncio-img"
                onclick="window.open('${archivoUrl}', '_blank')"
              />`
            }
          </div>
        ` : ''}
      </div>
      <div class="anuncio-footer">
        <small>Publicado: ${fecha}</small>
      </div>
    `;
    
    container.appendChild(div);
    
    // Agregar manejo de error de imagen después de agregar al DOM
    const img = div.querySelector('.anuncio-img');
    if (img) {
      img.addEventListener('error', function() {
        this.style.display = 'none';
        const errorMsg = document.createElement('p');
        errorMsg.style.cssText = 'color: #EF4444; font-size: 0.875rem; margin-top: 0.5rem; text-align: center;';
        errorMsg.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error al cargar imagen';
        this.parentElement.appendChild(errorMsg);
      });
    }
  });
}

async function cargarCierres() {
  console.log('🔄 Cargando cierres...');
  
  const anio = document.getElementById('cierres-año')?.value || new Date().getFullYear();
  
  try {
    const token = localStorage.getItem('edificio_token') || localStorage.getItem('token');
    
    if (!token) {
      console.error('No hay token disponible');
      return;
    }
    
    let url = '/api/cierres';
    if (anio) {
      url += '?anio=' + anio;
    }
    
    console.log('📊 Cargando cierres desde:', url);
    
    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'x-auth-token': token 
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Cierres recibidos:', data.cierres?.length || 0);
      console.log('📋 Datos:', data.cierres);
      renderCierresTable(data.cierres || []);
    } else {
      const errorText = await response.text();
      console.error('❌ Error en respuesta:', response.status, errorText);
      renderCierresTable([]);
    }
  } catch (error) {
    console.error('❌ Error cargando cierres:', error);
    renderCierresTable([]);
  }
}

function renderCierresTable(cierres) {
  console.log('🎨 Renderizando cierres:', cierres.length);
  
  const tbodyMensual = document.querySelector('#cierres-table tbody');
  const tbodyAnual = document.querySelector('#cierres-anuales-table tbody');
  
  if (!tbodyMensual || !tbodyAnual) {
    console.error('❌ No se encontraron las tablas de cierres');
    return;
  }
  
  if (!cierres || cierres.length === 0) {
    tbodyMensual.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #6B7280;">No hay cierres mensuales registrados</td></tr>';
    tbodyAnual.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #6B7280;">No hay cierres anuales registrados</td></tr>';
    return;
  }
  
  // Separar cierres mensuales y anuales
  const cierresMensuales = cierres.filter(c => c.tipo !== 'ANUAL' && c.mes);
  const cierresAnuales = cierres.filter(c => c.tipo === 'ANUAL');
  
  console.log('📊 Cierres mensuales:', cierresMensuales.length, 'Anuales:', cierresAnuales.length);
  
  // Renderizar cierres mensuales
  tbodyMensual.innerHTML = '';
  
  if (cierresMensuales.length === 0) {
    tbodyMensual.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #6B7280;">No hay cierres mensuales</td></tr>';
  } else {
    cierresMensuales.forEach(cierre => {
      const tr = document.createElement('tr');
      
      const fechaCierre = cierre.fecha ? new Date(cierre.fecha).toLocaleDateString('es-MX') : 
                         (cierre.createdAt ? new Date(cierre.createdAt).toLocaleDateString('es-MX') : '-');
      
      const ingresos = typeof cierre.ingresos === 'object' ? (cierre.ingresos.total || 0) : (parseFloat(cierre.ingresos) || 0);
      const gastos = typeof cierre.gastos === 'object' ? (cierre.gastos.total || 0) : (parseFloat(cierre.gastos) || 0);
      const balance = cierre.balance !== undefined ? parseFloat(cierre.balance) : (ingresos - gastos);
      const balanceClass = balance >= 0 ? 'text-success' : 'text-danger';
      
      tr.innerHTML = `
        <td>${cierre.mes} ${cierre.año || cierre.anio}</td>
        <td>$${ingresos.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>$${gastos.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td class="${balanceClass}"><strong>$${balance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
        <td>${fechaCierre}</td>
        <td>
            <button class="btn btn-sm btn-primary" data-action="ver-detalle-cierre" data-id="${cierre.id}">
              Ver Detalle
            </button>
          </td>
        `;
        
        tbodyMensual.appendChild(tr);
      });
    }
  }
  
  // Renderizar cierres anuales
  tbodyAnual.innerHTML = '';
  
  if (cierresAnuales.length === 0) {
    tbodyAnual.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #6B7280;">No hay cierres anuales</td></tr>';
  } else {
    cierresAnuales.forEach(cierre => {
      const tr = document.createElement('tr');
      
      const fechaCierre = cierre.fecha ? new Date(cierre.fecha).toLocaleDateString('es-MX') : 
                         (cierre.createdAt ? new Date(cierre.createdAt).toLocaleDateString('es-MX') : '-');
      
      const ingresos = typeof cierre.ingresos === 'object' ? (cierre.ingresos.total || 0) : (parseFloat(cierre.ingresos) || 0);
      const gastos = typeof cierre.gastos === 'object' ? (cierre.gastos.total || 0) : (parseFloat(cierre.gastos) || 0);
      const balance = cierre.balance !== undefined ? parseFloat(cierre.balance) : (ingresos - gastos);
      const balanceClass = balance >= 0 ? 'text-success' : 'text-danger';
      
      tr.innerHTML = `
        <td>${cierre.año || cierre.anio}</td>
        <td>$${ingresos.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>$${gastos.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td class="${balanceClass}"><strong>$${balance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
        <td>${fechaCierre}</td>
        <td>
          <button class="btn btn-sm btn-primary" data-action="ver-detalle-cierre" data-id="${cierre.id}">
            Ver Detalle
          </button>
        </td>
      `;
      
      tbodyAnual.appendChild(tr);
    });
  }
}

function setupFormHandlers() {
  // Form cuota
  const cuotaForm = document.getElementById('cuota-form');
  if (cuotaForm) {
    cuotaForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('💾 Guardando cuota...');
      
      const formData = {
        mes: document.getElementById('cuota-mes').value,
        anio: parseInt(document.getElementById('cuota-año').value),
        monto: parseFloat(document.getElementById('cuota-monto').value),
        departamento: 'TODOS',
        fechaVencimiento: document.getElementById('cuota-vencimiento').value
      };
      
      console.log('Datos cuota:', formData);
      
      try {
        const token = localStorage.getItem('edificio_token');
        const response = await fetch('/api/cuotas/generar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          const data = await response.json();
          alert(`✅ Cuotas generadas: ${data.cuotasGeneradas || data.generadas || 0} cuotas creadas`);
          hideModal('cuota-modal');
          filtrarCuotas();
        } else {
          const error = await response.json();
          alert(`❌ Error: ${error.msg || error.message || 'No se pudieron generar las cuotas'}`);
        }
      } catch (error) {
        console.error('Error creando cuota:', error);
        alert('❌ Error al crear cuota: ' + error.message);
      }
    });
  }
  
  // Form gasto
  const gastoForm = document.getElementById('gasto-form');
  if (gastoForm) {
    gastoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('💾 Guardando gasto...');
      
      const fondoValue = document.getElementById('gasto-fondo').value;
      const formData = {
        concepto: document.getElementById('gasto-concepto').value,
        monto: parseFloat(document.getElementById('gasto-monto').value),
        categoria: document.getElementById('gasto-categoria').value,
        proveedor: document.getElementById('gasto-proveedor').value,
        fecha: document.getElementById('gasto-fecha').value,
        fondoId: fondoValue ? parseInt(fondoValue) : null, // ID del fondo
        comprobante: document.getElementById('gasto-comprobante').value,
        descripcion: document.getElementById('gasto-notas').value
      };
      
      console.log('💾 Datos del gasto:', formData);
      console.log('   Fondo seleccionado ID:', formData.fondoId);
      
      try {
        const token = localStorage.getItem('edificio_token');
        const response = await fetch('/api/gastos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          const data = await response.json();
          alert(`✅ ${data.message}`);
          hideModal('gasto-modal');
          
          // Recargar gastos y fondos para reflejar cambios
          filtrarGastos();
          cargarFondos(); // Actualizar saldos de fondos
          
          // Si estamos en dashboard, actualizar también
          const dashboardSection = document.getElementById('dashboard-section');
          if (dashboardSection && !dashboardSection.classList.contains('hidden')) {
            cargarDashboard();
          }
        } else {
          const error = await response.json();
          alert(`❌ Error: ${error.message || 'No se pudo crear el gasto'}`);
        }
      } catch (error) {
        console.error('Error creando gasto:', error);
        alert('❌ Error al crear gasto');
      }
    });
  }
  
  // Form validar pago
  const validarPagoForm = document.getElementById('validar-pago-form');
  if (validarPagoForm) {
    validarPagoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('💾 Validando pago...');
      
      const cuotaId = document.getElementById('validar-cuota-id').value;
      const formData = {
        estado: document.getElementById('validar-estado').value,
        fechaPago: document.getElementById('validar-fecha-pago').value,
        comprobante: document.getElementById('validar-comprobante').value
      };
      
      console.log('Datos validación:', formData);
      
      try {
        const token = localStorage.getItem('edificio_token');
        const response = await fetch(`/api/cuotas/${cuotaId}/estado`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          alert('✅ Pago validado exitosamente');
          hideModal('validar-pago-modal');
          filtrarCuotas();
        } else {
          const error = await response.json();
          alert(`❌ Error: ${error.msg || 'No se pudo validar el pago'}`);
        }
      } catch (error) {
        console.error('Error validando pago:', error);
        alert('❌ Error al validar pago');
      }
    });
  }
  
  // Form transferir fondos
  const transferirForm = document.getElementById('transferir-form');
  if (transferirForm) {
    transferirForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('💾 Transfiriendo fondos...');
      
      const formData = {
        origen: document.getElementById('transferir-origen').value,
        destino: document.getElementById('transferir-destino').value,
        monto: parseFloat(document.getElementById('transferir-monto').value)
      };
      
      console.log('📤 Datos transferencia:', formData);
      
      // Validaciones
      if (formData.origen === formData.destino) {
        alert('❌ El fondo origen y destino no pueden ser el mismo');
        return;
      }
      
      if (formData.monto <= 0) {
        alert('❌ El monto debe ser mayor a 0');
        return;
      }
      
      try {
        const token = localStorage.getItem('edificio_token');
        const response = await fetch('/api/fondos/transferencia', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          body: JSON.stringify(formData)
        });
        
        console.log('📡 Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Transferencia exitosa:', data);
          alert('✅ Transferencia realizada exitosamente');
          hideModal('transferir-modal');
          
          // Recargar fondos para ver los nuevos saldos
          cargarFondos();
          
          // Recargar fondos globales para actualizar selectores
          cargarFondosGlobales();
          
          // Recargar movimientos
          cargarMovimientosFondos();
          
          // Actualizar dashboard si está visible
          const dashboardSection = document.getElementById('dashboard-section');
          if (dashboardSection && dashboardSection.style.display !== 'none') {
            cargarDashboard();
          }
        } else {
          const error = await response.json();
          console.error('❌ Error del servidor:', error);
          alert(`❌ Error: ${error.msg || 'No se pudo realizar la transferencia'}`);
        }
      } catch (error) {
        console.error('❌ Exception:', error);
        alert('❌ Error al transferir fondos: ' + error.message);
      }
    });
  }
  
  // Form anuncio
  const anuncioForm = document.getElementById('anuncio-form');
  if (anuncioForm) {
    anuncioForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('💾 Guardando anuncio...');
      
      const anuncioId = document.getElementById('anuncio-id').value;
      const imagenFile = document.getElementById('anuncio-imagen').files[0];
      
      try {
        const token = localStorage.getItem('edificio_token');
        let imagenUrl = null;
        
        // Si hay imagen, subirla primero
        if (imagenFile) {
          console.log('📤 Subiendo archivo:', imagenFile.name);
          
          const uploadFormData = new FormData();
          uploadFormData.append('file', imagenFile); // Nombre correcto del campo
          
          const uploadResponse = await fetch('/api/anuncios/upload', {
            method: 'POST',
            headers: {
              'x-auth-token': token
            },
            body: uploadFormData
          });
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            imagenUrl = uploadData.url || uploadData.fileName;
            console.log('✅ Archivo subido:', imagenUrl);
          } else {
            const error = await uploadResponse.json();
            alert(`⚠️ Error al subir archivo: ${error.message}. El anuncio se creará sin imagen.`);
          }
        }
        
        // Crear/actualizar anuncio
        const anuncioData = {
          titulo: document.getElementById('anuncio-titulo').value,
          prioridad: document.getElementById('anuncio-tipo').value, // El select tiene id="anuncio-tipo" pero enviamos como "prioridad"
          contenido: document.getElementById('anuncio-contenido').value,
          imagen: imagenUrl
        };
        
        console.log('📝 Datos anuncio a enviar:', anuncioData);
        console.log('🖼️ URL de imagen:', imagenUrl);
        
        const url = anuncioId ? `/api/anuncios/${anuncioId}` : '/api/anuncios';
        const method = anuncioId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          body: JSON.stringify(anuncioData)
        });
        
        if (response.ok) {
          alert(`✅ Anuncio ${anuncioId ? 'actualizado' : 'creado'} exitosamente${imagenUrl ? ' con archivo adjunto' : ''}`);
          hideModal('anuncio-modal');
          filtrarAnuncios();
        } else {
          const error = await response.json();
          alert(`❌ Error: ${error.msg || 'No se pudo guardar el anuncio'}`);
        }
      } catch (error) {
        console.error('Error guardando anuncio:', error);
        alert('❌ Error al guardar anuncio');
      }
    });
  }
  
  // Form cierre mensual
  const cierreMensualForm = document.getElementById('cierre-mensual-form');
  if (cierreMensualForm) {
    cierreMensualForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('💾 Generando cierre mensual...');
      
      const formData = {
        mes: document.getElementById('cierre-mes').value,
        año: parseInt(document.getElementById('cierre-año').value)
      };
      
      console.log('Datos cierre mensual:', formData);
      
      if (!confirm(`¿Generar cierre mensual para ${formData.mes} ${formData.anio}?`)) {
        return;
      }
      
      try {
        const token = localStorage.getItem('edificio_token');
        const response = await fetch('/api/cierres', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          body: JSON.stringify({
            tipo: 'MENSUAL',
            mes: formData.mes,
            anio: formData.año
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          alert('✅ Cierre mensual generado exitosamente');
          hideModal('cierre-mensual-modal');
          cargarCierres();
        } else {
          const error = await response.json();
          alert(`❌ Error: ${error.msg || 'No se pudo generar el cierre'}`);
        }
      } catch (error) {
        console.error('Error generando cierre:', error);
        alert('❌ Error al generar cierre mensual');
      }
    });
  }
  
  // Form cierre anual
  const cierreAnualForm = document.getElementById('cierre-anual-form');
  if (cierreAnualForm) {
    cierreAnualForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('💾 Generando cierre anual...');
      
      const año = parseInt(document.getElementById('cierre-anual-año').value);
      
      console.log('Año cierre anual:', año);
      
      if (!confirm(`¿Generar cierre anual para ${año}? Esta acción requiere que todos los cierres mensuales estén completos.`)) {
        return;
      }
      
      try {
        const token = localStorage.getItem('edificio_token');
        const response = await fetch('/api/cierres', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          body: JSON.stringify({
            tipo: 'ANUAL',
            anio: año
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          alert('✅ Cierre anual generado exitosamente');
          hideModal('cierre-anual-modal');
          cargarCierres();
        } else {
          const error = await response.json();
          alert(`❌ Error: ${error.msg || 'No se pudo generar el cierre anual'}`);
        }
      } catch (error) {
        console.error('Error generando cierre anual:', error);
        alert('❌ Error al generar cierre anual');
      }
    });
  }
  
  // Form parcialidad
  const parcialidadForm = document.getElementById('parcialidad-form');
  if (parcialidadForm) {
    parcialidadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('💾 Registrando pago parcialidad...');
      
      const formData = {
        departamento: document.getElementById('parcialidad-departamento').value,
        monto: parseFloat(document.getElementById('parcialidad-monto').value),
        fecha: document.getElementById('parcialidad-fecha').value,
        comprobante: document.getElementById('parcialidad-comprobante').value,
        notas: document.getElementById('parcialidad-notas').value
      };
      
      console.log('Datos parcialidad:', formData);
      
      try {
        const token = localStorage.getItem('edificio_token');
        const response = await fetch('/api/parcialidades', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          alert('✅ Pago de parcialidad registrado exitosamente');
          hideModal('parcialidad-modal');
          cargarParcialidades();
        } else {
          const error = await response.json();
          alert(`❌ Error: ${error.msg || 'No se pudo registrar el pago'}`);
        }
      } catch (error) {
        console.error('Error registrando pago:', error);
        alert('❌ Error al registrar pago');
      }
    });
  }
}

function setupModalClosers() {
  // Botones cerrar (X)
  document.querySelectorAll('.modal .close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
      const modal = this.closest('.modal');
      if (modal) {
        modal.style.display = 'none';
      }
    });
  });
  
  // Botones cancelar
  document.querySelectorAll('.modal-cancel').forEach(cancelBtn => {
    cancelBtn.addEventListener('click', function() {
      const modal = this.closest('.modal');
      if (modal) {
        modal.style.display = 'none';
      }
    });
  });
  
  // Click fuera del modal
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });
}

async function editarUsuario(userId) {
  console.log('✏️ Editando usuario:', userId);
  
  try {
    const token = localStorage.getItem('edificio_token');
    const response = await fetch('/api/usuarios', {
      headers: { 'x-auth-token': token }
    });
    
    if (!response.ok) {
      alert('Error al cargar usuarios');
      return;
    }
    
    const data = await response.json();
    const user = data.usuarios.find(u => u.id === parseInt(userId));
    
    if (!user) {
      alert('Usuario no encontrado');
      return;
    }
    
    // Crear modal de edición
    const modalHTML = `
      <div id="editar-usuario-modal" class="modal" style="display: block;">
        <div class="modal-content">
          <span class="close" onclick="document.getElementById('editar-usuario-modal').remove()">&times;</span>
          <h2>Editar Usuario</h2>
          
          <form id="editar-usuario-form">
            <input type="hidden" id="editar-usuario-id" value="${user.id}">
            
            <div class="form-group">
              <label for="editar-usuario-nombre">Nombre:</label>
              <input type="text" id="editar-usuario-nombre" value="${user.nombre}" required>
            </div>
            
            <div class="form-group">
              <label for="editar-usuario-email">Email:</label>
              <input type="email" id="editar-usuario-email" value="${user.email}" required>
            </div>
            
            <div class="form-group">
              <label for="editar-usuario-rol">Rol:</label>
              <select id="editar-usuario-rol" required>
                <option value="INQUILINO" ${user.rol === 'INQUILINO' ? 'selected' : ''}>Inquilino</option>
                <option value="ADMIN" ${user.rol === 'ADMIN' ? 'selected' : ''}>Administrador</option>
                <option value="COMITE" ${user.rol === 'COMITE' ? 'selected' : ''}>Comité</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="editar-usuario-departamento">Departamento:</label>
              <input type="text" id="editar-usuario-departamento" value="${user.departamento || ''}" required>
            </div>
            
            <div class="form-group">
              <label for="editar-usuario-telefono">Teléfono:</label>
              <input type="tel" id="editar-usuario-telefono" value="${user.telefono || ''}">
            </div>
            
            <div class="form-group">
              <label for="editar-usuario-estatus">Estado de Validación:</label>
              <select id="editar-usuario-estatus" required>
                <option value="pendiente" ${user.estatus_validacion === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                <option value="validado" ${user.estatus_validacion === 'validado' ? 'selected' : ''}>Validado</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>
                <input type="checkbox" id="editar-usuario-editor" ${user.esEditor ? 'checked' : ''}>
                Es Editor
              </label>
            </div>
            
            <div class="form-group">
              <button type="submit" class="btn btn-primary">Actualizar Usuario</button>
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('editar-usuario-modal').remove()">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const form = document.getElementById('editar-usuario-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await actualizarUsuario(userId);
    });
    
  } catch (error) {
    console.error('Error:', error);
    alert('Error al cargar datos del usuario');
  }
}

async function actualizarUsuario(userId) {
  const formData = {
    nombre: document.getElementById('editar-usuario-nombre').value,
    email: document.getElementById('editar-usuario-email').value,
    rol: document.getElementById('editar-usuario-rol').value,
    departamento: document.getElementById('editar-usuario-departamento').value,
    telefono: document.getElementById('editar-usuario-telefono').value || null,
    estatus_validacion: document.getElementById('editar-usuario-estatus').value,
    esEditor: document.getElementById('editar-usuario-editor').checked
  };
  
  try {
    const token = localStorage.getItem('edificio_token');
    const response = await fetch(`/api/usuarios/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      alert('✅ Usuario actualizado exitosamente');
      document.getElementById('editar-usuario-modal').remove();
      filtrarUsuarios();
    } else {
      const error = await response.json();
      alert(`❌ Error: ${error.msg || 'No se pudo actualizar el usuario'}`);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error al actualizar usuario');
  }
}

async function eliminarUsuario(userId) {
  if (!confirm('¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('edificio_token');
    const response = await fetch(`/api/usuarios/${userId}`, {
      method: 'DELETE',
      headers: {
        'x-auth-token': token
      }
    });
    
    if (response.ok) {
      alert('✅ Usuario eliminado exitosamente');
      filtrarUsuarios();
    } else {
      const error = await response.json();
      alert(`❌ Error: ${error.msg || 'No se pudo eliminar el usuario'}`);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error al eliminar usuario');
  }
}

// Función para cargar fondos y almacenarlos globalmente
async function cargarFondosGlobales() {
  console.log('🌐 Cargando fondos globales...');
  
  try {
    const token = localStorage.getItem('edificio_token');
    const response = await fetch('/api/fondos', {
      headers: { 'x-auth-token': token }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.fondos)) {
        fondosGlobales = data.fondos;
        console.log('✅ Fondos globales cargados:', fondosGlobales.length);
        
        // Actualizar todos los selectores de fondos
        actualizarSelectoresFondos();
      }
    }
  } catch (error) {
    console.error('Error cargando fondos globales:', error);
  }
}

// Función para actualizar todos los selectores de fondos dinámicamente
function actualizarSelectoresFondos() {
  console.log('🔄 Actualizando selectores de fondos...');
  
  const selectores = [
    'gasto-fondo',
    'transferir-origen',
    'transferir-destino'
  ];
  
  selectores.forEach(selectorId => {
    const select = document.getElementById(selectorId);
    if (select && fondosGlobales.length > 0) {
      // Limpiar opciones actuales
      select.innerHTML = '';
      
      // Agregar fondos dinámicos
      fondosGlobales.forEach(fondo => {
        const option = document.createElement('option');
        option.value = fondo.id;
        option.textContent = `${fondo.nombre} ($${parseFloat(fondo.saldo || 0).toLocaleString('es-MX')})`;
        select.appendChild(option);
      });
      
      console.log(`   ✓ Selector ${selectorId} actualizado con ${fondosGlobales.length} fondos`);
    }
  });
}

async function cargarFondos() {
  console.log('💰 Cargando fondos...');
  
  try {
    const token = localStorage.getItem('edificio_token');
    const response = await fetch('/api/fondos', {
      headers: { 'x-auth-token': token }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('📊 Fondos recibidos:', data.fondos);
      
      const fondosArray = data.fondos;
      
      // Si fondos es un array (nueva estructura), renderizar dinámicamente
      if (Array.isArray(fondosArray)) {
        console.log('✅ Fondos en formato array (SaaS):', fondosArray.length);
        
        const container = document.querySelector('.fondos-summary');
        if (!container) {
          console.error('❌ Container .fondos-summary no encontrado');
          return;
        }
        
        // Limpiar contenedor
        container.innerHTML = '';
        
        if (fondosArray.length === 0) {
          container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #6B7280;">
              <i class="fas fa-piggy-bank" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
              <p style="margin-bottom: 0.5rem; font-size: 1.125rem; font-weight: 500;">No hay fondos registrados</p>
              <p style="font-size: 0.875rem;">Los fondos se crean automáticamente durante el setup del edificio</p>
            </div>
          `;
          return;
        }
        
        // Calcular patrimonio total
        let patrimonioTotal = 0;
        
        // Renderizar cada fondo
        fondosArray.forEach(fondo => {
          const saldo = parseFloat(fondo.saldo || 0);
          patrimonioTotal += saldo;
          
          const card = document.createElement('div');
          card.className = 'fondo-card';
          card.innerHTML = `
            <h3>${fondo.nombre}</h3>
            <p class="amount">$${saldo.toLocaleString('es-MX')}</p>
            <p class="description">${fondo.descripcion || 'Fondo del edificio'}</p>
          `;
          container.appendChild(card);
        });
        
        // Agregar card de patrimonio total
        const totalCard = document.createElement('div');
        totalCard.className = 'fondo-card total';
        totalCard.innerHTML = `
          <h3>Patrimonio Total</h3>
          <p class="amount" id="patrimonio-total-fondos">$${patrimonioTotal.toLocaleString('es-MX')}</p>
          <p class="description">Actualizado: ${new Date().toLocaleDateString('es-MX')}</p>
        `;
        container.appendChild(totalCard);
        
        console.log('✅ Fondos renderizados dinámicamente:', fondosArray.length, '- Total: $' + patrimonioTotal.toLocaleString());
        
      } else {
        // Estructura antigua (objeto) - mantener compatibilidad
        const elemAhorro = document.getElementById('ahorro-acumulado');
        const elemGastosMayores = document.getElementById('gastos-mayores');
        const elemDineroOp = document.getElementById('dinero-operacional');
        const elemPatrimonio = document.getElementById('patrimonio-total-fondos');
        
        if (elemAhorro) elemAhorro.textContent = `$${(fondosArray.ahorroAcumulado || 0).toLocaleString()}`;
        if (elemGastosMayores) elemGastosMayores.textContent = `$${(fondosArray.gastosMayores || 0).toLocaleString()}`;
        if (elemDineroOp) elemDineroOp.textContent = `$${(fondosArray.dineroOperacional || 0).toLocaleString()}`;
        if (elemPatrimonio) elemPatrimonio.textContent = `$${(fondosArray.patrimonioTotal || 0).toLocaleString()}`;
        
        console.log('✅ Fondos actualizados en tarjetas (estructura antigua)');
      }
    }
  } catch (error) {
    console.error('Error cargando fondos:', error);
  }
}

async function cargarMovimientosFondos() {
  console.log('📋 Cargando movimientos de fondos...');
  
  try {
    const token = localStorage.getItem('edificio_token');
    const response = await fetch('/api/fondos', {
      headers: { 'x-auth-token': token }
    });
    
    if (response.ok) {
      const data = await response.json();
      renderMovimientosTable(data.movimientos || []);
    }
  } catch (error) {
    console.error('Error cargando movimientos:', error);
  }
}

function renderMovimientosTable(movimientos) {
  const tbody = document.querySelector('#movimientos-table tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (!movimientos || movimientos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay movimientos registrados</td></tr>';
    return;
  }
  
  // Los movimientos ya vienen ordenados del más reciente al más antiguo
  const recientes = movimientos.slice(0, 50);
  
  recientes.forEach(mov => {
    const tr = document.createElement('tr');
    
    // Evitar problema de timezone en fechas
    const fecha = mov.fecha ? mov.fecha.split('T')[0].split('-').reverse().join('/') : '-';
    const tipoClass = mov.tipo === 'INGRESO' ? 'text-success' : mov.tipo === 'EGRESO' ? 'text-danger' : '';
    const tipoIcon = mov.tipo === 'INGRESO' ? '↑' : '↓';
    
    tr.innerHTML = `
      <td>${fecha}</td>
      <td class="${tipoClass}">
        <strong>${tipoIcon}</strong> ${mov.tipo}
      </td>
      <td>${mov.fondo_nombre || '-'}</td>
      <td>$${parseFloat(mov.monto || 0).toLocaleString('es-MX')}</td>
      <td>${mov.concepto || '-'}</td>
    `;
    
    tbody.appendChild(tr);
  });
  
  console.log(`✅ ${recientes.length} movimientos renderizados`);
}

async function cargarDashboard() {
  console.log('📊 Cargando dashboard...');
  
  try {
    const token = localStorage.getItem('edificio_token');
    
    // Cargar datos en paralelo y parsear
    const [fondosData, cuotasData, gastosData, anunciosData] = await Promise.all([
      fetch('/api/fondos', { headers: { 'x-auth-token': token } }).then(r => r.json()),
      fetch('/api/cuotas', { headers: { 'x-auth-token': token } }).then(r => r.json()),
      fetch('/api/gastos', { headers: { 'x-auth-token': token } }).then(r => r.json()),
      fetch('/api/anuncios?limit=5', { headers: { 'x-auth-token': token } }).then(r => r.json())
    ]);
    
    const cuotas = cuotasData.cuotas || [];
    const gastos = gastosData.gastos || [];
    
    // Procesar fondos
    if (fondosData.success) {
      console.log('💰 Fondos data:', fondosData);
      const fondos = fondosData.fondos;
      
      let patrimonioTotal = 0;
      
      // Si fondos es array (nueva estructura), calcular suma
      if (Array.isArray(fondos)) {
        patrimonioTotal = fondos.reduce((sum, f) => sum + parseFloat(f.saldo || 0), 0);
        console.log('💵 Patrimonio total (array):', patrimonioTotal, 'de', fondos.length, 'fondos');
      } else {
        // Estructura antigua (objeto)
        patrimonioTotal = fondos.patrimonioTotal || 
          (fondos.ahorroAcumulado + fondos.gastosMayores + fondos.dineroOperacional);
        console.log('💵 Patrimonio total (objeto):', patrimonioTotal);
      }
      
      const elemPatrimonio = document.getElementById('patrimonio-total');
      
      if (elemPatrimonio) {
        elemPatrimonio.textContent = `$${patrimonioTotal.toLocaleString('es-MX')}`;
        console.log('✅ Patrimonio actualizado en dashboard');
      } else {
        console.error('❌ Elemento patrimonio-total no encontrado');
      }
      
      // Gráfico de distribución de fondos con datos actualizados
      if (Array.isArray(fondos)) {
        renderFondosChartDynamic(fondos);
      } else {
        renderFondosChart(fondos);
      }
      
      // También actualizar el patrimonio en fondos si existe
      const elemPatrimonioFondos = document.getElementById('patrimonio-total-fondos');
      if (elemPatrimonioFondos) {
        elemPatrimonioFondos.textContent = `$${patrimonioTotal.toLocaleString('es-MX')}`;
      }
    }
    
    // Procesar cuotas
    if (cuotasData.success) {
      console.log('📋 Total cuotas:', cuotas.length);
      
      // Contar cuotas pendientes del mes actual
      const fecha = new Date();
      const mesActual = fecha.toLocaleString('es-MX', { month: 'long' });
      const anioActual = fecha.getFullYear();
      
      console.log('📅 Mes actual:', mesActual, anioActual);
      
      const cuotasPendientes = cuotas.filter(c => 
        c.estado === 'PENDIENTE' && 
        c.mes.toLowerCase() === mesActual.toLowerCase() && 
        c.anio === anioActual
      ).length;
      
      console.log('⏳ Cuotas pendientes:', cuotasPendientes);
      
      // Cuotas del mes actual (todas)
      const cuotasMesActual = cuotas.filter(c => 
        c.mes.toLowerCase() === mesActual.toLowerCase() && c.anio === anioActual
      );
      
      const cuotasPendientesMes = cuotasMesActual.filter(c => !c.pagado).length;
      const cuotasPagadasMes = cuotasMesActual.filter(c => c.pagado).length;
      
      // Ingresos del mes (cuotas pagadas)
      const ingresosMes = cuotasMesActual
        .filter(c => c.pagado)
        .reduce((sum, c) => sum + parseFloat(c.monto || 0) + parseFloat(c.monto_extraordinario || 0) + parseFloat(c.monto_mora || 0), 0);
      
      // Actualizar elementos
      const elemCuotasPendientes = document.getElementById('cuotas-pendientes');
      if (elemCuotasPendientes) {
        elemCuotasPendientes.textContent = cuotasPendientesMes;
      }
      
      const elemCuotasPagadas = document.getElementById('cuotas-pagadas');
      if (elemCuotasPagadas) {
        elemCuotasPagadas.textContent = cuotasPagadasMes;
      }
      
      const elemIngresosMes = document.getElementById('ingresos-mes');
      if (elemIngresosMes) {
        elemIngresosMes.textContent = `$${ingresosMes.toLocaleString('es-MX')}`;
      }
      
      // Gráfico de estado de cuotas
      renderCuotasChart(cuotasMesActual);
    }
    
    // Procesar gastos del mes
    if (gastosData.success) {
      
      // Gastos del mes actual
      const fecha = new Date();
      const gastosMes = gastos.filter(g => {
        const fechaGasto = new Date(g.fecha);
        return fechaGasto.getMonth() === fecha.getMonth() && 
               fechaGasto.getFullYear() === fecha.getFullYear();
      });
      
      const totalGastosMes = gastosMes.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0);
      
      const elemGastosMesTotal = document.getElementById('gastos-mes-total');
      if (elemGastosMesTotal) {
        elemGastosMesTotal.textContent = `$${totalGastosMes.toLocaleString('es-MX')}`;
      }
      
      // Calcular balance del mes (ingresos - gastos)
      const ingresosMesVal = parseFloat(document.getElementById('ingresos-mes')?.textContent.replace(/[$,]/g, '') || 0);
      const balanceMes = ingresosMesVal - totalGastosMes;
      
      const elemBalanceMes = document.getElementById('balance-mes');
      if (elemBalanceMes) {
        elemBalanceMes.textContent = `$${balanceMes.toLocaleString('es-MX')}`;
        elemBalanceMes.style.color = balanceMes >= 0 ? '#10B981' : '#EF4444';
      }
      
      // Últimos gastos
      const recentGastos = document.getElementById('recent-gastos');
      if (recentGastos) {
        const ultimos = gastos.slice(-5).reverse();
        if (ultimos.length === 0) {
          recentGastos.innerHTML = '<p style="color: #6B7280; text-align: center; padding: 1rem;">No hay gastos registrados</p>';
        } else {
          recentGastos.innerHTML = ultimos.map(g => `
            <div class="recent-item">
              <span>${g.concepto}</span>
              <span class="amount" style="color: #EF4444;">$${parseFloat(g.monto || 0).toLocaleString('es-MX')}</span>
            </div>
          `).join('');
        }
      }
    }
    
    // Cargar movimientos recientes (obtener fondos de nuevo con movimientos)
    const fondosMovRes = await fetch('/api/fondos', { headers: { 'x-auth-token': localStorage.getItem('edificio_token') } });
    if (fondosMovRes.ok) {
      const fondosMovData = await fondosMovRes.json();
      const movimientos = fondosMovData.movimientos || [];
      
      const recentMovimientos = document.getElementById('recent-movimientos');
      if (recentMovimientos) {
        const ultimos = movimientos.slice(0, 5);
        if (ultimos.length === 0) {
          recentMovimientos.innerHTML = '<p style="color: #6B7280; text-align: center; padding: 1rem;">No hay movimientos</p>';
        } else {
          recentMovimientos.innerHTML = ultimos.map(m => {
            const tipo = m.tipo === 'INGRESO' ? '↑' : '↓';
            const color = m.tipo === 'INGRESO' ? '#10B981' : '#EF4444';
            return `
              <div class="recent-item">
                <div>
                  <strong style="color: ${color};">${tipo}</strong> ${m.fondo_nombre || 'Fondo'}
                  <br><small style="color: #6B7280;">${m.concepto || 'Sin concepto'}</small>
                </div>
                <span class="amount" style="color: ${color};">$${parseFloat(m.monto || 0).toLocaleString('es-MX')}</span>
              </div>
            `;
          }).join('');
        }
      }
    }
    
    // Cargar proyectos activos
    const proyectosRes = await fetch('/api/proyectos', { headers: { 'x-auth-token': localStorage.getItem('edificio_token') } });
    if (proyectosRes.ok) {
      const proyectosData = await proyectosRes.json();
      const proyectos = proyectosData.proyectos || [];
      
      const recentProyectos = document.getElementById('recent-proyectos');
      if (recentProyectos) {
        if (proyectos.length === 0) {
          recentProyectos.innerHTML = '<p style="color: #6B7280; text-align: center; padding: 1rem;">No hay proyectos activos</p>';
        } else {
          recentProyectos.innerHTML = proyectos.slice(0, 5).map(p => `
            <div class="recent-item">
              <div>
                ${p.nombre}
                <br><small style="background: #F59E0B; color: white; padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem;">${p.prioridad}</small>
              </div>
              <span class="amount">$${parseFloat(p.monto || 0).toLocaleString('es-MX')}</span>
            </div>
          `).join('');
        }
      }
    }
    
    // Renderizar gráficos adicionales
    renderBalanceChart(cuotas, gastos);
    renderGastosCategoria(gastos);
    
    console.log('✅ Dashboard cargado');
    
  } catch (error) {
    console.error('Error cargando dashboard:', error);
  }
}

async function editarAnuncio(anuncioId) {
  console.log('✏️ Editando anuncio:', anuncioId);
  
  try {
    const token = localStorage.getItem('edificio_token');
    const response = await fetch('/api/anuncios', {
      headers: { 'x-auth-token': token }
    });
    
    if (!response.ok) {
      alert('Error al cargar anuncios');
      return;
    }
    
    const data = await response.json();
    const anuncio = data.anuncios?.find(a => a.id === parseInt(anuncioId));
    
    if (!anuncio) {
      alert('Anuncio no encontrado');
      return;
    }
    
    // Llenar form del modal existente
    document.getElementById('anuncio-id').value = anuncio.id;
    document.getElementById('anuncio-titulo').value = anuncio.titulo;
    document.getElementById('anuncio-tipo').value = anuncio.tipo;
    document.getElementById('anuncio-contenido').value = anuncio.contenido;
    document.getElementById('anuncio-modal-title').textContent = 'Editar Anuncio';
    
    showModal('anuncio-modal');
    
  } catch (error) {
    console.error('Error:', error);
    alert('Error al cargar datos del anuncio');
  }
}

async function eliminarAnuncio(anuncioId) {
  if (!confirm('¿Está seguro de eliminar este anuncio?')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('edificio_token');
    const response = await fetch(`/api/anuncios/${anuncioId}`, {
      method: 'DELETE',
      headers: {
        'x-auth-token': token
      }
    });
    
    if (response.ok) {
      alert('✅ Anuncio eliminado exitosamente');
      filtrarAnuncios();
    } else {
      const error = await response.json();
      alert(`❌ Error: ${error.msg || 'No se pudo eliminar el anuncio'}`);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error al eliminar anuncio');
  }
}

async function cargarParcialidades() {
  console.log('📋 Cargando parcialidades...');
  
  try {
    const token = localStorage.getItem('edificio_token');
    
    // Cargar pagos
    const responsePagos = await fetch('/api/parcialidades/pagos', {
      headers: { 'x-auth-token': token }
    });
    
    if (responsePagos.ok) {
      const data = await responsePagos.json();
      renderParcialidadesTable(data.pagos || []);
    }
    
    // Cargar estado de pagos
    const responseEstado = await fetch('/api/parcialidades/estado', {
      headers: { 'x-auth-token': token }
    });
    
    console.log('📡 Estado response status:', responseEstado.status);
    
    if (responseEstado.ok) {
      const estado = await responseEstado.json();
      console.log('📊 Estado recibido:', estado);
      renderProgresoParcialidades(estado);
    } else {
      console.error('❌ Error al cargar estado:', responseEstado.status);
    }
    
  } catch (error) {
    console.error('Error cargando parcialidades:', error);
  }
}

function renderParcialidadesTable(pagos) {
  const tbody = document.querySelector('#parcialidades-table tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (!pagos || pagos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay pagos registrados</td></tr>';
    return;
  }
  
  pagos.forEach(pago => {
    const tr = document.createElement('tr');
    
    const fecha = new Date(pago.fecha).toLocaleDateString('es-MX');
    const estadoClass = pago.estado === 'validado' ? 'text-success' : 'text-warning';
    const estadoTexto = pago.estado === 'validado' ? 'Validado' : 'Pendiente';
    
    tr.innerHTML = `
      <td>${fecha}</td>
      <td>${pago.departamento}</td>
      <td>$${pago.monto.toLocaleString()}</td>
      <td>${pago.comprobante || '-'}</td>
      <td class="${estadoClass}">${estadoTexto}</td>
      <td>
        ${pago.estado !== 'validado' ? `
          <button class="btn btn-sm btn-success" data-action="validar-parcialidad" data-id="${pago.id}">
            <i class="fas fa-check"></i> Validar
          </button>
        ` : `
          <button class="btn btn-sm btn-secondary" data-action="rechazar-parcialidad" data-id="${pago.id}">
            <i class="fas fa-times"></i> Rechazar
          </button>
        `}
      </td>
    `;
    
    tbody.appendChild(tr);
  });
  
  console.log(`✅ ${pagos.length} pagos de parcialidades renderizados`);
}

function renderProgresoParcialidades(data) {
  const container = document.getElementById('parcialidades-progress-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  const estadoPagos = data.estadoPagos || data;
  
  console.log('📊 Procesando estado pagos:', estadoPagos);
  
  if (!estadoPagos || estadoPagos.length === 0) {
    container.innerHTML = '<p class="text-center">No hay datos de progreso</p>';
    return;
  }
  
  const objetivoPorDepto = 14250; // $285,000 / 20 departamentos
  
  // estadoPagos es un array con objetos {departamento, pagado, porcentaje}
  estadoPagos.forEach(item => {
    const monto = item.pagado || 0;
    const porcentaje = item.porcentaje || Math.min((monto / objetivoPorDepto) * 100, 100);
    const faltante = Math.max(objetivoPorDepto - monto, 0);
    
    console.log(`Depto ${item.departamento}: $${monto} (${porcentaje.toFixed(1)}%)`);
    
    const div = document.createElement('div');
    div.className = 'progress-item';
    div.style.marginBottom = '15px';
    div.innerHTML = `
      <div class="progress-header" style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span><strong>Depto ${item.departamento}</strong></span>
        <span>${porcentaje.toFixed(1)}% ($${monto.toLocaleString()} / $${objetivoPorDepto.toLocaleString()})</span>
      </div>
      <div class="progress-bar-container" style="width: 100%; height: 25px; background-color: #e9ecef; border-radius: 4px; overflow: hidden;">
        <div class="progress-bar" style="width: ${porcentaje}%; height: 100%; background-color: ${porcentaje >= 100 ? '#28a745' : porcentaje >= 50 ? '#ffc107' : '#dc3545'}; transition: width 0.3s;">
        </div>
      </div>
      <div class="progress-footer" style="text-align: right; margin-top: 3px;">
        <small>Faltante: $${faltante.toLocaleString()}</small>
      </div>
    `;
    
    container.appendChild(div);
  });
  
  console.log(`✅ Progreso de ${estadoPagos.length} departamentos renderizado`);
}

// Variables globales para los charts
let fondosChartInstance = null;
let cuotasChartInstance = null;

function renderFondosChart(fondos) {
  const container = document.getElementById('fondos-chart');
  if (!container) {
    console.log('⚠️ Container fondos-chart no encontrado');
    return;
  }
  
  // Crear canvas si no existe
  let canvas = container.querySelector('canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    container.innerHTML = '';
    container.appendChild(canvas);
  }
  
  // Destruir chart anterior si existe
  if (fondosChartInstance) {
    fondosChartInstance.destroy();
  }
  
  const ctx = canvas.getContext('2d');
  
  fondosChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Ahorro Acumulado', 'Gastos Mayores', 'Dinero Operacional'],
      datasets: [{
        data: [
          fondos.ahorroAcumulado || 0,
          fondos.gastosMayores || 0,
          fondos.dineroOperacional || 0
        ],
        backgroundColor: [
          '#28a745',
          '#ffc107',
          '#007bff'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
  
  console.log('✅ Gráfico de fondos renderizado');
}

// Función para renderizar gráfico con fondos dinámicos (array)
function renderFondosChartDynamic(fondosArray) {
  const container = document.getElementById('fondos-chart');
  if (!container) {
    console.log('⚠️ Container fondos-chart no encontrado');
    return;
  }
  
  // Crear canvas si no existe
  let canvas = container.querySelector('canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    container.innerHTML = '';
    container.appendChild(canvas);
  }
  
  // Destruir chart anterior si existe
  if (fondosChartInstance) {
    fondosChartInstance.destroy();
  }
  
  const ctx = canvas.getContext('2d');
  
  // Preparar datos del chart
  const labels = fondosArray.map(f => f.nombre);
  const data = fondosArray.map(f => parseFloat(f.saldo || 0));
  const colors = [
    '#28a745', '#007bff', '#ffc107', '#dc3545', '#6f42c1', 
    '#20c997', '#fd7e14', '#e83e8c', '#17a2b8', '#6c757d'
  ];
  
  fondosChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors.slice(0, fondosArray.length)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              return `${label}: $${value.toLocaleString('es-MX')}`;
            }
          }
        }
      }
    }
  });
  
  console.log('✅ Gráfico de fondos dinámico renderizado con', fondosArray.length, 'fondos');
}

function renderCuotasChart(cuotas) {
  const container = document.getElementById('cuotas-chart');
  if (!container) {
    console.log('⚠️ Container cuotas-chart no encontrado');
    return;
  }
  
  // Crear canvas si no existe
  let canvas = container.querySelector('canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    container.innerHTML = '';
    container.appendChild(canvas);
  }
  
  // Destruir chart anterior si existe
  if (cuotasChartInstance) {
    cuotasChartInstance.destroy();
  }
  
  // Contar cuotas por estado (usar campos reales)
  const pagadas = cuotas.filter(c => c.pagado === 1).length;
  const vencidas = cuotas.filter(c => c.vencida === 1 && c.pagado !== 1).length;
  const pendientes = cuotas.filter(c => c.pagado !== 1 && c.vencida !== 1).length;
  
  console.log('📊 Cuotas para gráfico:', { pagadas, pendientes, vencidas, total: cuotas.length });
  
  // Si no hay cuotas, mostrar mensaje
  if (cuotas.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #6B7280; padding: 2rem;">No hay cuotas del mes actual</p>';
    return;
  }
  
  const ctx = canvas.getContext('2d');
  
  cuotasChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Pagadas', 'Pendientes', 'Vencidas'],
      datasets: [{
        data: [pagadas, pendientes, vencidas],
        backgroundColor: [
          '#10B981',
          '#F59E0B',
          '#EF4444'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = cuotas.length;
              const percent = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percent}%)`;
            }
          }
        }
      }
    }
  });
  
  console.log('✅ Gráfico de cuotas renderizado');
}

async function validarParcialidad(pagoId) {
  if (!confirm('¿Validar este pago de parcialidad? Se actualizará el fondo de Ahorro Acumulado.')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('edificio_token');
    const response = await fetch(`/api/parcialidades/pagos/${pagoId}/validar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ estado: 'validado' })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Pago validado:', result);
      
      // Recargar parcialidades
      await cargarParcialidades();
      
      // Recargar fondos para ver el cambio
      console.log('🔄 Recargando fondos...');
      await cargarFondos();
      
      alert('✅ Pago validado exitosamente. Ahorro Acumulado actualizado.');
    } else {
      const error = await response.json();
      alert(`❌ Error: ${error.msg || 'No se pudo validar el pago'}`);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error al validar pago');
  }
}

async function rechazarParcialidad(pagoId) {
  if (!confirm('¿Rechazar este pago de parcialidad? Se revertirá el monto del Ahorro Acumulado.')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('edificio_token');
    const response = await fetch(`/api/parcialidades/pagos/${pagoId}/validar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ estado: 'pendiente' })
    });
    
    if (response.ok) {
      alert('✅ Pago rechazado. Ahorro Acumulado actualizado.');
      
      // Recargar parcialidades
      cargarParcialidades();
      
      // Recargar fondos para ver el cambio
      if (typeof cargarFondos === 'function') {
        await cargarFondos();
      }
    } else {
      const error = await response.json();
      alert(`❌ Error: ${error.msg || 'No se pudo rechazar el pago'}`);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error al rechazar pago');
  }
}

async function verDetalleCierre(cierreId) {
  console.log('👁️ Viendo detalle de cierre:', cierreId);
  
  try {
    const token = localStorage.getItem('edificio_token');
    const response = await fetch('/api/cierres', {
      headers: { 'x-auth-token': token }
    });
    
    if (!response.ok) {
      alert('Error al cargar cierres');
      return;
    }
    
    const data = await response.json();
    const cierre = data.cierres?.find(c => c.id === cierreId || c.id === parseInt(cierreId));
    
    if (!cierre) {
      alert('Cierre no encontrado');
      return;
    }
    
    // Formatear detalle del cierre
    const ingresos = typeof cierre.ingresos === 'object' ? cierre.ingresos.total : cierre.ingresos || 0;
    const gastos = typeof cierre.gastos === 'object' ? cierre.gastos.total : cierre.gastos || 0;
    const balance = cierre.balance || (ingresos - gastos);
    const fecha = new Date(cierre.fecha || cierre.createdAt).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const detalle = `
      <div class="cierre-detalle printable-cierre">
        <div class="cierre-header">
          <h2>Edificio 205 - Administración de Condominio</h2>
          <h3>${cierre.tipo === 'ANUAL' ? `Cierre Contable Anual ${cierre.año}` : `Cierre Contable ${cierre.mes} ${cierre.año}`}</h3>
          <p class="fecha-impresion">Fecha de cierre: ${fecha}</p>
        </div>
        
        <hr>
        
        <div class="cierre-resumen">
          <table class="tabla-resumen">
            <thead>
              <tr>
                <th>Concepto</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              <tr class="ingreso-row">
                <td><strong>INGRESOS</strong></td>
                <td class="text-success"><strong>$${ingresos.toLocaleString()}</strong></td>
              </tr>
              ${cierre.ingresos?.cuotas ? `
                <tr>
                  <td style="padding-left: 20px;">- Cuotas pagadas</td>
                  <td>$${cierre.ingresos.cuotas.toLocaleString()}</td>
                </tr>
              ` : ''}
              ${cierre.ingresos?.otros ? `
                <tr>
                  <td style="padding-left: 20px;">- Otros ingresos</td>
                  <td>$${cierre.ingresos.otros.toLocaleString()}</td>
                </tr>
              ` : ''}
              <tr class="gasto-row">
                <td><strong>GASTOS</strong></td>
                <td class="text-danger"><strong>$${gastos.toLocaleString()}</strong></td>
              </tr>
              ${cierre.gastos?.desglose?.length ? 
                cierre.gastos.desglose.slice(0, 5).map(g => `
                  <tr>
                    <td style="padding-left: 20px;">- ${g.concepto}</td>
                    <td>$${g.monto.toLocaleString()}</td>
                  </tr>
                `).join('') : ''}
              ${cierre.gastos?.desglose?.length > 5 ? `
                <tr>
                  <td colspan="2" style="padding-left: 20px; font-style: italic;">
                    ... y ${cierre.gastos.desglose.length - 5} gastos más
                  </td>
                </tr>
              ` : ''}
              <tr class="balance-row">
                <td><strong>BALANCE</strong></td>
                <td class="${balance >= 0 ? 'text-success' : 'text-danger'}">
                  <strong>$${balance.toLocaleString()}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        ${cierre.fondos ? `
          <hr>
          <div class="cierre-fondos">
            <h4>Estado de Fondos al Cierre</h4>
            <table class="tabla-fondos">
              <thead>
                <tr>
                  <th>Fondo</th>
                  <th>Saldo</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Ahorro Acumulado</td>
                  <td>$${cierre.fondos.ahorroAcumulado?.toLocaleString() || 0}</td>
                </tr>
                <tr>
                  <td>Gastos Mayores</td>
                  <td>$${cierre.fondos.gastosMayores?.toLocaleString() || 0}</td>
                </tr>
                <tr>
                  <td>Dinero Operacional</td>
                  <td>$${cierre.fondos.dineroOperacional?.toLocaleString() || 0}</td>
                </tr>
                <tr class="total-row">
                  <td><strong>PATRIMONIO TOTAL</strong></td>
                  <td><strong>$${cierre.fondos.patrimonioTotal?.toLocaleString() || 0}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        ` : ''}
        
        ${cierre.cuotasPagadas !== undefined ? `
          <hr>
          <div class="cierre-cuotas">
            <h4>Estado de Cuotas</h4>
            <p>✅ Cuotas Pagadas: <strong>${cierre.cuotasPagadas}</strong></p>
            <p>⏳ Cuotas Pendientes/Vencidas: <strong>${cierre.cuotasPendientes || 0}</strong></p>
          </div>
        ` : ''}
        
        ${cierre.cuotasSiguienteAño ? `
          <hr>
          <div class="cierre-siguiente-año">
            <h4>Cuotas Generadas para ${cierre.cuotasSiguienteAño.año}</h4>
            <p>✅ ${cierre.cuotasSiguienteAño.mensaje || 'Cuotas generadas correctamente'}</p>
          </div>
        ` : ''}
        
        <div class="cierre-footer">
          <p><em>Documento generado automáticamente - Edificio 205</em></p>
          <p><small>Fecha de impresión: ${new Date().toLocaleDateString('es-MX')}</small></p>
        </div>
      </div>
      
      <style>
        .cierre-header { text-align: center; margin-bottom: 20px; }
        .tabla-resumen, .tabla-fondos { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0; 
        }
        .tabla-resumen th, .tabla-resumen td,
        .tabla-fondos th, .tabla-fondos td { 
          border: 1px solid #ddd; 
          padding: 10px; 
          text-align: left; 
        }
        .tabla-resumen th, .tabla-fondos th { 
          background-color: #f0f0f0; 
          font-weight: bold; 
        }
        .ingreso-row, .gasto-row, .balance-row, .total-row {
          background-color: #f9f9f9;
        }
        .cierre-footer { 
          margin-top: 40px; 
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center; 
          font-size: 12px;
        }
        
        @media print {
          .sidebar, .main-header, .filter-controls, .section-header,
          .modal-content .btn, .modal-content .close { 
            display: none !important; 
          }
          .modal-content {
            box-shadow: none !important;
            max-width: 100% !important;
          }
          .printable-cierre { 
            padding: 20px;
            font-family: Arial, sans-serif;
          }
          .cierre-header h2 { font-size: 18px; }
          .cierre-header h3 { font-size: 16px; }
          .tabla-resumen, .tabla-fondos { page-break-inside: avoid; }
        }
      </style>
    `;
    
    document.getElementById('cierre-detalle-content').innerHTML = detalle;
    document.getElementById('cierre-detalle-titulo').textContent = 
      cierre.tipo === 'ANUAL' ? `Detalle Cierre Anual ${cierre.año}` : `Detalle Cierre ${cierre.mes} ${cierre.año}`;
    
    showModal('cierre-detalle-modal');
    
  } catch (error) {
    console.error('Error:', error);
    alert('Error al cargar detalle del cierre');
  }
}

async function editarGasto(gastoId) {
  console.log('✏️ Editando gasto:', gastoId);
  
  try {
    const token = localStorage.getItem('edificio_token');
    const response = await fetch('/api/gastos', {
      headers: { 'x-auth-token': token }
    });
    
    if (!response.ok) {
      alert('Error al cargar gastos');
      return;
    }
    
    const data = await response.json();
    console.log('📊 Datos recibidos:', data);
    console.log('🔍 Buscando gasto ID:', gastoId, 'tipo:', typeof gastoId);
    console.log('📋 Gastos disponibles:', data.gastos?.map(g => ({id: g.id, tipo: typeof g.id})));
    
    const gasto = data.gastos?.find(g => g.id === parseInt(gastoId));
    
    console.log('✓ Gasto encontrado:', gasto);
    
    if (!gasto) {
      alert('Gasto no encontrado');
      console.error('❌ No se encontró gasto con ID:', gastoId);
      return;
    }
    
    // Crear modal de edición
    const modalHTML = `
      <div id="editar-gasto-modal" class="modal" style="display: block;">
        <div class="modal-content">
          <span class="close" onclick="document.getElementById('editar-gasto-modal').remove()">&times;</span>
          <h2>Editar Gasto</h2>
          
          <form id="editar-gasto-form">
            <input type="hidden" id="editar-gasto-id" value="${gasto.id}">
            
            <div class="form-group">
              <label for="editar-gasto-concepto">Concepto:</label>
              <input type="text" id="editar-gasto-concepto" value="${gasto.concepto}" required>
            </div>
            
            <div class="form-group">
              <label for="editar-gasto-monto">Monto:</label>
              <input type="number" id="editar-gasto-monto" value="${gasto.monto}" min="0" step="0.01" required>
            </div>
            
            <div class="form-group">
              <label for="editar-gasto-categoria">Categoría:</label>
              <select id="editar-gasto-categoria" required>
                <option value="MANTENIMIENTO" ${gasto.categoria === 'MANTENIMIENTO' ? 'selected' : ''}>Mantenimiento</option>
                <option value="SERVICIOS" ${gasto.categoria === 'SERVICIOS' ? 'selected' : ''}>Servicios</option>
                <option value="REPARACIONES" ${gasto.categoria === 'REPARACIONES' ? 'selected' : ''}>Reparaciones</option>
                <option value="ADMINISTRATIVO" ${gasto.categoria === 'ADMINISTRATIVO' ? 'selected' : ''}>Administrativo</option>
                <option value="OTROS" ${gasto.categoria === 'OTROS' ? 'selected' : ''}>Otros</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="editar-gasto-proveedor">Proveedor:</label>
              <input type="text" id="editar-gasto-proveedor" value="${gasto.proveedor || ''}" required>
            </div>
            
            <div class="form-group">
              <label for="editar-gasto-fecha">Fecha:</label>
              <input type="date" id="editar-gasto-fecha" value="${gasto.fecha.split('T')[0]}" required>
            </div>
            
            <div class="form-group">
              <label for="editar-gasto-fondo">Fondo:</label>
              <select id="editar-gasto-fondo" required>
                <option value="dineroOperacional" ${gasto.fondo === 'dineroOperacional' ? 'selected' : ''}>Dinero Operacional</option>
                <option value="ahorroAcumulado" ${gasto.fondo === 'ahorroAcumulado' ? 'selected' : ''}>Ahorro Acumulado</option>
                <option value="gastosMayores" ${gasto.fondo === 'gastosMayores' ? 'selected' : ''}>Gastos Mayores</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="editar-gasto-comprobante">Comprobante:</label>
              <input type="text" id="editar-gasto-comprobante" value="${gasto.comprobante || ''}">
            </div>
            
            <div class="form-group">
              <label for="editar-gasto-notas">Notas:</label>
              <textarea id="editar-gasto-notas" rows="3">${gasto.notas || ''}</textarea>
            </div>
            
            <div class="form-group">
              <button type="submit" class="btn btn-primary">Actualizar Gasto</button>
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('editar-gasto-modal').remove()">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const form = document.getElementById('editar-gasto-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('📝 Submit form editar gasto');
        await actualizarGasto(gastoId);
      });
    } else {
      console.error('❌ Form editar-gasto-form no encontrado');
    }
    
  } catch (error) {
    console.error('Error:', error);
    alert('Error al cargar datos del gasto');
  }
}

async function actualizarGasto(gastoId) {
  console.log('💾 Actualizando gasto:', gastoId);
  
  const formData = {
    concepto: document.getElementById('editar-gasto-concepto').value,
    monto: parseFloat(document.getElementById('editar-gasto-monto').value),
    categoria: document.getElementById('editar-gasto-categoria').value,
    proveedor: document.getElementById('editar-gasto-proveedor').value,
    fecha: document.getElementById('editar-gasto-fecha').value,
    fondo: document.getElementById('editar-gasto-fondo').value,
    comprobante: document.getElementById('editar-gasto-comprobante').value,
    notas: document.getElementById('editar-gasto-notas').value
  };
  
  console.log('📤 Datos a enviar:', formData);
  
  try {
    const token = localStorage.getItem('edificio_token');
    console.log('🔑 Token:', token ? 'presente' : 'ausente');
    
    const response = await fetch(`/api/gastos/${gastoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify(formData)
    });
    
    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Respuesta exitosa:', result);
      alert('✅ Gasto actualizado exitosamente');
      document.getElementById('editar-gasto-modal').remove();
      filtrarGastos();
    } else {
      const error = await response.json();
      console.error('❌ Error del servidor:', error);
      alert(`❌ Error: ${error.msg || 'No se pudo actualizar el gasto'}`);
    }
  } catch (error) {
    console.error('❌ Exception:', error);
    alert('❌ Error al actualizar gasto: ' + error.message);
  }
}

async function eliminarGasto(gastoId) {
  if (!confirm('¿Está seguro de eliminar este gasto? Esta acción no se puede deshacer.')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('edificio_token');
    const response = await fetch(`/api/gastos/${gastoId}`, {
      method: 'DELETE',
      headers: {
        'x-auth-token': token
      }
    });
    
    if (response.ok) {
      alert('✅ Gasto eliminado exitosamente');
      filtrarGastos();
    } else {
      const error = await response.json();
      alert(`❌ Error: ${error.msg || 'No se pudo eliminar el gasto'}`);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error al eliminar gasto');
  }
}

// ========== GENERACIÓN MASIVA DE CUOTAS ==========

let buildingInfo = null;

async function cargarInfoEdificio() {
  try {
    const token = localStorage.getItem('edificio_token');
    const response = await fetch('/api/onboarding/building-info', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.ok && data.buildingInfo) {
        buildingInfo = data.buildingInfo;
        
        // Actualizar info en el modal
        const infoEl = document.getElementById('total-unidades-info');
        if (infoEl) {
          infoEl.textContent = buildingInfo.totalUnidades || 20;
        }
      }
    }
  } catch (error) {
    console.error('Error cargando info edificio:', error);
  }
}

function resetGenerarMasivoForm() {
  const form = document.getElementById('generar-masivo-form');
  if (form) {
    form.reset();
    
    // Establecer mes y año actual
    const today = new Date();
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const mesActual = meses[today.getMonth()];
    const anioActual = today.getFullYear();
    
    const masivoMesSelect = document.getElementById('masivo-mes');
    const masivoAnioInput = document.getElementById('masivo-año');
    const masivoMontoInput = document.getElementById('masivo-monto');
    
    if (masivoMesSelect) masivoMesSelect.value = mesActual;
    if (masivoAnioInput) masivoAnioInput.value = anioActual;
    
    // Pre-llenar con cuota mensual del edificio si está disponible
    if (buildingInfo && buildingInfo.cuotaMensual) {
      if (masivoMontoInput) masivoMontoInput.value = buildingInfo.cuotaMensual;
    }
  }
}

// Event listener para el formulario de generación masiva
const generarMasivoForm = document.getElementById('generar-masivo-form');
if (generarMasivoForm) {
  generarMasivoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('⚡ Generando cuotas masivas...');
    
    const mes = document.getElementById('masivo-mes').value;
    const anio = parseInt(document.getElementById('masivo-año').value);
    const monto = parseFloat(document.getElementById('masivo-monto').value);
    
    const totalUnidades = buildingInfo?.totalUnidades || 20;
    
    if (!confirm(`¿Generar ${totalUnidades} cuotas de $${monto.toLocaleString('es-MX')} para ${mes} ${anio}?`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('edificio_token');
      const response = await fetch('/api/cuotas/generar-masivo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          mes,
          anio,
          monto,
          departamentos: 'TODOS'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        let mensaje = `✅ ${data.message}\n\n` +
              `Cuotas creadas: ${data.cuotasCreadas}\n` +
              `Ya existían: ${data.cuotasExistentes}\n` +
              `Total unidades: ${data.totalUnidades || totalUnidades}`;
        
        if (data.errores && data.errores.length > 0) {
          mensaje += `\n\n⚠️ Errores: ${data.errores.length}\n`;
          mensaje += data.errores.slice(0, 3).join('\n');
          if (data.errores.length > 3) {
            mensaje += `\n... y ${data.errores.length - 3} más`;
          }
        }
        
        alert(mensaje);
        hideModal('generar-masivo-modal');
        filtrarCuotas();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.message || 'No se pudieron generar las cuotas'}`);
      }
    } catch (error) {
      console.error('Error generando cuotas:', error);
      alert('❌ Error al generar cuotas');
    }
  });
}

// ========== CÁLCULO AUTOMÁTICO DE MORA ==========

async function calcularMoraAutomatica() {
  if (!confirm('¿Calcular mora automáticamente para todas las cuotas vencidas?\n\nSe aplicará el recargo configurado en el edificio.')) {
    return;
  }

  try {
    const token = localStorage.getItem('edificio_token');
    
    console.log('🧮 Calculando mora...');
    
    const response = await fetch('/api/cuotas/calcular-mora', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      alert(
        `✅ ${data.message}\n\n` +
        `Cuotas con mora: ${data.cuotasActualizadas}\n` +
        `Mora total aplicada: $${parseFloat(data.moraTotal).toLocaleString('es-MX')}\n\n` +
        `Configuración aplicada:\n` +
        `• Día de corte: ${data.configuracion.cutoffDay}\n` +
        `• Días de gracia: ${data.configuracion.graceDays}\n` +
        `• Tasa de mora: ${data.configuracion.latePercent}`
      );
      
      // Recargar cuotas para ver las actualizadas
      filtrarCuotas();
      
      // Actualizar dashboard si está visible
      const dashboardSection = document.getElementById('dashboard-section');
      if (dashboardSection && dashboardSection.style.display !== 'none') {
        cargarDashboard();
      }
    } else {
      const error = await response.json();
      alert(`❌ Error: ${error.message || 'No se pudo calcular la mora'}`);
    }
  } catch (error) {
    console.error('Error calculando mora:', error);
    alert('❌ Error al calcular mora');
  }
}

// ========== REPORTES PDF ==========

function generarReporteCuotas() {
  // Obtener filtros actuales
  const mes = document.getElementById('cuotas-mes')?.value;
  const anio = document.getElementById('cuotas-año')?.value;
  
  let url = '/reporte-estado-cuenta.html?depto=TODOS';
  
  if (mes) url += `&mes=${mes}`;
  if (anio) url += `&anio=${anio}`;
  
  // Abrir en nueva ventana
  window.open(url, '_blank', 'width=1024,height=768');
}

function generarReporteBalance() {
  // Obtener filtros actuales si existen
  const mes = document.getElementById('cuotas-mes')?.value;
  const anio = document.getElementById('cuotas-año')?.value;
  
  let url = '/reporte-balance.html';
  const params = new URLSearchParams();
  
  if (mes) params.append('mes', mes);
  if (anio) params.append('anio', anio);
  
  if (params.toString()) {
    url += '?' + params.toString();
  }
  
  // Abrir en nueva ventana
  window.open(url, '_blank', 'width=1024,height=768');
}

// ========== PROYECTOS CRÍTICOS ==========

async function cargarProyectosMain() {
  console.log('📋 Cargando proyectos...');
  
  try {
    const token = localStorage.getItem('edificio_token');
    const response = await fetch('/api/proyectos', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'x-auth-token': token
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const proyectos = data.proyectos || [];
      const resumen = data.resumen || {};
      
      renderProyectosMain(proyectos, resumen);
    }
  } catch (error) {
    console.error('Error cargando proyectos:', error);
  }
}

function renderProyectosMain(proyectos, resumen) {
  const container = document.getElementById('proyectos-list-main');
  if (!container) return;
  
  if (proyectos.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: #6B7280;">
        <i class="fas fa-project-diagram" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem;"></i>
        <p>No hay proyectos registrados</p>
        <p style="font-size: 0.875rem; margin-top: 0.5rem;">Agrega proyectos críticos del condominio</p>
      </div>
    `;
    
    // Actualizar resumen en 0
    document.getElementById('proyectos-total-main').textContent = '$0';
    document.getElementById('proyectos-por-depto-main').textContent = '$0';
    document.getElementById('proyectos-unidades-main').textContent = '0';
    return;
  }
  
  container.innerHTML = proyectos.map(p => {
    const prioridadColors = {
      'URGENTE': '#EF4444',
      'ALTA': '#F59E0B',
      'MEDIA': '#3B82F6',
      'BAJA': '#6B7280'
    };
    
    return `
      <div style="border: 2px solid #E5E7EB; border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 1rem; background: white;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <h4 style="color: #1F2937; margin-bottom: 0.5rem;">${p.nombre}</h4>
            <p style="color: #6B7280; font-size: 0.875rem; margin-bottom: 1rem;">${p.descripcion || 'Sin descripción'}</p>
            <div style="display: flex; gap: 1rem; align-items: center;">
              <span style="background: ${prioridadColors[p.prioridad] || '#6B7280'}; color: white; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 600;">
                ${p.prioridad}
              </span>
              <span style="color: #1F2937; font-size: 1.25rem; font-weight: bold;">
                $${parseFloat(p.monto || 0).toLocaleString('es-MX')}
              </span>
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-direction: column;">
            <button class="btn btn-sm" style="background: #10B981; color: white;" onclick="generarCuotasProyecto(${p.id}, '${p.nombre}', ${p.monto})">
              <i class="fas fa-money-bill-wave"></i> Generar Cuotas
            </button>
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-sm btn-secondary" onclick="editarProyectoMain(${p.id})">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-sm btn-danger" onclick="eliminarProyectoMain(${p.id})">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // Actualizar resumen
  document.getElementById('proyectos-total-main').textContent = `$${(resumen.total || 0).toLocaleString('es-MX')}`;
  document.getElementById('proyectos-por-depto-main').textContent = `$${(resumen.porDepartamento || 0).toLocaleString('es-MX')}`;
  document.getElementById('proyectos-unidades-main').textContent = resumen.totalUnidades || 0;
}

// Botón nuevo proyecto en sección principal
const nuevoProyectoMainBtn = document.getElementById('nuevo-proyecto-btn-main');
if (nuevoProyectoMainBtn) {
  nuevoProyectoMainBtn.addEventListener('click', () => {
    console.log('➕ Nuevo Proyecto');
    showModal('proyecto-modal-main');
    resetProyectoMainForm();
  });
}

function resetProyectoMainForm() {
  const form = document.getElementById('proyecto-form-main');
  if (form) {
    form.reset();
    document.getElementById('proyecto-id-main').value = '';
    document.getElementById('proyecto-modal-title-main').textContent = 'Nuevo Proyecto';
  }
}

async function editarProyectoMain(id) {
  console.log('✏️ Editar proyecto:', id);
  alert('Función de edición en desarrollo');
}

async function eliminarProyectoMain(id) {
  if (!confirm('¿Eliminar este proyecto?')) return;
  
  console.log('🗑️ Eliminar proyecto:', id);
  eliminarProyectoMainReal(id); return;
}

// Form de proyecto principal
const proyectoFormMain = document.getElementById('proyecto-form-main');
if (proyectoFormMain) {
  proyectoFormMain.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('💾 Guardando proyecto...');
    
    const nombre = document.getElementById('proyecto-nombre-main').value;
    const monto = parseFloat(document.getElementById('proyecto-monto-main').value);
    const prioridad = document.getElementById('proyecto-prioridad-main').value;
    const descripcion = document.getElementById('proyecto-descripcion-main').value;
    
    try {
      const token = localStorage.getItem('edificio_token');
      const response = await fetch('/api/proyectos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ nombre, monto, prioridad, descripcion })
      });
      
      if (response.ok) {
        const data = await response.json();
        alert('✅ ' + (data.msg || data.message || 'Proyecto creado'));
        hideModal('proyecto-modal-main');
        cargarProyectosMain();
      } else {
        const error = await response.json();
        alert('❌ Error: ' + (error.msg || error.message));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al guardar proyecto');
    }
  });
}

async function eliminarProyectoMainReal(id) {
  try {
    const token = localStorage.getItem('edificio_token');
    const response = await fetch(`/api/proyectos/${id}`, {
      method: 'DELETE',
      headers: { 'x-auth-token': token }
    });
    
    if (response.ok) {
      const data = await response.json();
      alert(`✅ ${data.msg}\n\n${data.cuotasLimpiadas > 0 ? `Se limpiaron ${data.cuotasLimpiadas} cuotas extraordinarias.` : 'No había cuotas asociadas.'}`);
      cargarProyectosMain();
      
      // Si hay cuotas visibles, recargarlas para ver los cambios
      const cuotasSection = document.getElementById('cuotas-section');
      if (cuotasSection && cuotasSection.style.display !== 'none') {
        filtrarCuotas();
      }
    } else {
      const error = await response.json();
      alert('❌ Error: ' + (error.msg || error.message));
    }
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error al eliminar');
  }
}

// Generar cuotas extraordinarias para un proyecto
async function generarCuotasProyecto(proyectoId, nombreProyecto, montoTotal) {
  try {
    // Obtener info del building para saber cuántas unidades
    const token = localStorage.getItem('edificio_token');
    const buildingRes = await fetch('/api/onboarding/building-info', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!buildingRes.ok) {
      alert('Error al obtener información del edificio');
      return;
    }
    
    const buildingData = await buildingRes.json();
    const totalUnidades = buildingData.buildingInfo.totalUnidades || 20;
    const montoPorUnidad = montoTotal / totalUnidades;
    
    const confirmar = confirm(
      `¿Generar cuotas extraordinarias para el proyecto?\n\n` +
      `Proyecto: ${nombreProyecto}\n` +
      `Monto total: $${montoTotal.toLocaleString('es-MX')}\n` +
      `Total unidades: ${totalUnidades}\n` +
      `Monto por unidad: $${montoPorUnidad.toLocaleString('es-MX')}\n\n` +
      `Se generarán ${totalUnidades} cuotas extraordinarias.`
    );
    
    if (!confirmar) return;
    
    // Solicitar mes y año
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const hoy = new Date();
    const mesActual = meses[hoy.getMonth()];
    const anioActual = hoy.getFullYear();
    
    const mes = prompt(`¿Para qué mes generar las cuotas?`, mesActual);
    if (!mes) return;
    
    const anio = prompt(`¿Qué año?`, anioActual);
    if (!anio) return;
    
    console.log(`⚡ Agregando monto extraordinario a cuotas de ${mes} ${anio}...`);
    
    const response = await fetch('/api/cuotas/agregar-extraordinaria', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({
        mes: mes,
        anio: parseInt(anio),
        montoTotal: montoTotal,
        concepto: `Proyecto: ${nombreProyecto}`
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      alert(
        `✅ ${data.message}\n\n` +
        `Cuotas actualizadas: ${data.cuotasActualizadas}\n` +
        `Monto por unidad: $${parseFloat(data.montoPorUnidad).toLocaleString('es-MX')}\n` +
        `Total proyecto: $${montoTotal.toLocaleString('es-MX')}\n\n` +
        `Las cuotas ahora incluyen el monto extraordinario del proyecto.`
      );
      
      // Recargar cuotas para ver actualizadas
      filtrarCuotas();
    } else {
      const error = await response.json();
      alert('❌ Error: ' + (error.message || 'No se pudo agregar el monto extraordinario'));
    }
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error al generar cuotas del proyecto');
  }
}

// Gráfico de Balance (Ingresos vs Egresos últimos 6 meses)
function renderBalanceChart(cuotas, gastos) {
  const container = document.getElementById('balance-chart');
  if (!container) return;

  const canvas = document.createElement('canvas');
  container.innerHTML = '';
  container.appendChild(canvas);

  // Calcular últimos 6 meses
  const hoy = new Date();
  const meses = [];
  const ingresosPorMes = [];
  const egresosPorMes = [];

  for (let i = 5; i >= 0; i--) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const mesNombre = fecha.toLocaleString('es-MX', { month: 'short' });
    const anio = fecha.getFullYear();
    const mesIndex = fecha.getMonth();

    meses.push(mesNombre);

    // Ingresos del mes
    const ingresos = (cuotas || [])
      .filter(c => c.pagado && c.anio === anio && 
        ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][mesIndex] === c.mes)
      .reduce((sum, c) => sum + parseFloat(c.monto || 0) + parseFloat(c.monto_extraordinario || 0), 0);

    // Egresos del mes
    const egresos = (gastos || [])
      .filter(g => {
        const fechaGasto = new Date(g.fecha);
        return fechaGasto.getMonth() === mesIndex && fechaGasto.getFullYear() === anio;
      })
      .reduce((sum, g) => sum + parseFloat(g.monto || 0), 0);

    ingresosPorMes.push(ingresos);
    egresosPorMes.push(egresos);
  }

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: meses,
      datasets: [
        {
          label: 'Ingresos',
          data: ingresosPorMes,
          backgroundColor: '#10B981'
        },
        {
          label: 'Egresos',
          data: egresosPorMes,
          backgroundColor: '#EF4444'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// Gráfico de Gastos por Categoría
function renderGastosCategoria(gastos) {
  const container = document.getElementById('gastos-categoria-chart');
  if (!container) return;

  const canvas = document.createElement('canvas');
  container.innerHTML = '';
  container.appendChild(canvas);

  // Agrupar por categoría
  const categorias = {};
  (gastos || []).forEach(g => {
    const cat = g.categoria || 'OTROS';
    categorias[cat] = (categorias[cat] || 0) + parseFloat(g.monto || 0);
  });

  const labels = Object.keys(categorias);
  const data = Object.values(categorias);

  const colores = {
    'MANTENIMIENTO': '#3B82F6',
    'SERVICIOS': '#10B981',
    'REPARACIONES': '#F59E0B',
    'ADMINISTRATIVO': '#8B5CF6',
    'OTROS': '#6B7280'
  };

  new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: labels.map(l => colores[l] || '#6B7280')
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = data.reduce((a, b) => a + b, 0);
              const percent = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: $${context.parsed.toLocaleString('es-MX')} (${percent}%)`;
            }
          }
        }
      }
    }
  });
}
