// admin-management.js - Funcionalidad para la interfaz de gestión de admins

class AdminManagement {
  constructor() {
    this.admins = [];
    this.edificios = [];
    this.adminAModificar = null;
    this.token = localStorage.getItem('token');
    
    if (!this.token) {
      alert('No hay sesión activa. Por favor inicie sesión.');
      window.location.href = '/login.html';
      return;
    }
    
    this.init();
  }

  init() {
    this.cargarDatos();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Event listeners para botones
    document.getElementById('btnAgregarAdmin').addEventListener('click', () => this.mostrarModalAgregar());
    document.getElementById('adminForm').addEventListener('submit', (e) => this.guardarAdmin(e));
    
    // Event listeners para filtros
    document.getElementById('filtroEstado').addEventListener('change', () => this.filtrarAdmins());
    document.getElementById('filtroEdificio').addEventListener('change', () => this.filtrarAdmins());
    document.getElementById('filtroBusqueda').addEventListener('input', () => this.filtrarAdmins());
    
    // Event listeners para cerrar modales
    document.querySelectorAll('.close').forEach(span => {
      span.addEventListener('click', () => {
        document.getElementById('adminModal').style.display = 'none';
        document.getElementById('eliminarModal').style.display = 'none';
      });
    });
    
    document.getElementById('btnCancelarModal').addEventListener('click', () => {
      document.getElementById('adminModal').style.display = 'none';
    });
    
    document.getElementById('btnCancelarEliminar').addEventListener('click', () => {
      document.getElementById('eliminarModal').style.display = 'none';
    });
    
    document.getElementById('btnConfirmarEliminar').addEventListener('click', () => this.confirmarEliminarAdmin());
    
    // Cerrar modal al hacer clic fuera del contenido
    window.addEventListener('click', (event) => {
      if (event.target === document.getElementById('adminModal')) {
        document.getElementById('adminModal').style.display = 'none';
      }
      if (event.target === document.getElementById('eliminarModal')) {
        document.getElementById('eliminarModal').style.display = 'none';
      }
    });
  }

  async cargarDatos() {
    try {
      // Mostrar loading
      this.showLoading(true);
      
      // Cargar admins
      const adminsResponse = await this.fetchAuth('/api/admin-management');
      this.admins = adminsResponse.admins || [];
      
      // Cargar edificios (esto podría venir de otra API endpoint)
      // Por ahora, simulamos algunos edificios
      this.edificios = [
        { id: 1, nombre: "Edificio Plaza Mayor" },
        { id: 2, nombre: "Torres del Sol" },
        { id: 3, nombre: "Condominio Los Pinos" },
        { id: 4, nombre: "Residencial San Carlos" },
        { id: 5, nombre: "Parque Central" }
      ];
      
      // Llenar el select de edificios
      this.llenarSelectEdificios();
      
      // Renderizar admins
      this.renderizarAdmins(this.admins);
      
      // Actualizar estadísticas
      this.actualizarEstadisticas();
      
      // Ocultar loading
      this.showLoading(false);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.showLoading(false);
      alert('Error al cargar los datos: ' + error.message);
    }
  }

  async fetchAuth(url, options = {}) {
    // Asegurarse de que la URL sea absoluta
    const fullUrl = url.startsWith('/') ? `${window.location.origin}${url}` : url;

    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  llenarSelectEdificios() {
    const adminEdificio = document.getElementById('adminEdificio');
    const filtroEdificio = document.getElementById('filtroEdificio');
    
    // Limpiar opciones
    adminEdificio.innerHTML = '<option value="">Seleccione un edificio</option>';
    filtroEdificio.innerHTML = '<option value="todos">Todos</option>';
    
    // Agregar opciones
    this.edificios.forEach(edificio => {
      // Para el formulario de admin
      const option1 = document.createElement('option');
      option1.value = edificio.id;
      option1.textContent = edificio.nombre;
      adminEdificio.appendChild(option1);
      
      // Para el filtro
      const option2 = document.createElement('option');
      option2.value = edificio.id.toString();
      option2.textContent = edificio.nombre;
      filtroEdificio.appendChild(option2);
    });
  }

  renderizarAdmins(adminsAFiltrar) {
    const adminsTableBody = document.getElementById('adminsTableBody');
    adminsTableBody.innerHTML = '';
    
    if (!adminsAFiltrar || adminsAFiltrar.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="8" style="text-align: center;">No se encontraron administradores</td>';
      adminsTableBody.appendChild(row);
      return;
    }
    
    adminsAFiltrar.forEach(admin => {
      const row = document.createElement('tr');
      
      // Obtener nombre del edificio
      const edificio = this.edificios.find(e => e.id === admin.edificioId);
      const nombreEdificio = edificio ? edificio.nombre : 'No asignado';
      
      row.innerHTML = `
        <td>${admin.id}</td>
        <td><strong>${admin.nombre}</strong></td>
        <td>${admin.email}</td>
        <td>${nombreEdificio}</td>
        <td>
          <span class="badge ${admin.rol === 'SUPERADMIN' ? 'badge-danger' : 'badge-primary'}">
            ${admin.rol === 'SUPERADMIN' ? 'Super Admin' : 'Admin'}
          </span>
        </td>
        <td>
          <span class="badge ${admin.estado === 'activo' ? 'badge-success' : 'badge-warning'}">
            ${admin.estado.charAt(0).toUpperCase() + admin.estado.slice(1)}
          </span>
        </td>
        <td>${new Date(admin.fechaCreacion).toLocaleDateString()}</td>
        <td class="actions-cell">
          <button class="btn btn-primary btn-sm" onclick="adminManagement.editarAdmin(${admin.id})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-warning btn-sm" onclick="adminManagement.resetearPassword(${admin.id})">
            <i class="fas fa-key"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="adminManagement.mostrarModalEliminar(${admin.id}, '${admin.nombre.replace(/'/g, "\\'")}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      
      adminsTableBody.appendChild(row);
    });
  }

  actualizarEstadisticas() {
    document.getElementById('totalAdmins').textContent = this.admins.length;
    document.getElementById('activosCount').textContent = this.admins.filter(a => a.estado === 'activo').length;
    document.getElementById('inactivosCount').textContent = this.admins.filter(a => a.estado === 'inactivo').length;
    
    // Contar edificios únicos
    const edificiosUnicos = [...new Set(this.admins.map(a => a.edificioId))].filter(id => id !== null);
    document.getElementById('edificiosCount').textContent = edificiosUnicos.length;
  }

  filtrarAdmins() {
    const estado = document.getElementById('filtroEstado').value;
    const edificioId = document.getElementById('filtroEdificio').value;
    const busqueda = document.getElementById('filtroBusqueda').value.toLowerCase();
    
    let adminsFiltrados = [...this.admins];
    
    // Filtrar por estado
    if (estado !== 'todos') {
      adminsFiltrados = adminsFiltrados.filter(admin => admin.estado === estado);
    }
    
    // Filtrar por edificio
    if (edificioId !== 'todos') {
      adminsFiltrados = adminsFiltrados.filter(admin => admin.edificioId === parseInt(edificioId));
    }
    
    // Filtrar por búsqueda
    if (busqueda) {
      adminsFiltrados = adminsFiltrados.filter(admin => 
        admin.nombre.toLowerCase().includes(busqueda) || 
        admin.email.toLowerCase().includes(busqueda)
      );
    }
    
    this.renderizarAdmins(adminsFiltrados);
  }

  mostrarModalAgregar() {
    // Limpiar formulario
    document.getElementById('adminForm').reset();
    document.getElementById('adminId').value = '';
    document.getElementById('passwordHelp').style.display = 'none';
    document.getElementById('permisosSection').style.display = 'none';
    
    // Configurar modal
    document.getElementById('modalTitle').textContent = 'Agregar Nuevo Admin';
    document.getElementById('adminPassword').required = true;
    
    // Mostrar modal
    document.getElementById('adminModal').style.display = 'block';
  }

  async editarAdmin(id) {
    try {
      const admin = await this.fetchAuth(`/api/admin-management/${id}`);
      
      if (!admin || !admin.admin) {
        alert('Administrador no encontrado');
        return;
      }
      
      const adm = admin.admin;
      
      // Rellenar formulario
      document.getElementById('adminId').value = adm.id;
      document.getElementById('adminNombre').value = adm.nombre;
      document.getElementById('adminEmail').value = adm.email;
      document.getElementById('adminEdificio').value = adm.edificioId || '';
      document.getElementById('adminRol').value = adm.rol;
      document.getElementById('adminEstado').value = adm.estado;
      document.getElementById('adminTelefono').value = adm.telefono || '';
      document.getElementById('adminNotas').value = adm.notas || '';
      
      // Mostrar ayuda de contraseña
      document.getElementById('passwordHelp').style.display = 'block';
      document.getElementById('adminPassword').required = false;
      
      // Mostrar sección de permisos para Super Admin
      document.getElementById('permisosSection').style.display = adm.rol === 'SUPERADMIN' ? 'block' : 'none';
      
      // Configurar modal
      document.getElementById('modalTitle').textContent = 'Editar Admin';
      
      // Mostrar modal
      document.getElementById('adminModal').style.display = 'block';
      
      // Guardar referencia
      this.adminAModificar = adm;
    } catch (error) {
      console.error('Error al editar admin:', error);
      alert('Error al cargar los datos del administrador: ' + error.message);
    }
  }

  resetearPassword(id) {
    if (confirm('¿Está seguro de que desea resetear la contraseña de este administrador?')) {
      // Aquí iría la lógica para resetear la contraseña
      // Por ejemplo, enviar un correo con instrucciones para restablecerla
      alert('Funcionalidad de reseteo de contraseña no implementada en esta versión');
    }
  }

  mostrarModalEliminar(id, nombre) {
    document.getElementById('adminAEliminar').textContent = nombre;
    this.adminAModificar = { id, nombre }; // Guardar referencia para eliminar
    document.getElementById('eliminarModal').style.display = 'block';
  }

  async confirmarEliminarAdmin() {
    if (!this.adminAModificar) return;
    
    try {
      await this.fetchAuth(`/api/admin-management/${this.adminAModificar.id}`, {
        method: 'DELETE'
      });
      
      // Actualizar lista local
      this.admins = this.admins.filter(a => a.id !== this.adminAModificar.id);
      
      // Actualizar interfaz
      this.renderizarAdmins(this.admins);
      this.actualizarEstadisticas();
      
      // Cerrar modal
      document.getElementById('eliminarModal').style.display = 'none';
      
      alert('Administrador eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar admin:', error);
      alert('Error al eliminar el administrador: ' + error.message);
    }
  }

  async guardarAdmin(e) {
    e.preventDefault();
    
    try {
      // Obtener datos del formulario
      const formData = {
        nombre: document.getElementById('adminNombre').value,
        email: document.getElementById('adminEmail').value,
        edificioId: parseInt(document.getElementById('adminEdificio').value),
        rol: document.getElementById('adminRol').value,
        estado: document.getElementById('adminEstado').value,
        telefono: document.getElementById('adminTelefono').value,
        notas: document.getElementById('adminNotas').value
      };
      
      // Agregar contraseña si es un nuevo admin o si se proporcionó una nueva
      const password = document.getElementById('adminPassword').value;
      if (password) {
        formData.password = password;
      }
      
      // Validar que se haya seleccionado un edificio
      if (!formData.edificioId) {
        alert('Por favor seleccione un edificio');
        return;
      }
      
      const adminId = document.getElementById('adminId').value;
      let response;
      
      if (adminId) {
        // Actualizar admin existente
        response = await this.fetchAuth(`/api/admin-management/${adminId}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        // Crear nuevo admin
        response = await this.fetchAuth('/api/admin-management', {
          method: 'POST',
          body: JSON.stringify({
            ...formData,
            password: password || 'TempPass123!' // Contraseña temporal si no se proporciona
          })
        });
      }
      
      if (response.ok) {
        // Recargar datos
        this.cargarDatos();
        
        // Cerrar modal
        document.getElementById('adminModal').style.display = 'none';
        
        alert(adminId ? 'Admin actualizado correctamente' : 'Admin agregado correctamente');
      } else {
        alert(response.msg || 'Error al guardar el administrador');
      }
    } catch (error) {
      console.error('Error al guardar admin:', error);
      alert('Error al guardar el administrador: ' + error.message);
    }
  }

  showLoading(show) {
    // Puedes implementar un indicador de carga si lo deseas
    console.log(show ? 'Cargando...' : 'Carga completa');
  }
}

// Inicializar la aplicación cuando se cargue el DOM
document.addEventListener('DOMContentLoaded', function() {
  window.adminManagement = new AdminManagement();
});

// Funciones globales para accesibilidad desde HTML
window.editarAdmin = function(id) {
  if (window.adminManagement) {
    window.adminManagement.editarAdmin(id);
  }
};

window.resetearPassword = function(id) {
  if (window.adminManagement) {
    window.adminManagement.resetearPassword(id);
  }
};

window.mostrarModalEliminar = function(id, nombre) {
  if (window.adminManagement) {
    window.adminManagement.mostrarModalEliminar(id, nombre);
  }
};