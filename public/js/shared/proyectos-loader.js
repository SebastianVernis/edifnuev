// Cargar proyectos críticos dinámicamente en las vistas

async function cargarProyectosCriticos() {
  try {
    const token = localStorage.getItem('edificio_token') || localStorage.getItem('token');
    const response = await fetch('/api/proyectos', {
      headers: {
        'x-auth-token': token
      }
    });

    const data = await response.json();

    if (data.ok) {
      actualizarVistaProyectos(data.proyectos, data.resumen);
    } else {
      console.error('Error al cargar proyectos:', data.msg);
    }
  } catch (error) {
    console.error('Error al cargar proyectos:', error);
  }
}

function actualizarVistaProyectos(proyectos, resumen) {
  // Para inquilino.html
  const listInquilino = document.getElementById('proyectos-criticos-list');
  const totalInquilino = document.getElementById('proyectos-total');
  const porDeptoInquilino = document.getElementById('proyectos-por-depto');

  if (listInquilino) {
    if (proyectos.length === 0) {
      listInquilino.innerHTML = '<li>No hay proyectos configurados</li>';
    } else {
      listInquilino.innerHTML = proyectos.map(p => `
        <li><strong>${p.nombre}:</strong> $${p.monto.toLocaleString()} MXN ${p.prioridad === 'URGENTE' ? '(URGENTE)' : ''}</li>
      `).join('');
    }
  }

  if (totalInquilino) {
    totalInquilino.textContent = `$${resumen.total.toLocaleString()} MXN`;
  }

  if (porDeptoInquilino) {
    porDeptoInquilino.textContent = `$${resumen.porDepartamento.toLocaleString()} MXN`;
  }

  // Para admin.html
  const listAdmin = document.getElementById('proyectos-criticos-list-admin');
  const totalAdmin = document.getElementById('proyectos-total-admin');
  const porDeptoAdmin = document.getElementById('proyectos-por-depto-admin');

  if (listAdmin) {
    if (proyectos.length === 0) {
      listAdmin.innerHTML = '<li>No hay proyectos configurados</li>';
    } else {
      listAdmin.innerHTML = proyectos.map(p => `
        <li><strong>${p.nombre}:</strong> $${p.monto.toLocaleString()} MXN ${p.prioridad === 'URGENTE' ? '(URGENTE)' : ''}</li>
      `).join('');
    }
  }

  if (totalAdmin) {
    totalAdmin.textContent = `$${resumen.total.toLocaleString()} MXN`;
  }

  if (porDeptoAdmin) {
    porDeptoAdmin.textContent = `$${resumen.porDepartamento.toLocaleString()} MXN`;
  }
}

// Cargar proyectos al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  // Cargar cuando se muestre la sección de parcialidades
  const parcialidadesSection = document.getElementById('parcialidades-section');

  if (parcialidadesSection) {
    // Observer para detectar cuando se muestra la sección
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (parcialidadesSection.classList.contains('active')) {
          cargarProyectosCriticos();
        }
      });
    });

    observer.observe(parcialidadesSection, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Si ya está activa, cargar inmediatamente
    if (parcialidadesSection.classList.contains('active')) {
      cargarProyectosCriticos();
    }
  }
});
