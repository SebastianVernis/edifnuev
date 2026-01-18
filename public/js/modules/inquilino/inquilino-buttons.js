// Inquilino Buttons Handler - Funcionalidad para panel de inquilino
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔧 Inquilino Buttons Handler cargado');
  
  // ========== CUOTAS ==========
  const cuotasAnio = document.getElementById('cuotas-año');
  const cuotasEstado = document.getElementById('cuotas-estado');
  
  if (cuotasAnio) {
    cuotasAnio.addEventListener('change', () => {
      console.log('🔍 Filtrando cuotas por año:', cuotasAnio.value);
      cargarCuotasInquilino();
    });
  }
  
  if (cuotasEstado) {
    cuotasEstado.addEventListener('change', () => {
      console.log('🔍 Filtrando cuotas por estado:', cuotasEstado.value);
      cargarCuotasInquilino();
    });
  }
  
  // ========== ANUNCIOS ==========
  const anunciosTipo = document.getElementById('anuncios-tipo');
  if (anunciosTipo) {
    anunciosTipo.addEventListener('change', () => {
      console.log('🔍 Filtrando anuncios por tipo:', anunciosTipo.value);
      cargarAnunciosInquilino();
    });
  }
  
  // ========== PARCIALIDADES ==========
  const reportarParcialidadBtn = document.getElementById('reportar-parcialidad-btn');
  if (reportarParcialidadBtn) {
    reportarParcialidadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('💰 Reportar pago parcialidad');
      showModal('reportar-parcialidad-modal');
      resetParcialidadForm();
    });
  }
  
  // Form reportar parcialidad
  const reportarParcialidadForm = document.getElementById('reportar-parcialidad-form');
  if (reportarParcialidadForm) {
    reportarParcialidadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await reportarPagoParcialidad();
    });
  }
  
  // Setup modal closers
  setupModalClosers();
  
  // Cargar datos iniciales
  cargarDashboardInquilino();
});

// ========== FUNCIONES AUXILIARES ==========

function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'block';
    console.log('✓ Modal abierto:', modalId);
  }
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    console.log('✓ Modal cerrado:', modalId);
  }
}

function resetParcialidadForm() {
  const form = document.getElementById('reportar-parcialidad-form');
  if (form) {
    form.reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('parcialidad-fecha').value = today;
  }
}

async function cargarDashboardInquilino() {
  console.log('📊 Cargando dashboard inquilino...');
  
  const user = Auth.getCurrentUser();
  if (!user) return;
  
  try {
    const token = localStorage.getItem('edificio_token');
    
    // Cargar datos en paralelo (sin parcialidades por ahora)
    const [cuotasRes, anunciosRes, fondosRes] = await Promise.all([
      fetch(`/api/cuotas?departamento=${user.departamento}`, { headers: { 'x-auth-token': token } }),
      fetch('/api/anuncios?limit=5', { headers: { 'x-auth-token': token } }),
      fetch('/api/fondos', { headers: { 'x-auth-token': token } })
    ]);
    
    // Procesar cuotas
    if (cuotasRes.ok) {
      const cuotasData = await cuotasRes.json();
      actualizarDashboardCuotas(cuotasData.cuotas);
    }
    
    // Parcialidades deshabilitadas por ahora
    // TODO: Implementar endpoint de parcialidades
    
    // Procesar anuncios
    if (anunciosRes.ok) {
      const anunciosData = await anunciosRes.json();
      renderAnunciosDashboard(anunciosData.anuncios || []);
    }
    
    // Procesar fondos y cargar más datos
    if (fondosRes.ok) {
      const fondosData = await fondosRes.json();
      const fondos = fondosData.fondos || [];
      const patrimonioTotal = fondos.reduce((sum, f) => sum + parseFloat(f.saldo || 0), 0);
      
      const patrimonioEl = document.getElementById('patrimonio-edificio');
      if (patrimonioEl) {
        patrimonioEl.textContent = `$${patrimonioTotal.toLocaleString('es-MX')}`;
      }
      
      // Cargar gastos y proyectos para métricas
      const gastosRes2 = await fetch('/api/gastos', { headers: { 'x-auth-token': token } });
      if (gastosRes2.ok) {
        const gastosData = await gastosRes2.json();
        const gastos = gastosData.gastos || [];
        
        // Gastos del mes actual
        const hoy = new Date();
        const gastosMes = gastos.filter(g => {
          const fechaG = new Date(g.fecha);
          return fechaG.getMonth() === hoy.getMonth() && fechaG.getFullYear() === hoy.getFullYear();
        });
        const totalGastosMes = gastosMes.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0);
        
        const gastosEl = document.getElementById('gastos-edificio-mes');
        if (gastosEl) {
          gastosEl.textContent = `$${totalGastosMes.toLocaleString('es-MX')}`;
        }
        
        // Renderizar últimos gastos
        const recentGastos = document.getElementById('recent-gastos-edificio');
        if (recentGastos) {
          const ultimos = gastos.slice(-5).reverse();
          if (ultimos.length === 0) {
            recentGastos.innerHTML = '<p style="color: #6B7280; text-align: center; padding: 1rem;">No hay gastos</p>';
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
      
      // Cargar proyectos
      const proyectosRes = await fetch('/api/proyectos', { headers: { 'x-auth-token': token } });
      if (proyectosRes.ok) {
        const proyectosData = await proyectosRes.json();
        const proyectos = proyectosData.proyectos || [];
        
        const proyectosCountEl = document.getElementById('proyectos-activos-count');
        if (proyectosCountEl) {
          proyectosCountEl.textContent = proyectos.length;
        }
      }
    }
    
  } catch (error) {
    console.error('Error cargando dashboard:', error);
  }
}

function actualizarDashboardCuotas(cuotas) {
  if (!cuotas || cuotas.length === 0) return;
  
  // Buscar cuota del mes actual
  const fecha = new Date();
  const mesActual = fecha.toLocaleString('es-MX', { month: 'long' });
  const anioActual = fecha.getFullYear();
  
  const cuotaActual = cuotas.find(c => 
    c.mes.toLowerCase() === mesActual.toLowerCase() && 
    c.anio === anioActual
  );
  
  if (cuotaActual) {
    const estadoElem = document.getElementById('cuota-actual-estado');
    const infoElem = document.getElementById('cuota-actual-info');
    
    if (estadoElem) {
      estadoElem.textContent = cuotaActual.estado;
      estadoElem.className = 'amount';
      
      if (cuotaActual.estado === 'PAGADO') {
        estadoElem.style.color = '#28a745';
      } else if (cuotaActual.estado === 'VENCIDO') {
        estadoElem.style.color = '#dc3545';
      } else {
        estadoElem.style.color = '#ffc107';
      }
    }
    
    if (infoElem) {
      infoElem.textContent = `${cuotaActual.mes} ${cuotaActual.anio} - $${cuotaActual.monto}`;
    }
    
    // Próximo vencimiento
    const vencimientoElem = document.getElementById('proximo-vencimiento');
    const diasElem = document.getElementById('dias-vencimiento');
    
    if (vencimientoElem && cuotaActual.fechaVencimiento) {
      const vencimiento = new Date(cuotaActual.fechaVencimiento);
      vencimientoElem.textContent = vencimiento.toLocaleDateString('es-MX');
      
      if (diasElem) {
        const hoy = new Date();
        const diff = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
        diasElem.textContent = diff > 0 ? diff : 0;
      }
    }
  }
}

function actualizarDashboardParcialidades(data) {
  const pagos = data.pagos || [];
  
  // Solo contar pagos VALIDADOS
  const pagosValidados = pagos.filter(p => p.estado === 'validado');
  const montoValidado = pagosValidados.reduce((sum, p) => sum + p.monto, 0);
  const objetivo = 14250;
  const porcentaje = Math.min((montoValidado / objetivo) * 100, 100);
  const pendiente = Math.max(objetivo - montoValidado, 0);
  
  console.log('💰 Pagos validados:', pagosValidados.length, 'Total:', montoValidado);
  
  // Actualizar dashboard
  const progresoElem = document.getElementById('parcialidades-progreso');
  if (progresoElem) {
    progresoElem.textContent = `${porcentaje.toFixed(1)}%`;
  }
  
  // Actualizar detalles en sección de parcialidades
  const progressBar = document.getElementById('mi-parcialidad-progress');
  if (progressBar) {
    progressBar.style.width = `${porcentaje}%`;
  }
  
  const pagadoElem = document.getElementById('mi-parcialidad-pagado');
  const pendienteElem = document.getElementById('mi-parcialidad-pendiente');
  const porcentajeElem = document.getElementById('mi-parcialidad-porcentaje');
  
  if (pagadoElem) {
    pagadoElem.textContent = `$${montoValidado.toLocaleString()}`;
  }
  
  if (pendienteElem) {
    pendienteElem.textContent = `$${pendiente.toLocaleString()}`;
  }
  
  if (porcentajeElem) {
    porcentajeElem.textContent = `${porcentaje.toFixed(1)}%`;
  }
}

async function cargarCuotasInquilino() {
  console.log('📋 Cargando cuotas inquilino...');
  
  const user = Auth.getCurrentUser();
  if (!user) return;
  
  const anio = document.getElementById('cuotas-año')?.value;
  const estado = document.getElementById('cuotas-estado')?.value;
  
  console.log('🔍 Filtros:', { anio, estado, departamento: user.departamento });
  
  try {
    const token = localStorage.getItem('edificio_token');
    const params = new URLSearchParams();
    
    // SIEMPRE filtrar por departamento del usuario
    params.append('departamento', user.departamento);
    
    if (anio) params.append('anio', anio);
    if (estado && estado !== 'TODOS') params.append('estado', estado);
    
    const url = `/api/cuotas?${params.toString()}`;
    console.log('📡 URL:', url);
    
    const response = await fetch(url, {
      headers: { 'x-auth-token': token }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('📊 Cuotas recibidas:', data.cuotas?.length);
      renderCuotasTable(data.cuotas);
    }
  } catch (error) {
    console.error('Error cargando cuotas:', error);
  }
}

function renderCuotasTable(cuotas) {
  const tbody = document.querySelector('#mis-cuotas-table tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (!cuotas || cuotas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay cuotas registradas</td></tr>';
    return;
  }
  
  cuotas.forEach(cuota => {
    const tr = document.createElement('tr');
    
    const vencimiento = new Date(cuota.fechaVencimiento);
    const fechaPago = cuota.fechaPago ? new Date(cuota.fechaPago).toLocaleDateString('es-MX') : '-';
    
    let estadoClass = '';
    if (cuota.estado === 'PAGADO') estadoClass = 'text-success';
    else if (cuota.estado === 'VENCIDO') estadoClass = 'text-danger';
    else estadoClass = 'text-warning';
    
    tr.innerHTML = `
      <td>${cuota.mes} ${cuota.anio}</td>
      <td>$${cuota.monto.toLocaleString()}</td>
      <td class="${estadoClass}">${cuota.estado}</td>
      <td>${vencimiento.toLocaleDateString('es-MX')}</td>
      <td>${fechaPago}</td>
    `;
    
    tbody.appendChild(tr);
  });
}

async function cargarAnunciosInquilino() {
  console.log('📢 Cargando anuncios...');
  
  const tipo = document.getElementById('anuncios-tipo')?.value;
  
  try {
    const token = localStorage.getItem('edificio_token');
    let url = '/api/anuncios';
    
    if (tipo && tipo !== 'TODOS') url += `?tipo=${tipo}`;
    
    const response = await fetch(url, {
      headers: { 'x-auth-token': token }
    });
    
    if (response.ok) {
      const data = await response.json();
      renderAnuncios(data.anuncios);
    }
  } catch (error) {
    console.error('Error cargando anuncios:', error);
  }
}

function renderAnuncios(anuncios) {
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
    
    let tipoClass = 'bg-secondary';
    if (anuncio.tipo === 'URGENTE') tipoClass = 'bg-danger';
    else if (anuncio.tipo === 'IMPORTANTE') tipoClass = 'bg-warning';
    
    div.innerHTML = `
      <div class="anuncio-header">
        <h4>${anuncio.titulo}</h4>
        <span class="badge ${tipoClass}">${anuncio.tipo}</span>
      </div>
      <div class="anuncio-body">
        <p>${anuncio.contenido}</p>
      </div>
      <div class="anuncio-footer">
        <small>${new Date(anuncio.fechaPublicacion).toLocaleDateString('es-MX')}</small>
      </div>
    `;
    
    container.appendChild(div);
  });
}

async function reportarPagoParcialidad() {
  console.log('📤 Reportando pago de parcialidad...');
  
  const monto = document.getElementById('parcialidad-monto').value;
  const fecha = document.getElementById('parcialidad-fecha').value;
  const comprobante = document.getElementById('parcialidad-comprobante').value;
  const notas = document.getElementById('parcialidad-notas').value;
  
  console.log('📋 Datos:', { monto, fecha, comprobante, notas });
  
  if (!monto || !fecha || !comprobante) {
    alert('Por favor complete todos los campos obligatorios');
    return;
  }
  
  const user = Auth.getCurrentUser();
  if (!user) {
    console.error('❌ Usuario no encontrado');
    return;
  }
  
  console.log('👤 Usuario:', user.departamento);
  
  try {
    const token = localStorage.getItem('edificio_token');
    
    const bodyData = {
      departamento: user.departamento,
      monto: parseFloat(monto),
      fecha,
      comprobante,
      notas
    };
    
    console.log('📤 Enviando a API:', bodyData);
    
    const response = await fetch('/api/parcialidades', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify(bodyData)
    });
    
    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Respuesta:', result);
      alert('✅ Pago reportado exitosamente. Será validado por el administrador.');
      hideModal('reportar-parcialidad-modal');
      cargarDashboardInquilino();
    } else {
      const error = await response.json();
      console.error('❌ Error servidor:', error);
      alert(`❌ Error: ${error.msg || 'No se pudo reportar el pago'}`);
    }
  } catch (error) {
    console.error('❌ Exception:', error);
    alert('❌ Error al reportar el pago: ' + error.message);
  }
}

function renderMisParcialidades(pagos) {
  const tbody = document.querySelector('#mis-parcialidades-table tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (!pagos || pagos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay pagos registrados</td></tr>';
    return;
  }
  
  pagos.forEach(pago => {
    const tr = document.createElement('tr');
    
    const fecha = new Date(pago.fecha).toLocaleDateString('es-MX');
    const estadoClass = pago.estado === 'validado' ? 'text-success' : 'text-warning';
    const estadoTexto = pago.estado === 'validado' ? 'Validado' : 'Pendiente de validación';
    
    tr.innerHTML = `
      <td>${fecha}</td>
      <td>$${pago.monto.toLocaleString()}</td>
      <td>${pago.comprobante || '-'}</td>
      <td class="${estadoClass}">${estadoTexto}</td>
    `;
    
    tbody.appendChild(tr);
  });
  
  console.log(`✅ ${pagos.length} pagos de parcialidades renderizados`);
}

function renderAnunciosDashboard(anuncios) {
  const container = document.getElementById('dashboard-anuncios-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!anuncios || anuncios.length === 0) {
    container.innerHTML = '<p class="text-center">No hay anuncios importantes</p>';
    return;
  }
  
  // Solo mostrar anuncios importantes o urgentes
  const importantes = anuncios.filter(a => a.tipo === 'IMPORTANTE' || a.tipo === 'URGENTE');
  
  importantes.slice(0, 3).forEach(anuncio => {
    const div = document.createElement('div');
    div.className = 'anuncio-card-mini';
    
    const tipoClass = anuncio.tipo === 'URGENTE' ? 'bg-danger' : 'bg-warning';
    
    div.innerHTML = `
      <div class="anuncio-mini-header">
        <strong>${anuncio.titulo}</strong>
        <span class="badge ${tipoClass}">${anuncio.tipo}</span>
      </div>
      <p class="anuncio-mini-content">${anuncio.contenido.substring(0, 100)}${anuncio.contenido.length > 100 ? '...' : ''}</p>
    `;
    
    container.appendChild(div);
  });
  
  console.log(`✅ ${importantes.length} anuncios importantes en dashboard`);
}

let fondosChartInquilinoInstance = null;

function renderFondosChartInquilino(fondos) {
  // Buscar canvas en el dashboard (puede no existir, lo creamos)
  const dashboardSection = document.getElementById('dashboard-section');
  if (!dashboardSection) return;
  
  // Buscar o crear contenedor de gráfico
  let chartContainer = dashboardSection.querySelector('.dashboard-charts');
  if (!chartContainer) {
    chartContainer = document.createElement('div');
    chartContainer.className = 'dashboard-charts';
    chartContainer.innerHTML = `
      <div class="chart-container">
        <h3>Fondos del Edificio</h3>
        <div class="chart" id="fondos-chart-inquilino" style="position: relative; height: 250px;">
          <canvas></canvas>
        </div>
      </div>
    `;
    dashboardSection.querySelector('.dashboard-anuncios').insertAdjacentElement('beforebegin', chartContainer);
  }
  
  const canvas = dashboardSection.querySelector('#fondos-chart-inquilino canvas');
  if (!canvas) return;
  
  // Destruir chart anterior
  if (fondosChartInquilinoInstance) {
    fondosChartInquilinoInstance.destroy();
  }
  
  const ctx = canvas.getContext('2d');
  
  fondosChartInquilinoInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Ahorro Acumulado', 'Gastos Mayores', 'Dinero Operacional'],
      datasets: [{
        data: [
          fondos.ahorroAcumulado || 0,
          fondos.gastosMayores || 0,
          fondos.dineroOperacional || 0
        ],
        backgroundColor: ['#28a745', '#ffc107', '#007bff']
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
  
  console.log('✅ Gráfico de fondos (inquilino) renderizado');
}

function setupModalClosers() {
  // Botones cerrar (X)
  document.querySelectorAll('.modal .close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
      console.log('❌ Click en cerrar modal');
      const modal = this.closest('.modal');
      if (modal) {
        modal.style.display = 'none';
        console.log('✓ Modal cerrado:', modal.id);
      }
    });
  });
  
  // Botones cancelar
  document.querySelectorAll('.modal-cancel').forEach(cancelBtn => {
    cancelBtn.addEventListener('click', function(e) {
      console.log('❌ Click en cancelar');
      e.preventDefault();
      const modal = this.closest('.modal');
      if (modal) {
        modal.style.display = 'none';
        console.log('✓ Modal cerrado:', modal.id);
      }
    });
  });
  
  // Click fuera del modal (usar once para cada modal que se abre)
  // Removido para evitar conflictos - se maneja individualmente
}

// Cargar fondos del edificio (solo lectura)
async function cargarFondosInquilino() {
  console.log('💰 Cargando fondos para inquilino...');
  try {
    const token = localStorage.getItem('edificio_token');
    console.log('   Token presente:', !!token);
    
    const response = await fetch('/api/fondos', {
      headers: { 'x-auth-token': token }
    });
    
    console.log('   Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      const fondos = data.fondos || [];
      const movimientos = data.movimientos || [];
      
      // Renderizar fondos
      const container = document.getElementById('fondos-summary-inquilino');
      if (container && fondos.length > 0) {
        let patrimonioTotal = 0;
        
        container.innerHTML = fondos.map(f => {
          const saldo = parseFloat(f.saldo || 0);
          patrimonioTotal += saldo;
          return `
            <div class="fondo-card">
              <h3>${f.nombre}</h3>
              <p class="amount">$${saldo.toLocaleString('es-MX')}</p>
              <p class="description">Fondo del edificio</p>
            </div>
          `;
        }).join('') + `
          <div class="fondo-card total">
            <h3>Patrimonio Total</h3>
            <p class="amount">$${patrimonioTotal.toLocaleString('es-MX')}</p>
            <p class="description">Actualizado: ${new Date().toLocaleDateString('es-MX')}</p>
          </div>
        `;
      }
      
      // Renderizar movimientos
      const tbody = document.getElementById('movimientos-fondos-tbody');
      if (tbody) {
        if (movimientos.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #6B7280;">No hay movimientos</td></tr>';
        } else {
          tbody.innerHTML = movimientos.slice(0, 20).map(m => {
            const fecha = m.fecha ? m.fecha.split('T')[0].split('-').reverse().join('/') : '-';
            const tipo = m.tipo === 'INGRESO' ? '↑' : '↓';
            const color = m.tipo === 'INGRESO' ? '#10B981' : '#EF4444';
            return `
              <tr>
                <td>${fecha}</td>
                <td style="color: ${color};">${tipo} ${m.tipo}</td>
                <td>${m.fondo_nombre || '-'}</td>
                <td>$${parseFloat(m.monto || 0).toLocaleString('es-MX')}</td>
                <td>${m.concepto || '-'}</td>
              </tr>
            `;
          }).join('');
        }
      }
    }
  } catch (error) {
    console.error('Error cargando fondos:', error);
  }
}

// Cargar gastos del edificio (solo lectura)
async function cargarGastosInquilino() {
  console.log('💸 Cargando gastos para inquilino...');
  try {
    const token = localStorage.getItem('edificio_token');
    console.log('   Token presente:', !!token);
    
    const response = await fetch('/api/gastos', {
      headers: { 'x-auth-token': token }
    });
    
    console.log('   Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      const gastos = data.gastos || [];
      
      const tbody = document.getElementById('gastos-edificio-tbody');
      if (tbody) {
        if (gastos.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #6B7280;">No hay gastos registrados</td></tr>';
        } else {
          tbody.innerHTML = gastos.slice(0, 50).map(g => {
            const fecha = g.fecha ? g.fecha.split('T')[0].split('-').reverse().join('/') : '-';
            return `
              <tr>
                <td>${fecha}</td>
                <td>${g.concepto}</td>
                <td><span class="badge">${g.categoria}</span></td>
                <td>${g.proveedor || '-'}</td>
                <td>$${parseFloat(g.monto || 0).toLocaleString('es-MX')}</td>
              </tr>
            `;
          }).join('');
        }
      }
    }
  } catch (error) {
    console.error('Error cargando gastos:', error);
  }
}

// Cargar proyectos del edificio (solo lectura)
async function cargarProyectosInquilino() {
  try {
    const token = localStorage.getItem('edificio_token');
    const response = await fetch('/api/proyectos', {
      headers: { 'x-auth-token': token }
    });
    
    if (response.ok) {
      const data = await response.json();
      const proyectos = data.proyectos || [];
      
      const container = document.getElementById('proyectos-list-inquilino');
      if (container) {
        if (proyectos.length === 0) {
          container.innerHTML = '<p style="text-align: center; color: #6B7280; padding: 2rem;">No hay proyectos activos</p>';
        } else {
          container.innerHTML = proyectos.map(p => {
            const prioridadColors = {
              'URGENTE': '#EF4444',
              'ALTA': '#F59E0B',
              'MEDIA': '#3B82F6',
              'BAJA': '#6B7280'
            };
            return `
              <div style="border: 2px solid #E5E7EB; border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 1rem; background: white;">
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
            `;
          }).join('');
        }
      }
    }
  } catch (error) {
    console.error('Error cargando proyectos:', error);
  }
}

// Cargar documentos/políticas del edificio
async function cargarDocumentosInquilino() {
  try {
    const token = localStorage.getItem('edificio_token');
    const response = await fetch('/api/onboarding/building-info', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.ok && data.buildingInfo) {
        const info = data.buildingInfo;
        
        const reglamentoEl = document.getElementById('reglamento-content');
        if (reglamentoEl) {
          reglamentoEl.textContent = info.reglamento || 'No hay reglamento disponible';
        }
        
        const privacyEl = document.getElementById('privacy-content');
        if (privacyEl) {
          privacyEl.textContent = info.privacyPolicy || 'No hay política de privacidad disponible';
        }
        
        const paymentEl = document.getElementById('payment-content');
        if (paymentEl) {
          paymentEl.textContent = info.paymentPolicies || 'No hay políticas de pago disponibles';
        }
      }
    }
  } catch (error) {
    console.error('Error cargando documentos:', error);
  }
}
